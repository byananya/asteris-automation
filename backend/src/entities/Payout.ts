import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Invoice } from './Invoice.js';

type PayoutStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

type Metadata = Record<string, any>;

@Entity('payouts')
export class Payout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  referenceNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fee: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  recipientName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  recipientAccount: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentMethod: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'datetime' })
  transactionDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: PayoutStatus;

  @ManyToOne(() => Invoice, invoice => invoice.payouts, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'invoiceId' })
  invoice?: Invoice | null;

  @Column({ type: 'uuid', nullable: true })
  invoiceId?: string | null;

  @Column({ type: 'text', nullable: true, transformer: {
    to: (value: any) => value ? JSON.stringify(value) : null,
    from: (value: string) => value ? JSON.parse(value) : null
  } })
  metadata?: Metadata | null;

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 3 })
  updatedAt: Date;
}
