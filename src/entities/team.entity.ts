import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("teams")
export class TeamEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    assistant!: string;

    @Column()
    emblem!: string;
}