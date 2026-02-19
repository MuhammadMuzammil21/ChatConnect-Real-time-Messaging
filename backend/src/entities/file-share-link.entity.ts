import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    Index,
    JoinColumn,
} from 'typeorm';
import { File } from './file.entity';
import { User } from './user.entity';

@Entity('file_share_links')
@Index(['token'], { unique: true })
@Index(['fileId', 'expiresAt'])
export class FileShareLink {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => File, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'fileId' })
    file: File;

    @Column()
    fileId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'createdById' })
    createdBy: User | null;

    @Column({ nullable: true })
    createdById: string | null;

    @Column({ unique: true })
    token: string; // Unique token for the share link

    @Column({ type: 'timestamptz', nullable: true })
    expiresAt: Date | null; // Null means no expiration

    @Column({ default: 0 })
    accessCount: number; // Number of times the link was accessed

    @Column({ type: 'timestamptz', nullable: true })
    lastAccessedAt: Date | null;

    @Column({ default: false })
    isActive: boolean; // Can be deactivated without deleting

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
