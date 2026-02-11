import React from 'react';
import { List, Avatar, Badge, Typography, Space } from 'antd';
import { UserOutlined, TeamOutlined } from '@ant-design/icons';
import type { Conversation } from '../types/conversation';
import { ConversationType } from '../types/conversation';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface ConversationItemProps {
    conversation: Conversation;
    isSelected?: boolean;
    onClick: (conversation: Conversation) => void;
    currentUserId: string;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
    conversation,
    isSelected = false,
    onClick,
    currentUserId,
}) => {
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

    // Get last message (if available)
    const lastMessage = conversation.messages?.[conversation.messages.length - 1];

    // Get participant avatars (max 3)
    const participantAvatars = conversation.participants
        .slice(0, 3)
        .map((p) => p.user);

    // Calculate unread count (placeholder - will be implemented with real-time updates)
    const unreadCount = 0;

    return (
        <List.Item
            onClick={() => onClick(conversation)}
            className={`cursor-pointer transition-colors hover:bg-gray-50 ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                }`}
            style={{ padding: '12px 16px' }}
        >
            <List.Item.Meta
                avatar={
                    conversation.type === ConversationType.GROUP ? (
                        <Avatar.Group maxCount={2} size="large">
                            {participantAvatars.map((user) => (
                                <Avatar
                                    key={user.id}
                                    src={user.avatarUrl}
                                    icon={<UserOutlined />}
                                >
                                    {!user.avatarUrl && user.displayName[0].toUpperCase()}
                                </Avatar>
                            ))}
                        </Avatar.Group>
                    ) : (
                        <Avatar
                            size="large"
                            src={participantAvatars[0]?.avatarUrl}
                            icon={<UserOutlined />}
                        >
                            {!participantAvatars[0]?.avatarUrl &&
                                participantAvatars[0]?.displayName[0].toUpperCase()}
                        </Avatar>
                    )
                }
                title={
                    <div className="flex items-center justify-between">
                        <Space>
                            <Text strong>{getConversationName()}</Text>
                            {conversation.type === ConversationType.GROUP && (
                                <TeamOutlined className="text-gray-400" />
                            )}
                        </Space>
                        {lastMessage && (
                            <Text type="secondary" className="text-xs">
                                {dayjs(lastMessage.createdAt).fromNow()}
                            </Text>
                        )}
                    </div>
                }
                description={
                    <div className="flex items-center justify-between">
                        <Text
                            ellipsis
                            type="secondary"
                            className="text-sm max-w-[200px]"
                        >
                            {lastMessage
                                ? `${lastMessage.sender.displayName}: ${lastMessage.content}`
                                : 'No messages yet'}
                        </Text>
                        {unreadCount > 0 && (
                            <Badge
                                count={unreadCount}
                                style={{ backgroundColor: '#1890ff' }}
                            />
                        )}
                    </div>
                }
            />
        </List.Item>
    );
};
