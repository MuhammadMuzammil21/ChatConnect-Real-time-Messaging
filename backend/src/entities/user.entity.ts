import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
    FREE = 'FREE',
    PREMIUM = 'PREMIUM',
    ADMIN = 'ADMIN',
}

export enum SubscriptionStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    CANCELLED = 'CANCELLED',
    PAST_DUE = 'PAST_DUE',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ name: 'google_id', unique: true, nullable: true, type: 'varchar' })
    googleId: string;

    @Column({ name: 'display_name' })
    displayName: string;

    @Column({ name: 'avatar_url', nullable: true, type: 'varchar' })
    avatarUrl: string | null;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.FREE,
    })
    role: UserRole;

    @Column({
        type: 'enum',
        enum: SubscriptionStatus,
        name: 'subscription_status',
        default: SubscriptionStatus.INACTIVE,
    })
    subscriptionStatus: SubscriptionStatus;

    @Column({ name: 'status_message', nullable: true, length: 200, type: 'varchar' })
    statusMessage: string | null;

    @Column({ name: 'stripe_customer_id', nullable: true, type: 'varchar' })
    stripeCustomerId: string | null;

    @Column({ name: 'is_banned', default: false })
    isBanned: boolean;

    @Column({ name: 'refresh_token', nullable: true, type: 'text' })
    refreshToken: string | null;

    @Column({ name: 'storage_quota', type: 'bigint', default: 10737418240 })
    storageQuota: number; // Storage quota in bytes (default 10GB)

    @Column({ name: 'storage_used', type: 'bigint', default: 0 })
    storageUsed: number; // Storage used in bytes

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
