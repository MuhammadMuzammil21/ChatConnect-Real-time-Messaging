export const ConversationType = {
    DIRECT: 'DIRECT',
    GROUP: 'GROUP',
} as const;

export type ConversationType = typeof ConversationType[keyof typeof ConversationType];

export const MessageType = {
    TEXT: 'TEXT',
    IMAGE: 'IMAGE',
    FILE: 'FILE',
} as const;

export type MessageType = typeof MessageType[keyof typeof MessageType];

export interface User {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    role: 'FREE' | 'PREMIUM' | 'ADMIN';
}

export interface ConversationParticipant {
    id: string;
    user: User;
    joinedAt: string;
    lastReadAt: string | null;
    isMuted: boolean;
}

export interface Message {
    id: string;
    content: string;
    sender: User;
    messageType: MessageType;
    isRead: boolean;
    isEdited: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Conversation {
    id: string;
    name: string | null;
    type: ConversationType;
    createdBy: User;
    createdAt: string;
    updatedAt: string;
    participants: ConversationParticipant[];
    messages?: Message[];
}

export interface CreateConversationDto {
    type?: ConversationType;
    name?: string;
    participantIds?: string[];
}

export interface AddParticipantDto {
    userId: string;
}

export interface ConversationListItem extends Conversation {
    lastMessage?: Message;
    unreadCount?: number;
}
