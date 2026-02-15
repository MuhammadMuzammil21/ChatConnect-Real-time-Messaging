import React from 'react';
import { Space, Typography, Avatar, Dropdown, Button } from 'antd';
import {
    TeamOutlined,
    UserOutlined,
    MoreOutlined,
    UsergroupAddOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import type { Conversation } from '../types/conversation';
import { ConversationType } from '../types/conversation';
import { OnlineStatusBadge, UserStatusEnum } from './OnlineStatusBadge';
import { useWebSocket } from '../contexts/WebSocketContext';

const { Title, Text } = Typography;

interface ConversationHeaderProps {
    conversation: Conversation;
    currentUserId: string;
    onShowParticipants: () => void;
    onOpenSearch?: () => void;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
    conversation,
    currentUserId,
    onShowParticipants,
    onOpenSearch,
}) => {
    const { getUserStatus } = useWebSocket();

    // Get conversation display name
    const getConversationName = (): string => {
        if (conversation.type === ConversationType.GROUP) {
            return conversation.name || 'Unnamed Group';
        }

        // For direct conversations, show the other participant's name
        const otherParticipant = conversation.participants.find(
            (p) => p.user.id !== currentUserId
        );
        return otherParticipant?.user.displayName || 'Unknown User';
    };

    // Get participant count
    const participantCount = conversation.participants.length;

    // Get other user's status for direct conversations
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
            className="flex flex-wrap items-center justify-between gap-2 p-4 bg-white border-b border-gray-200 min-h-[72px] flex-shrink-0"
            role="banner"
            aria-label={`Conversation with ${getConversationName()}`}
        >
            <Space size="middle" className="min-w-0 flex-1">
                {conversation.type === ConversationType.GROUP ? (
                    <Avatar.Group maxCount={3} size="large">
                        {conversation.participants.slice(0, 3).map((p) => (
                            <Avatar
                                key={p.user.id}
                                src={p.user.avatarUrl}
                                icon={<UserOutlined />}
                            >
                                {!p.user.avatarUrl && p.user.displayName[0].toUpperCase()}
                            </Avatar>
                        ))}
                    </Avatar.Group>
                ) : (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <Avatar
                            size="large"
                            src={
                                conversation.participants.find(
                                    (p) => p.user.id !== currentUserId
                                )?.user.avatarUrl
                            }
                            icon={<UserOutlined />}
                        >
                            {!conversation.participants.find((p) => p.user.id !== currentUserId)
                                ?.user.avatarUrl &&
                                conversation.participants
                                    .find((p) => p.user.id !== currentUserId)
                                    ?.user.displayName[0].toUpperCase()}
                        </Avatar>
                        <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
                            <OnlineStatusBadge
                                status={getOtherUserStatus()}
                                lastSeen={getOtherUserLastSeen()}
                                size="small"
                            />
                        </div>
                    </div>
                )}

                <div className="min-w-0">
                    <Title level={5} className="m-0 truncate">
                        {getConversationName()}
                    </Title>
                    <Space size="small">
                        {conversation.type === ConversationType.GROUP && (
                            <>
                                <TeamOutlined className="text-gray-400" />
                                <Text type="secondary" className="text-sm">
                                    {participantCount} participants
                                </Text>
                            </>
                        )}
                    </Space>
                </div>
            </Space>

            <Space size="small" className="flex-shrink-0">
                {onOpenSearch && (
                    <Button
                        type="text"
                        icon={<SearchOutlined />}
                        onClick={onOpenSearch}
                        aria-label="Search messages in this conversation"
                    />
                )}
                <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                    <Button type="text" icon={<MoreOutlined />} aria-label="Conversation options" />
                </Dropdown>
            </Space>
        </header>
    );
};
