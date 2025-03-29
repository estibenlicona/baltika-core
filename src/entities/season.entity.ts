import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("seasons")
export class SeasonEntity extends BaseEntity {

    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    tournamentId!: number;

    @Column()
    name!: string;
}