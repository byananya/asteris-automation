import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../config/data-source.js';
import { logger } from '../utils/consoleLogger.js'; // Using console-based logger for ES modules
// Initialize database connection
async function getDbConnection() {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }
    return AppDataSource;
}
export const reconcileInvoices = async (params = {}) => {
    const startTime = process.hrtime();
    const db = await getDbConnection();
    try {
        // Build date range filter
        let dateFilter = '';
        if (params.startDate && params.endDate) {
            dateFilter = `WHERE i.issue_date BETWEEN '${params.startDate}' AND '${params.endDate}'`;
        }
        // Build additional filters
        const filters = [];
        if (params.status) {
            filters.push(`i.status = '${params.status}'`);
        }
        const whereClause = filters.length > 0
            ? `${dateFilter ? dateFilter + ' AND ' : 'WHERE '}${filters.join(' AND ')}`
            : dateFilter;
        // Fetch invoices from database
        const invoices = await db.query(`
            SELECT i.*, p.id as payout_id, p.amount as payout_amount, p.status as payout_status, p.transaction_date
            FROM invoices i
            LEFT JOIN payouts p ON i.id = p.invoice_id
            ${whereClause}
            ORDER BY i.issue_date DESC
        `);
        logger.info(`Found ${invoices.length} invoice records for reconciliation`);
        // Group invoices with their payouts
        const invoiceMap = new Map();
        invoices.forEach((row) => {
            if (!invoiceMap.has(row.id)) {
                const newInvoice = {
                    id: row.id,
                    invoice_number: row.invoice_number,
                    amount: row.amount,
                    customer_name: row.customer_name,
                    issue_date: row.issue_date,
                    due_date: row.due_date,
                    status: row.status,
                    payouts: row.payout_id ? [{
                            id: row.payout_id,
                            amount: row.payout_amount || '0',
                            status: row.payout_status || '',
                            transaction_date: row.transaction_date || new Date().toISOString()
                        }] : []
                };
                invoiceMap.set(row.id, newInvoice);
            }
            else if (row.payout_id) {
                const existing = invoiceMap.get(row.id);
                if (existing && row.payout_id) {
                    existing.payouts.push({
                        id: row.payout_id,
                        amount: row.payout_amount || '0',
                        status: row.payout_status || '',
                        transaction_date: row.transaction_date || new Date().toISOString()
                    });
                }
            }
        });
        const invoicesWithPayouts = Array.from(invoiceMap.values());
        // Fetch unmatched payouts (those not linked to any invoice)
        const payouts = await db.query(`
            SELECT * FROM payouts 
            WHERE invoice_id IS NULL 
            ORDER BY transaction_date DESC
        `);
        logger.info(`Found ${payouts.length} unmatched payouts for reconciliation`);
        // Match invoices with payouts
        const matches = [];
        const issues = [];
        let matchedCount = 0;
        let unmatchedCount = 0;
        let matchedAmount = 0;
        let unmatchedAmount = 0;
        // Process each invoice
        for (const invoice of invoicesWithPayouts) {
            const match = {
                invoiceId: invoice.id,
                payoutId: null,
                invoiceAmount: parseFloat(invoice.amount),
                payoutAmount: 0,
                fee: 0,
                status: 'unmatched',
                confidence: 0,
                invoiceNumber: invoice.invoice_number,
                customerName: invoice.customer_name,
                issueDate: invoice.issue_date,
                dueDate: invoice.due_date,
                invoiceStatus: invoice.status,
                payoutDate: invoice.payouts[0]?.transaction_date,
                payoutStatus: invoice.payouts[0]?.status
            };
            // Check if invoice has payouts
            if (invoice.payouts && invoice.payouts.length > 0) {
                const payout = invoice.payouts[0]; // Take first payout for now
                match.payoutId = payout.id;
                match.payoutAmount = parseFloat(payout.amount);
                match.fee = match.invoiceAmount - match.payoutAmount;
                const amountDiff = Math.abs(match.fee);
                if (amountDiff < 0.01) {
                    match.status = 'matched';
                    match.confidence = 1.0;
                }
                else {
                    match.status = 'partial';
                    match.confidence = 0.8;
                    // Log partial match issue
                    issues.push({
                        type: 'partial_match',
                        count: 1,
                        totalAmount: amountDiff,
                        message: `Partial match for invoice ${invoice.invoice_number}: ${match.invoiceAmount} vs ${match.payoutAmount}`
                    });
                }
                matchedCount++;
                matchedAmount += match.invoiceAmount;
            }
            else {
                unmatchedCount++;
                unmatchedAmount += match.invoiceAmount;
                // Log issue for unmatched invoice
                issues.push({
                    type: 'unmatched_invoice',
                    count: 1,
                    totalAmount: match.invoiceAmount,
                    message: `No matching payout found for invoice ${invoice.invoice_number} (${match.invoiceAmount})`
                });
            }
            matches.push(match);
        }
        // Process remaining unmatched payouts
        for (const payout of payouts) {
            issues.push({
                type: 'unmatched_payout',
                count: 1,
                totalAmount: parseFloat(payout.amount),
                message: `No matching invoice found for payout ${payout.id} (${payout.amount})`
            });
        }
        // Calculate summary
        const totalInvoices = invoicesWithPayouts.length;
        const totalAmount = invoicesWithPayouts.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
        // Calculate processing time
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const processingTimeMs = (seconds * 1000) + (nanoseconds / 1000000);
        // Create result
        const result = {
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            summary: {
                totalInvoices,
                matchedInvoices: matchedCount,
                unmatchedInvoices: unmatchedCount,
                totalAmount,
                matchedAmount,
                unmatchedAmount,
                processingTime: `${processingTimeMs.toFixed(2)}ms`
            },
            matches,
            issues
        };
        logger.info(`Reconciliation completed in ${processingTimeMs.toFixed(2)}ms`);
        logger.info(`Matched: ${matchedCount}, Unmatched: ${unmatchedCount}`);
        return result;
    }
    catch (error) {
        logger.error('Error during invoice reconciliation:', error);
        throw new Error(`Failed to reconcile invoices: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
