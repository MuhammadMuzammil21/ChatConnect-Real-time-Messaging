import React, { useState, useMemo } from 'react';
import { List, Input, Button, Empty, Spin, Typography } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import type { Conversation } from '../types/conversation';
import { ConversationItem } from './ConversationItem';

const { Title } = Typography;

interface ConversationListProps {
    conversations: Conversation[];
    selectedConversationId?: string;
    onSelectConversation: (conversation: Conversation) => void;
    onCreateConversation: () => void;
    currentUserId: string;
    loading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
    conversations,
    selectedConversationId,
    onSelectConversation,
    onCreateConversation,
    currentUserId,
    loading = false,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Filter conversations based on search query
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) {
            return conversations;
        }

        const query = searchQuery.toLowerCase();
        return conversations.filter((conversation) => {
            // Search in conversation name
            if (conversation.name?.toLowerCase().includes(query)) {
                return true;
            }

            // Search in participant names
            const participantMatch = conversation.participants.some((p) =>
                p.user.displayName.toLowerCase().includes(query)
            );
            if (participantMatch) {
                return true;
            }

            // Search in last message content
            const lastMessage = conversation.messages?.[conversation.messages.length - 1];
            if (lastMessage?.content.toLowerCase().includes(query)) {
                return true;
            }

            return false;
        });
    }, [conversations, searchQuery]);

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                    <Title level={4} className="m-0">
                        Conversations
                    </Title>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={onCreateConversation}
                    >
                        New
                    </Button>
                </div>

                {/* Search */}
                <Input
                    placeholder="Search conversations..."
                    prefix={<SearchOutlined />}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    allowClear
                />
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Spin size="large" />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            searchQuery
                                ? 'No conversations found'
                                : 'No conversations yet'
                        }
                        className="mt-20"
                    >
                        {!searchQuery && (
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={onCreateConversation}
                            >
                                Start a Conversation
                            </Button>
                        )}
                    </Empty>
                ) : (
                    <List
                        dataSource={filteredConversations}
                        renderItem={(conversation) => (
                            <ConversationItem
                                key={conversation.id}
                                conversation={conversation}
                                isSelected={conversation.id === selectedConversationId}
                                onClick={onSelectConversation}
                                currentUserId={currentUserId}
                            />
                        )}
                    />
                )}
            </div>
        </div>
    );
};
