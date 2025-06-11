import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Payout } from './Payout.js';

type InvoiceStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  invoiceNumber: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  customerName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  customerEmail: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  issueDate: Date;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: InvoiceStatus;

  @Column({ type: 'text', nullable: true, transformer: {
    to: (value: any) => value ? JSON.stringify(value) : null,
    from: (value: string) => value ? JSON.parse(value) : null
  } })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'datetime', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', precision: 3 })
  updatedAt: Date;

  @OneToMany('Payout', 'invoice')
  payouts: Payout[];
}
