import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export type Role = 'admin' | 'org-admin' | 'user' | 'viewer';

@Entity()
export class UserOrganizationRole {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.orgRoles, { onDelete: 'CASCADE' })
    user: User;

    @ManyToOne(() => Organization, (organization) => organization.userRoles, { onDelete: 'CASCADE' })
    organization: Organization;

    @Column()
    role: Role;
}