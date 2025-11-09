import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from "typeorm";
import { Organization } from "./organization.entity";
import { User } from "./user.entity";

@Entity()
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string | null;

    @Column({ default: false })
    completed: boolean;

    @ManyToOne(() => Organization, org => org.tasks, { onDelete: 'CASCADE', eager: true })
    organization: Organization;

    // users assigned to the task (can be editors)
    @ManyToMany(() => User, { eager: true })
    @JoinTable()
    assignees: User[];

    @ManyToOne(() => User, { eager: true, nullable: true })
    createdBy: User | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}