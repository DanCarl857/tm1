import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Membership } from './membership.entity';
import { Task } from './task.entity';

@Entity()
export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @OneToMany(() => Membership, (membership) => membership.organization)
    memberships: Membership[];

    @OneToMany(() => Task, (task) => task.organization)
    tasks: Task[];
}