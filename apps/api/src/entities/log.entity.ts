import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Log {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    actorEmail: string;

    @Column()
    action: string;

    @Column({ type: 'text', nullable: true })
    details: string;

    @Column({ nullable: true })
    target: string;

    @CreateDateColumn()
    createdAt: Date;
}