import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Task } from './task.entity';
import { UserOrganizationRole } from './user-organization-role.entity';

@Entity()
export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @OneToMany(() => UserOrganizationRole, (userOrgRole) => userOrgRole.organization)
    userRoles: UserOrganizationRole[];

    @OneToMany(() => Task, (task) => task.organization)
    tasks: Task[];
}