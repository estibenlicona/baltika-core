import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Position } from "../models/position";

@Entity("positions")
export class PositionEntity extends BaseEntity implements Position {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    teamId!: number;

    @Column()
    tournamentId!: number;

    @Column()
    seasonId!: number;

    @Column()
    round!: number;

    @Column()
    position!: number;

    @Column()
    points!: number;

    @Column()
    goalsScored!: number;

    @Column()
    goalsConceded!: number;

    @Column()
    goalsDifference!: number;

    @Column()
    wins!: number;
    
    @Column()
    draws!: number;

    @Column()
    losses!: number;

    @Column()
    played!: number;
}