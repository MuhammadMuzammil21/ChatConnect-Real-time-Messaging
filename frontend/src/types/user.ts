export interface User {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    subscriptionStatus: string;
    statusMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserStatus {
    userId: string;
    status: 'ONLINE' | 'OFFLINE' | 'AWAY';
    lastSeen: Date;
}
