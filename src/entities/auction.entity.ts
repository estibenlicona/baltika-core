import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'Auctions' })
export class AuctionEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int' })
    teamId!: number;

    @Column({ type: 'int' })
    playerId!: number;

    @Column({ type: 'int' })
    seasonId!: number;

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    date!: Date;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
    })
    value!: number;
}