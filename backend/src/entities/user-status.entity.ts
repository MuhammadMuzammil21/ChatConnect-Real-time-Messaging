import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, Index, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

export enum UserStatusEnum {
    ONLINE = 'ONLINE',
    OFFLINE = 'OFFLINE',
    AWAY = 'AWAY',
}

@Entity('user_status')
@Index(['userId'], { unique: true })
@Index(['status'])
export class UserStatus {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid', unique: true })
    userId: string;

    @OneToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({
        type: 'enum',
        enum: UserStatusEnum,
        default: UserStatusEnum.OFFLINE,
    })
    status: UserStatusEnum;

    @Column({ name: 'last_seen', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    lastSeen: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
