import { AppDataSource } from '../config/data-source';
import { Invoice } from '../entities/Invoice';
import { Payout } from '../entities/Payout';
import { faker } from '@faker-js/faker';
import { addDays, subDays } from 'date-fns';
async function seedDatabase() {
    try {
        // Initialize the database connection
        await AppDataSource.initialize();
        console.log('Database connection established');
        // Clear existing data
        await AppDataSource.getRepository(Payout).delete({});
        await AppDataSource.getRepository(Invoice).delete({});
        console.log('Cleared existing data');
        // Create test invoices
        const invoices = [];
        const today = new Date();
        for (let i = 0; i < 20; i++) {
            const issueDate = faker.date.between({
                from: subDays(today, 60),
                to: today
            });
            const dueDate = addDays(issueDate, 30);
            const invoice = new Invoice();
            invoice.invoiceNumber = `INV-${1000 + i}`;
            invoice.amount = parseFloat(faker.finance.amount(100, 10000, 2));
            invoice.customerName = faker.company.name();
            invoice.customerEmail = faker.internet.email();
            invoice.description = `Invoice for ${faker.commerce.productName()} services`;
            invoice.issueDate = issueDate;
            invoice.dueDate = dueDate;
            invoice.status = faker.helpers.arrayElement(['pending', 'paid', 'overdue', 'cancelled']);
            invoice.metadata = {
                taxRate: 0.1,
                currency: 'USD',
                notes: faker.lorem.sentence()
            };
            invoices.push(invoice);
        }
        // Save invoices
        const savedInvoices = await AppDataSource.getRepository(Invoice).save(invoices);
        console.log(`Created ${savedInvoices.length} invoices`);
        // Create payouts for some invoices
        const payouts = [];
        for (let i = 0; i < 15; i++) {
            const invoice = faker.helpers.arrayElement(savedInvoices);
            const transactionDate = addDays(invoice.issueDate, faker.number.int({ min: 1, max: 15 }));
            const payout = new Payout();
            payout.referenceNumber = `PYT-${2000 + i}`;
            payout.amount = invoice.amount * 0.95; // 5% fee
            payout.fee = invoice.amount * 0.05;
            payout.recipientName = faker.person.fullName();
            payout.recipientAccount = faker.finance.accountNumber();
            payout.paymentMethod = faker.helpers.arrayElement(['bank_transfer', 'paypal', 'stripe']);
            payout.notes = `Payout for invoice ${invoice.invoiceNumber}`;
            payout.transactionDate = transactionDate;
            payout.status = faker.helpers.arrayElement(['pending', 'completed', 'failed', 'cancelled']);
            payout.invoice = invoice;
            payout.metadata = {
                feePercentage: 5,
                currency: 'USD',
                processedBy: faker.person.fullName()
            };
            payouts.push(payout);
        }
        // Save payouts
        const savedPayouts = await AppDataSource.getRepository(Payout).save(payouts);
        console.log(`Created ${savedPayouts.length} payouts`);
        console.log('Database seeded successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
    finally {
        await AppDataSource.destroy();
    }
}
seedDatabase();
