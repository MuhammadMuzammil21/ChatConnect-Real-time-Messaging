import React from 'react';
import { Avatar } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import type { Conversation } from '../types/conversation';
import { ConversationType } from '../types/conversation';
import { OnlineStatusBadge, UserStatusEnum } from './OnlineStatusBadge';
import { useWebSocket } from '../contexts/WebSocketContext';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface ConversationItemProps {
    conversation: Conversation;
    isSelected?: boolean;
    onClick: (conversation: Conversation) => void;
    currentUserId: string;
    unreadCount?: number;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
    conversation,
    isSelected = false,
    onClick,
    currentUserId,
    unreadCount = 0,
}) => {
    const { getUserStatus } = useWebSocket();

    const getConversationName = (): string => {
        if (conversation.type === ConversationType.GROUP) {
            return conversation.name || 'Unnamed Group';
        }
        const otherParticipant = conversation.participants.find(
            (p) => p.user.id !== currentUserId
        );
        return otherParticipant?.user.displayName || 'Unknown User';
    };

    const lastMessage = conversation.messages?.[conversation.messages.length - 1];

    const participantAvatars = conversation.participants
        .slice(0, 3)
        .map((p) => p.user);

    const getOtherUserStatus = (): UserStatusEnum => {
        if (conversation.type === ConversationType.DIRECT) {
            const otherParticipant = conversation.participants.find(
                (p) => p.user.id !== currentUserId
            );
            if (otherParticipant) {
                const status = getUserStatus(otherParticipant.user.id);
                return status?.status || UserStatusEnum.OFFLINE;
            }
        }
        return UserStatusEnum.OFFLINE;
    };

    const getOtherUserLastSeen = (): Date | undefined => {
        if (conversation.type === ConversationType.DIRECT) {
            const otherParticipant = conversation.participants.find(
                (p) => p.user.id !== currentUserId
            );
            if (otherParticipant) {
                const status = getUserStatus(otherParticipant.user.id);
                return status?.lastSeen;
            }
        }
        return undefined;
    };

    return (
        <div
            onClick={() => onClick(conversation)}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-l-2 ${isSelected
                    ? 'bg-indigo-500/10 border-indigo-500'
                    : 'border-transparent hover:bg-white/[0.03]'
                }`}
        >
            {/* Avatar */}
            <div className="shrink-0 relative">
                {conversation.type === ConversationType.GROUP ? (
                    <Avatar.Group maxCount={2} size="default">
                        {participantAvatars.map((user) => (
                            <Avatar
                                key={user.id}
                                src={user.avatarUrl}
                                icon={<UserOutlined />}
                                style={{ background: '#262626', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                {!user.avatarUrl && user.displayName[0].toUpperCase()}
                            </Avatar>
                        ))}
                    </Avatar.Group>
                ) : (
                    <div className="relative inline-block">
                        <Avatar
                            size="default"
                            src={participantAvatars[0]?.avatarUrl}
                            icon={<UserOutlined />}
                            style={{ background: '#262626', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            {!participantAvatars[0]?.avatarUrl &&
                                participantAvatars[0]?.displayName[0].toUpperCase()}
                        </Avatar>
                        <div className="absolute -bottom-0.5 -right-0.5">
                            <OnlineStatusBadge
                                status={getOtherUserStatus()}
                                lastSeen={getOtherUserLastSeen()}
                                size="small"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-neutral-200'}`}>
                            {getConversationName()}
                        </span>
                        {conversation.type === ConversationType.GROUP && (
                            <TeamOutlined style={{ fontSize: '11px', color: '#525252' }} />
                        )}
                    </div>
                    {lastMessage && (
                        <span className="text-[11px] text-neutral-600 shrink-0">
                            {dayjs(lastMessage.createdAt).fromNow()}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs text-neutral-500 truncate">
                        {lastMessage
                            ? `${lastMessage.sender.displayName}: ${lastMessage.content}`
                            : 'No messages yet'}
                    </span>
                    {unreadCount > 0 && (
                        <span
                            className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold text-white shrink-0"
                            style={{ background: '#6366f1' }}
                        >
                            {unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
