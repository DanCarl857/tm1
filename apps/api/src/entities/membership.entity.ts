import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

export type OrgRole = 'admin' | 'org-admin' | 'user' | 'viewer';

@Entity()
export class Membership {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE', eager: true })
    user: User;

    @ManyToOne(() => Organization, (organization) => organization.memberships, { onDelete: 'CASCADE', eager: true })
    organization: Organization;

    @Column({ type: 'simple-array', default: ''})
    roles: OrgRole[];
}