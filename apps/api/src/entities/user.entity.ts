import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Task } from './task.entity';
import { UserOrganizationRole } from './user-organization-role.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    name: string;

    @Column()
    password: string;

    @OneToMany(() => UserOrganizationRole, (userOrgRole) => userOrgRole.user)
    orgRoles: UserOrganizationRole[];

    @OneToMany(() => Task, (task) => task.createdBy)
    tasks: Task[];
}