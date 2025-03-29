import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity('contract_offers')
export class ContractOfferEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    playerId!: number;

    @Column()
    sellingTeamId!: number;

    @Column()
    buyingTeamId!: number;

    @Column()
    seasonId!: number;

    @Column({ type: 'enum', enum: ['Transfer', 'Loan'] })
    contractType!: 'Transfer' | 'Loan';

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0.0 })
    transferValue!: number;

    @Column({ type: 'decimal', precision: 15, scale: 2 })
    salary!: number;

    @Column()
    seasons!: number;

    @Column({ type: 'boolean', default: false })
    isRejected!: boolean;

    @Column({ type: 'boolean', default: false })
    isConfirmed!: boolean;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updatedAt!: Date;
}
