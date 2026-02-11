import React from 'react';
import { Space, Typography, Avatar, Dropdown, Button } from 'antd';
import {
    TeamOutlined,
    UserOutlined,
    MoreOutlined,
    UsergroupAddOutlined,
} from '@ant-design/icons';
import type { Conversation } from '../types/conversation';
import { ConversationType } from '../types/conversation';

const { Title, Text } = Typography;

interface ConversationHeaderProps {
    conversation: Conversation;
    currentUserId: string;
    onShowParticipants: () => void;
}

export const ConversationHeader: React.FC<ConversationHeaderProps> = ({
    conversation,
    currentUserId,
    onShowParticipants,
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

    // Get participant count
    const participantCount = conversation.participants.length;



    const menuItems = [
        {
            key: 'participants',
            label: 'View Participants',
            icon: <UsergroupAddOutlined />,
            onClick: onShowParticipants,
        },
    ];

    return (
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
            <Space size="middle">
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
                )}

                <div>
                    <Title level={5} className="m-0">
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

            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                <Button type="text" icon={<MoreOutlined />} />
            </Dropdown>
        </div>
    );
};
