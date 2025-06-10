import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class InitialSchema1749267628321 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create invoices table
        await queryRunner.createTable(new Table({
            name: 'invoices',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'uuid',
                },
                {
                    name: 'invoiceNumber',
                    type: 'varchar',
                    length: '50',
                    isNullable: false,
                },
                {
                    name: 'amount',
                    type: 'decimal',
                    precision: 10,
                    scale: 2,
                    isNullable: false,
                },
                {
                    name: 'customerName',
                    type: 'varchar',
                    length: '100',
                    isNullable: true,
                },
                {
                    name: 'customerEmail',
                    type: 'varchar',
                    length: '100',
                    isNullable: true,
                },
                {
                    name: 'description',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'issueDate',
                    type: 'date',
                    isNullable: false,
                },
                {
                    name: 'dueDate',
                    type: 'date',
                    isNullable: false,
                },
                {
                    name: 'status',
                    type: 'varchar',
                    length: '20',
                    default: 'pending',
                },
                {
                    name: 'metadata',
                    type: 'jsonb',
                    isNullable: true,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp with time zone',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updatedAt',
                    type: 'timestamp with time zone',
                    default: 'CURRENT_TIMESTAMP',
                    onUpdate: 'CURRENT_TIMESTAMP',
                },
            ],
        }), true);

        // Create payouts table
        await queryRunner.createTable(new Table({
            name: 'payouts',
            columns: [
                {
                    name: 'id',
                    type: 'uuid',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'uuid',
                },
                {
                    name: 'referenceNumber',
                    type: 'varchar',
                    length: '50',
                    isNullable: false,
                },
                {
                    name: 'amount',
                    type: 'decimal',
                    precision: 10,
                    scale: 2,
                    isNullable: false,
                },
                {
                    name: 'fee',
                    type: 'decimal',
                    precision: 10,
                    scale: 2,
                    default: 0,
                },
                {
                    name: 'recipientName',
                    type: 'varchar',
                    length: '100',
                    isNullable: true,
                },
                {
                    name: 'recipientAccount',
                    type: 'varchar',
                    length: '100',
                    isNullable: true,
                },
                {
                    name: 'paymentMethod',
                    type: 'varchar',
                    length: '50',
                    isNullable: true,
                },
                {
                    name: 'notes',
                    type: 'text',
                    isNullable: true,
                },
                {
                    name: 'transactionDate',
                    type: 'date',
                    isNullable: false,
                },
                {
                    name: 'status',
                    type: 'varchar',
                    length: '20',
                    default: 'pending',
                },
                {
                    name: 'invoiceId',
                    type: 'uuid',
                    isNullable: true,
                },
                {
                    name: 'metadata',
                    type: 'jsonb',
                    isNullable: true,
                },
                {
                    name: 'createdAt',
                    type: 'timestamp with time zone',
                    default: 'CURRENT_TIMESTAMP',
                },
                {
                    name: 'updatedAt',
                    type: 'timestamp with time zone',
                    default: 'CURRENT_TIMESTAMP',
                    onUpdate: 'CURRENT_TIMESTAMP',
                },
            ],
        }), true);

        // Create foreign key for payouts -> invoices relationship
        await queryRunner.createForeignKey('payouts', new TableForeignKey({
            columnNames: ['invoiceId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'invoices',
            onDelete: 'SET NULL',
            onUpdate: 'CASCADE',
        }));

        // Create indexes using TableIndex
        await queryRunner.createIndex('invoices', new TableIndex({
            name: 'IDX_INVOICE_NUMBER',
            columnNames: ['invoiceNumber'],
            isUnique: true
        }));
        
        await queryRunner.createIndex('invoices', new TableIndex({
            name: 'IDX_INVOICE_STATUS',
            columnNames: ['status']
        }));
        
        await queryRunner.createIndex('payouts', new TableIndex({
            name: 'IDX_PAYOUT_REFERENCE',
            columnNames: ['referenceNumber'],
            isUnique: true
        }));
        
        await queryRunner.createIndex('payouts', new TableIndex({
            name: 'IDX_PAYOUT_STATUS',
            columnNames: ['status']
        }));
        
        await queryRunner.createIndex('payouts', new TableIndex({
            name: 'IDX_PAYOUT_INVOICE',
            columnNames: ['invoiceId']
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key first
        const table = await queryRunner.getTable('payouts');
        if (table) {
            const foreignKey = table.foreignKeys.find(
                fk => fk.columnNames.indexOf('invoiceId') !== -1,
            );
            if (foreignKey) {
                await queryRunner.dropForeignKey('payouts', foreignKey);
            }
        }

        // Drop tables
        await queryRunner.dropTable('payouts');
        await queryRunner.dropTable('invoices');
    }
}
