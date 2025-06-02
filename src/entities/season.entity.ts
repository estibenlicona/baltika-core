import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("seasons")
export class SeasonEntity extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    tournamentId!: number;

    @Column()
    name!: string;

    @Column({ type: 'timestamp', nullable: true })
    matchesEndDate!: Date;

    @Column({ type: 'timestamp', nullable: true })
    negotiationsStartDate!: Date;

    @Column({ type: 'timestamp', nullable: true })
    negotiationsEndDate!: Date;

    @Column({ type: 'timestamp', nullable: true })
    auctionsStartDate!: Date;

    @Column({ type: 'timestamp', nullable: true })
    auctionsEndDate!: Date;
}