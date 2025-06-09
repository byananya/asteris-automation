var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Invoice } from './Invoice.js';
let Payout = class Payout {
};
__decorate([
    PrimaryGeneratedColumn('uuid'),
    __metadata("design:type", String)
], Payout.prototype, "id", void 0);
__decorate([
    Column({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], Payout.prototype, "referenceNumber", void 0);
__decorate([
    Column({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Payout.prototype, "amount", void 0);
__decorate([
    Column({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Payout.prototype, "fee", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Payout.prototype, "recipientName", void 0);
__decorate([
    Column({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], Payout.prototype, "recipientAccount", void 0);
__decorate([
    Column({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], Payout.prototype, "paymentMethod", void 0);
__decorate([
    Column({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Payout.prototype, "notes", void 0);
__decorate([
    Column({ type: 'datetime' }),
    __metadata("design:type", Date)
], Payout.prototype, "transactionDate", void 0);
__decorate([
    Column({ type: 'varchar', length: 20, default: 'pending' }),
    __metadata("design:type", String)
], Payout.prototype, "status", void 0);
__decorate([
    ManyToOne('Invoice', 'payouts', { nullable: true }),
    JoinColumn({ name: 'invoiceId' }),
    __metadata("design:type", Invoice)
], Payout.prototype, "invoice", void 0);
__decorate([
    Column({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Payout.prototype, "invoiceId", void 0);
__decorate([
    Column({ type: 'text', nullable: true, transformer: {
            to: (value) => value ? JSON.stringify(value) : null,
            from: (value) => value ? JSON.parse(value) : null
        } }),
    __metadata("design:type", Object)
], Payout.prototype, "metadata", void 0);
__decorate([
    CreateDateColumn({ type: 'datetime', precision: 3 }),
    __metadata("design:type", Date)
], Payout.prototype, "createdAt", void 0);
__decorate([
    UpdateDateColumn({ type: 'datetime', precision: 3 }),
    __metadata("design:type", Date)
], Payout.prototype, "updatedAt", void 0);
Payout = __decorate([
    Entity('payouts')
], Payout);
export { Payout };
