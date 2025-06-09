import { AppDataSource } from '../src/config/data-source.js';
import { reconciliationService } from '../src/services/reconciliationService.js';
import { Invoice } from '../src/entities/Invoice.js';
import { Payout } from '../src/entities/Payout.js';
import { faker } from '@faker-js/faker';
import { subDays, format, addDays } from 'date-fns';
import { logger } from '../src/utils/logger.js';

async function createTestData() {
  const invoiceRepo = AppDataSource.getRepository(Invoice);
  const payoutRepo = AppDataSource.getRepository(Payout);
  
  // Clear existing test data
  await payoutRepo.delete({});
  await invoiceRepo.delete({});
  
  // Create test invoices
  const invoices: Invoice[] = [];
  const today = new Date();
  
  // Create 5 test invoices
  for (let i = 0; i < 5; i++) {
    const issueDate = subDays(today, 30 - i * 5);
    const dueDate = addDays(issueDate, 30);
    const amount = parseFloat((Math.random() * 1000 + 100).toFixed(2));
    
    const invoice = invoiceRepo.create({
      invoiceNumber: `INV-${1000 + i}`,
      amount,
      customerName: faker.company.name(),
      customerEmail: faker.internet.email(),
      description: `Test invoice ${i + 1}`,
      issueDate,
      dueDate,
      status: 'pending',
      metadata: {
        testData: true,
        createdBy: 'test-script'
      }
    });
    
    await invoiceRepo.save(invoice);
    invoices.push(invoice);
    logger.info(`Created invoice ${invoice.invoiceNumber} for $${invoice.amount}`);
  }
  
  // Create test payouts (some matching, some not)
  const payouts: Payout[] = [];
  
  // Create matching payouts for first 3 invoices
  for (let i = 0; i < 3; i++) {
    const invoice = invoices[i];
    const payoutDate = addDays(invoice.issueDate, Math.floor(Math.random() * 10) + 1);
    const fee = parseFloat((invoice.amount * 0.03).toFixed(2)); // 3% fee
    
    const payout = payoutRepo.create({
      referenceNumber: `PYT-${2000 + i}`,
      amount: invoice.amount - fee,
      fee,
      recipientName: invoice.customerName,
      paymentMethod: 'bank_transfer',
      transactionDate: payoutDate,
      status: 'completed',
      invoice: invoice,
      metadata: {
        testData: true,
        matchedInvoice: invoice.invoiceNumber
      }
    });
    
    await payoutRepo.save(payout);
    payouts.push(payout);
    logger.info(`Created payout ${payout.referenceNumber} for $${payout.amount} (fee: $${payout.fee})`);
  }
  
  // Create some unmatched payouts
  for (let i = 0; i < 3; i++) {
    const amount = parseFloat((Math.random() * 1000 + 100).toFixed(2));
    const fee = parseFloat((amount * 0.03).toFixed(2));
    
    const payout = payoutRepo.create({
      referenceNumber: `PYT-UNMATCHED-${3000 + i}`,
      amount: amount - fee,
      fee,
      recipientName: faker.company.name(),
      paymentMethod: 'bank_transfer',
      transactionDate: subDays(today, i * 2),
      status: 'completed',
      metadata: {
        testData: true,
        purpose: 'unmatched test data'
      }
    });
    
    await payoutRepo.save(payout);
    payouts.push(payout);
    logger.info(`Created unmatched payout ${payout.referenceNumber} for $${payout.amount}`);
  }
  
  return { invoices, payouts };
}

async function testReconciliation() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    logger.info('Database connection established');
    
    // Create test data
    logger.info('Creating test data...');
    await createTestData();
    
    // Test reconciliation with default parameters
    logger.info('Running reconciliation...');
    const result = await reconciliationService.reconcileInvoices({
      startDate: format(subDays(new Date(), 60), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      matchThreshold: 0.9
    });
    
    // Log results
    console.log('\n=== Reconciliation Results ===');
    console.log(`Total Invoices: ${result.summary.totalInvoices}`);
    console.log(`Matched Invoices: ${result.summary.matchedInvoices}`);
    console.log(`Unmatched Invoices: ${result.summary.unmatchedInvoices}`);
    console.log(`Total Amount: $${result.summary.totalAmount.toFixed(2)}`);
    console.log(`Matched Amount: $${result.summary.matchedAmount.toFixed(2)}`);
    console.log(`Unmatched Amount: $${result.summary.unmatchedAmount.toFixed(2)}`);
    console.log(`Processing Time: ${result.summary.processingTime}\n`);
    
    // Log issues if any
    if (result.issues.length > 0) {
      console.log('=== Issues ===');
      result.issues.forEach(issue => {
        console.log(`${issue.type}: ${issue.message} (${issue.count} items, $${issue.totalAmount.toFixed(2)})`);
      });
    }
    
    // Log some matches
    console.log('\n=== Sample Matches ===');
    result.matches.slice(0, 3).forEach(match => {
      console.log(`Invoice ${match.invoiceId}: $${match.invoiceAmount.toFixed(2)} -> ` +
                  `Payout ${match.payoutId || 'None'}: $${match.payoutAmount.toFixed(2)} ` +
                  `(${match.status}, ${(match.confidence * 100).toFixed(1)}% confidence)`);
    });
    
  } catch (error) {
    console.error('Error in test:', error);
  } finally {
    // Close the database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed');
    }
    process.exit(0);
  }
}

// Run the test
testReconciliation().catch(console.error);
