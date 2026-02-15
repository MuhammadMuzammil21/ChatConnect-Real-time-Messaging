import React, { useState } from 'react';
import { Drawer, List, Avatar, Button, Popconfirm, message, Typography, Space } from 'antd';
import { UserOutlined, UserAddOutlined, DeleteOutlined, CrownOutlined } from '@ant-design/icons';
import type { Conversation } from '../types/conversation';
import { ConversationType } from '../types/conversation';
import { conversationsApi } from '../api/conversations';
import RoleBadge from './RoleBadge';
import { OnlineStatusBadge, UserStatusEnum } from './OnlineStatusBadge';
import { useWebSocket } from '../contexts/WebSocketContext';

const { Title, Text } = Typography;

interface ParticipantListProps {
    visible: boolean;
    onClose: () => void;
    conversation: Conversation;
    currentUserId: string;
    onUpdate: () => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
    visible,
    onClose,
    conversation,
    currentUserId,
    onUpdate,
}) => {
    const [removing, setRemoving] = useState<string | null>(null);
    const { getUserStatus } = useWebSocket();

    const isCreator = conversation.createdBy.id === currentUserId;
    const isGroupConversation = conversation.type === ConversationType.GROUP;

    const handleRemoveParticipant = async (userId: string) => {
        if (!isCreator || !isGroupConversation) {
            return;
        }

        setRemoving(userId);
        try {
            await conversationsApi.removeParticipant(conversation.id, userId);
            message.success('Participant removed successfully');
            onUpdate();
        } catch (error: any) {
            console.error('Failed to remove participant:', error);
            message.error(
                error.response?.data?.message || 'Failed to remove participant'
            );
        } finally {
            setRemoving(null);
        }
    };

    return (
        <Drawer
            title={
                <Space>
                    <Title level={4} className="m-0">
                        Participants
                    </Title>
                    <Text type="secondary">({conversation.participants.length})</Text>
                </Space>
            }
            placement="right"
            onClose={onClose}
            open={visible}
            width={400}
        >
            <List
                dataSource={conversation.participants}
                renderItem={(participant) => {
                    const isCurrentUser = participant.user.id === currentUserId;
                    const isConversationCreator =
                        participant.user.id === conversation.createdBy.id;
                    const canRemove =
                        isCreator &&
                        isGroupConversation &&
                        !isConversationCreator &&
                        !isCurrentUser;

                    return (
                        <List.Item
                            actions={
                                canRemove
                                    ? [
                                        <Popconfirm
                                            title="Remove participant"
                                            description="Are you sure you want to remove this participant?"
                                            onConfirm={() =>
                                                handleRemoveParticipant(participant.user.id)
                                            }
                                            okText="Yes"
                                            cancelText="No"
                                        >
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                loading={removing === participant.user.id}
                                            />
                                        </Popconfirm>,
                                    ]
                                    : undefined
                            }
                        >
                            <List.Item.Meta
                                avatar={
                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                        <Avatar
                                            src={participant.user.avatarUrl}
                                            icon={<UserOutlined />}
                                            size="large"
                                        >
                                            {!participant.user.avatarUrl &&
                                                participant.user.displayName[0].toUpperCase()}
                                        </Avatar>
                                        <div style={{ position: 'absolute', bottom: -2, right: -2 }}>
                                            <OnlineStatusBadge
                                                status={
                                                    getUserStatus(participant.user.id)?.status ||
                                                    UserStatusEnum.OFFLINE
                                                }
                                                lastSeen={getUserStatus(participant.user.id)?.lastSeen}
                                                size="small"
                                            />
                                        </div>
                                    </div>
                                }
                                title={
                                    <Space>
                                        <Text strong>{participant.user.displayName}</Text>
                                        {isConversationCreator && (
                                            <CrownOutlined className="text-yellow-500" />
                                        )}
                                        {isCurrentUser && (
                                            <Text type="secondary" className="text-xs">
                                                (You)
                                            </Text>
                                        )}
                                    </Space>
                                }
                                description={
                                    <Space direction="vertical" size="small">
                                        <Text type="secondary" className="text-sm">
                                            {participant.user.email}
                                        </Text>
                                        <RoleBadge role={participant.user.role} />
                                    </Space>
                                }
                            />
                        </List.Item>
                    );
                }}
            />

            {isCreator && isGroupConversation && (
                <div className="mt-4">
                    <Button
                        type="dashed"
                        icon={<UserAddOutlined />}
                        block
                        onClick={() => {
                            message.info('Add participant feature coming soon');
                        }}
                    >
                        Add Participant
                    </Button>
                </div>
            )}
        </Drawer>
    );
};
