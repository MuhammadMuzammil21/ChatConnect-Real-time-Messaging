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

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
