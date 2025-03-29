import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity('matchs')
export class MatchEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    tournamentId!: number;

    @Column()
    seasonId!: number;

    @Column()
    round!: number;

    @Column()
    matchDay!: number;

    @Column()
    matchNumber!: number;
    
    @Column()
    homeId!: number;

    @Column()
    awayId!: number;

    @Column()
    homeGoals!: number;
    
    @Column()
    awayGoals!: number;

    @Column({ type: 'tinyint', default: 0 })
    played!: boolean;
}