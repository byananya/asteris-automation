import { Between, DataSource, IsNull, Repository } from 'typeorm';
import { AppDataSource } from '../config/data-source.js';
import { Invoice } from '../entities/Invoice.js';
import { Payout } from '../entities/Payout.js';
import { logger } from '../utils/logger.js';

interface MatchResult {
    invoiceId: string;
    payoutId: string | null;
    invoiceAmount: number;
    payoutAmount: number;
    fee: number;
    status: 'matched' | 'partial' | 'unmatched';
    confidence: number;
}

export interface ReconciliationParams {
    startDate?: string;
    endDate?: string;
    matchThreshold?: number;
    customerName?: string;
    status?: string;
}

export interface ReconciliationResult {
    id: string;
    timestamp: string;
    summary: {
        totalInvoices: number;
        matchedInvoices: number;
        unmatchedInvoices: number;
        totalAmount: number;
        matchedAmount: number;
        unmatchedAmount: number;
        processingTime: string;
    };
    matches: Array<{
        invoiceId: string;
        payoutId: string | null;
        invoiceAmount: number;
        payoutAmount: number;
        fee: number;
        status: 'matched' | 'partial' | 'unmatched';
        confidence: number;
    }>;
    issues: Array<{
        type: string;
        count: number;
        totalAmount: number;
        message: string;
    }>;
}

export class ReconciliationService {
    private invoiceRepository: Repository<Invoice>;
    private payoutRepository: Repository<Payout>;
    private dataSource: DataSource;

    constructor(dataSource = AppDataSource) {
        this.dataSource = dataSource;
        this.invoiceRepository = this.dataSource.getRepository(Invoice);
        this.payoutRepository = this.dataSource.getRepository(Payout);
    }

    public async reconcileInvoices(params: ReconciliationParams = {}): Promise<ReconciliationResult> {
        const startTime = process.hrtime();
        
        try {
            // Verify database connection
            if (!this.dataSource.isInitialized) {
                await this.dataSource.initialize();
            }
            // Build date range filter
            const dateFilter: any = {};
            if (params.startDate && params.endDate) {
                dateFilter.issueDate = Between(
                    new Date(params.startDate),
                    new Date(params.endDate)
                );
            }

            // Build additional filters
            const where: any = { ...dateFilter };
            if (params.customerName) {
                where.customerName = params.customerName;
            }
            if (params.status) {
                where.status = params.status;
            }

            // Fetch invoices from database
            const invoices = await this.invoiceRepository.find({
                where,
                order: { issueDate: 'DESC' },
                relations: ['payouts']
            });

            logger.info(`Found ${invoices.length} invoices for reconciliation`);

            // Fetch unmatched payouts (those not linked to any invoice)
            const payouts = await this.payoutRepository.find({
                where: { invoice: IsNull() },
                order: { transactionDate: 'DESC' }
            });

            logger.info(`Found ${payouts.length} unmatched payouts for reconciliation`);

            // Initialize reconciliation results
            const matches: MatchResult[] = [];
            const matchedPayoutIds = new Set<string>();
            const threshold = params.matchThreshold || 0.9; // 90% match threshold

            // First pass: Process invoices with existing payouts
            for (const invoice of invoices) {
                if (invoice.payouts && invoice.payouts.length > 0) {
                    const totalPaid = invoice.payouts.reduce((sum, p) => sum + p.amount, 0);
                    const status = Math.abs(invoice.amount - totalPaid) < 0.01 ? 'matched' as const : 'partial' as const;
                    
                    matches.push({
                        invoiceId: invoice.id,
                        payoutId: invoice.payouts[0].id,
                        invoiceAmount: invoice.amount,
                        payoutAmount: totalPaid,
                        fee: 0, // Already included in the payout amount
                        status,
                        confidence: 1.0
                    });
                    
                    // Mark these payouts as matched
                    invoice.payouts.forEach(p => matchedPayoutIds.add(p.id));
                    continue;
                }

                // For invoices without payouts, try to find a match
                const bestMatch = this.findBestPayoutMatch(invoice, payouts, matchedPayoutIds, threshold);
                
                if (bestMatch) {
                    matchedPayoutIds.add(bestMatch.payout.id);
                    
                    matches.push({
                        invoiceId: invoice.id,
                        payoutId: bestMatch.payout.id,
                        invoiceAmount: invoice.amount,
                        payoutAmount: bestMatch.payout.amount,
                        fee: bestMatch.payout.fee || 0,
                        status: bestMatch.status,
                        confidence: bestMatch.confidence
                    });
                } else {
                    // No match found
                    matches.push({
                        invoiceId: invoice.id,
                        payoutId: null,
                        invoiceAmount: invoice.amount,
                        payoutAmount: 0,
                        fee: 0,
                        status: 'unmatched',
                        confidence: 0
                    });
                }
            }

            // Calculate summary statistics
            const matchedInvoices = matches.filter(m => m.status === 'matched' || m.status === 'partial').length;
            const unmatchedInvoices = matches.length - matchedInvoices;
            const totalAmount = matches.reduce((sum, m) => sum + m.invoiceAmount, 0);
            const matchedAmount = matches
                .filter(m => m.status === 'matched' || m.status === 'partial')
                .reduce((sum, m) => sum + m.payoutAmount, 0);
            const unmatchedAmount = totalAmount - matchedAmount;

            // Generate issues report
            const issues = this.generateIssuesReport(matches);

            // Calculate processing time
            const [seconds, nanoseconds] = process.hrtime(startTime);
            const processingTime = `${(seconds * 1000 + nanoseconds / 1e6).toFixed(2)}ms`;

            // Return the reconciliation result
            return {
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                summary: {
                    totalInvoices: matches.length,
                    matchedInvoices,
                    unmatchedInvoices,
                    totalAmount: parseFloat(totalAmount.toFixed(2)),
                    matchedAmount: parseFloat(matchedAmount.toFixed(2)),
                    unmatchedAmount: parseFloat(unmatchedAmount.toFixed(2)),
                    processingTime
                },
                matches: matches.map(match => ({
                    invoiceId: match.invoiceId,
                    payoutId: match.payoutId,
                    invoiceAmount: parseFloat(match.invoiceAmount.toFixed(2)),
                    payoutAmount: parseFloat((match.payoutAmount || 0).toFixed(2)),
                    fee: parseFloat((match.fee || 0).toFixed(2)),
                    status: match.status,
                    confidence: parseFloat((match.confidence || 0).toFixed(4))
                })),
                issues
            };
        } catch (error) {
            logger.error('Error during invoice reconciliation:', error);
            throw new Error(`Failed to reconcile invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private findBestPayoutMatch(
        invoice: Invoice,
        payouts: Payout[],
        matchedPayoutIds: Set<string>,
        threshold: number
    ): { payout: Payout; status: 'matched' | 'partial'; confidence: number } | null {
        // Filter out already matched payouts
        const availablePayouts = payouts.filter(p => !matchedPayoutIds.has(p.id));
        
        if (availablePayouts.length === 0) {
            return null;
        }

        // Score each potential match
        const scoredPayouts = availablePayouts.map(payout => {
            const amountDiff = Math.abs(invoice.amount - payout.amount);
            const amountMatchRatio = 1 - (amountDiff / invoice.amount);
            
            // Calculate date difference (lower is better)
            const invoiceDate = invoice.dueDate ? new Date(invoice.dueDate).getTime() : 0;
            const payoutDate = payout.transactionDate ? new Date(payout.transactionDate).getTime() : 0;
            const dateDiff = Math.abs(invoiceDate - payoutDate);
            
            // Simple scoring: 70% weight on amount match, 30% on date proximity
            const score = (amountMatchRatio * 0.7) + 
                         (1 - Math.min(1, dateDiff / (30 * 24 * 60 * 60 * 1000))) * 0.3;
            
            return { payout, amountMatchRatio, score };
        });

        // Sort by score in descending order
        scoredPayouts.sort((a, b) => b.score - a.score);
        
        const bestMatch = scoredPayouts[0];
        
        // Only return a match if it meets the threshold
        if (bestMatch.amountMatchRatio >= threshold) {
            return {
                payout: bestMatch.payout,
                status: bestMatch.amountMatchRatio >= 0.99 ? 'matched' : 'partial',
                confidence: bestMatch.score
            };
        }
        
        return null;
    }

    private generateIssuesReport(matches: MatchResult[]) {
        const issues: Array<{
            type: string;
            count: number;
            totalAmount: number;
            message: string;
        }> = [];

        // Check for partial matches
        const partialMatches = matches.filter(m => m.status === 'partial');
        if (partialMatches.length > 0) {
            const totalAmount = partialMatches.reduce((sum, m) => sum + m.payoutAmount, 0);
            issues.push({
                type: 'partial_matches',
                count: partialMatches.length,
                totalAmount: parseFloat(totalAmount.toFixed(2)),
                message: `${partialMatches.length} invoices have partial matches with payouts`
            });
        }

        // Check for unmatched invoices
        const unmatchedInvoices = matches.filter(m => m.status === 'unmatched');
        if (unmatchedInvoices.length > 0) {
            const totalAmount = unmatchedInvoices.reduce((sum, m) => sum + m.invoiceAmount, 0);
            issues.push({
                type: 'unmatched_invoices',
                count: unmatchedInvoices.length,
                totalAmount: parseFloat(totalAmount.toFixed(2)),
                message: `${unmatchedInvoices.length} invoices have no matching payouts`
            });
        }

        return issues;
    }
}

export const reconciliationService = new ReconciliationService();
