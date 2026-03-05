import React from 'react';
import { Avatar, Dropdown } from 'antd';
import {
    UserOutlined,
    UsergroupAddOutlined,
} from '@ant-design/icons';
import { Search, Paperclip, MoreHorizontal, Users } from 'lucide-react';
import type { Conversation } from '../types/conversation';
import { ConversationType } from '../types/conversation';
import { OnlineStatusBadge, UserStatusEnum } from './OnlineStatusBadge';
import { useWebSocket } from '../contexts/WebSocketContext';

interface ConversationHeaderProps {
    conversation: Conversation;
    currentUserId: string;
    onShowParticipants: () => void;
    onOpenSearch?: () => void;
    onToggleFiles?: () => void;
    filesOpen?: boolean;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
    conversation,
    currentUserId,
    onShowParticipants,
    onOpenSearch,
    onToggleFiles,
    filesOpen,
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

    const participantCount = conversation.participants.length;

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

    const menuItems = [
        {
            key: 'participants',
            label: 'View Participants',
            icon: <UsergroupAddOutlined />,
            onClick: onShowParticipants,
        },
    ];

    return (
        <header
            className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] shrink-0"
            style={{ background: '#0f0f0f' }}
            role="banner"
            aria-label={`Conversation with ${getConversationName()}`}
        >
            {/* Left: Avatar + Name */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
                {conversation.type === ConversationType.GROUP ? (
                    <Avatar.Group maxCount={3} size="default">
                        {conversation.participants.slice(0, 3).map((p) => (
                            <Avatar
                                key={p.user.id}
                                src={p.user.avatarUrl}
                                icon={<UserOutlined />}
                                style={{ background: '#262626', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                {!p.user.avatarUrl && p.user.displayName[0].toUpperCase()}
                            </Avatar>
                        ))}
                    </Avatar.Group>
                ) : (
                    <div className="relative inline-block shrink-0">
                        <Avatar
                            size="default"
                            src={
                                conversation.participants.find(
                                    (p) => p.user.id !== currentUserId
                                )?.user.avatarUrl
                            }
                            icon={<UserOutlined />}
                            style={{ background: '#262626', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            {!conversation.participants.find((p) => p.user.id !== currentUserId)
                                ?.user.avatarUrl &&
                                conversation.participants
                                    .find((p) => p.user.id !== currentUserId)
                                    ?.user.displayName[0].toUpperCase()}
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

                <div className="min-w-0">
                    <h4 className="text-sm font-medium text-neutral-200 truncate m-0">
                        {getConversationName()}
                    </h4>
                    {conversation.type === ConversationType.GROUP && (
                        <div className="flex items-center gap-1 mt-0.5">
                            <Users className="h-3 w-3 text-neutral-600" />
                            <span className="text-xs text-neutral-500">{participantCount} participants</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 shrink-0">
                {onOpenSearch && (
                    <button
                        onClick={onOpenSearch}
                        aria-label="Search messages"
                        className="flex items-center justify-center h-8 w-8 rounded-md text-neutral-500 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                        <Search className="h-4 w-4" />
                    </button>
                )}
                {onToggleFiles && (
                    <button
                        onClick={onToggleFiles}
                        aria-label="Files & Media"
                        className={`flex items-center justify-center h-8 w-8 rounded-md transition-colors ${filesOpen
                            ? 'text-indigo-400 bg-indigo-500/10'
                            : 'text-neutral-500 hover:text-white hover:bg-white/[0.04]'
                            }`}
                    >
                        <Paperclip className="h-4 w-4" />
                    </button>
                )}
                <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                    <button
                        aria-label="Conversation options"
                        className="flex items-center justify-center h-8 w-8 rounded-md text-neutral-500 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>
                </Dropdown>
            </div>
        </header>
    );
};
