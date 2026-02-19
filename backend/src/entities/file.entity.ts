import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';

@Entity('files')
export class File {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    filename: string; // Original filename

    @Column({ unique: true })
    storedFilename: string; // UUID-based storage name

    @Column()
    fileUrl: string; // Public URL

    @Column()
    mimeType: string; // MIME type

    @Column({ type: 'bigint' })
    fileSize: number; // Size in bytes

    // Image variants (for images only)
    @Column({ nullable: true })
    thumbnailUrl: string; // Thumbnail URL (150x150)

    @Column({ nullable: true })
    mediumUrl: string; // Medium size URL (800x800)

    @Column({ nullable: true })
    fullUrl: string; // Full size URL (1920x1920)

    @Column({ nullable: true, type: 'int' })
    imageWidth: number; // Image width in pixels

    @Column({ nullable: true, type: 'int' })
    imageHeight: number; // Image height in pixels

    // Video metadata (for videos only)
    @Column({ nullable: true, type: 'int' })
    videoDuration: number; // Duration in seconds

    @Column({ nullable: true })
    videoThumbnailUrl: string; // Video thumbnail URL

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'uploadedById' })
    uploadedBy: User;

    @Column()
    uploadedById: string;

    @ManyToOne(() => Conversation, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversationId' })
    conversation: Conversation;

    @Column({ nullable: true })
    conversationId: string;

    @ManyToOne(() => Message, { nullable: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'messageId' })
    message: Message;

    @Column({ nullable: true })
    messageId: string;

    // File versioning
    @Column({ nullable: true })
    version: number; // Version number (1, 2, 3, etc.)

    @Column({ nullable: true })
    parentFileId: string; // Reference to original file for versioning

    @Column({ type: 'text', nullable: true })
    description: string | null; // Optional file description/metadata

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
