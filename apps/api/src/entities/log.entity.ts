import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Log {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    actorID: string;

    @Column()
    action: string;

    @Column({ type: 'json', nullable: true })
    meta: any;

    @CreateDateColumn()
    createdAt: Date;
}