import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';
import { File } from './file.entity';

@Entity('file_downloads')
@Index(['fileId', 'downloadedAt'])
@Index(['userId', 'downloadedAt'])
export class FileDownload {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => File, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'fileId' })
    file: File;

    @Column()
    fileId: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'userId' })
    downloadedBy: User | null;

    @Column({ nullable: true })
    userId: string | null;

    @Column({ nullable: true })
    ipAddress: string;

    @Column({ nullable: true })
    userAgent: string;

    @CreateDateColumn({ name: 'downloaded_at' })
    downloadedAt: Date;
}
