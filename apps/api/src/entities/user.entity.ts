import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Membership } from './membership.entity';
import { Task } from './task.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    passwordHash: string;

    @OneToMany(() => Membership, (membership) => membership.user)
    memberships: Membership[];

    @OneToMany(() => Task, (task) => task.createdBy)
    createdTasks: Task[];
}