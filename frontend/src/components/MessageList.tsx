import React, { useRef, useEffect } from 'react';
import { Spin, Empty, Button, Divider, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import type { Message } from '../types/conversation';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { useWebSocket } from '../contexts/WebSocketContext';
import dayjs from 'dayjs';

const { Text } = Typography;

interface MessageListProps {
    messages: Message[];
    currentUserId: string;
    conversationId?: string; // Add conversationId for typing indicators
    loading?: boolean;
    hasMore?: boolean;
    onLoadMore?: () => void;
    loadingMore?: boolean;
    onEditMessage?: (message: Message) => void;
    onDeleteMessage?: (messageId: string) => void;
    deletingMessageId?: string | null;
}

export const MessageList: React.FC<MessageListProps> = ({
    messages,
    currentUserId,
    conversationId,
    loading = false,
    hasMore = false,
    onLoadMore,
    loadingMore = false,
    onEditMessage,
    onDeleteMessage,
    deletingMessageId,
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const prevMessagesLengthRef = useRef(messages.length);
    const { typingUsers } = useWebSocket();

    // Get typing users for this conversation (exclude current user)
    const getTypingUserNames = (): string[] => {
        if (!conversationId) return [];

        const typingUserIds = typingUsers.get(conversationId);
        if (!typingUserIds || typingUserIds.size === 0) return [];

        // Filter out current user and map to display names
        const names: string[] = [];
        messages.forEach(msg => {
            if (typingUserIds.has(msg.sender.id) && msg.sender.id !== currentUserId) {
                if (!names.includes(msg.sender.displayName)) {
                    names.push(msg.sender.displayName);
                }
            }
        });

        return names;
    };

    const typingUserNames = getTypingUserNames();

    // Auto-scroll to bottom on new messages or typing indicator
    useEffect(() => {
        if (messages.length > prevMessagesLengthRef.current || typingUserNames.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        prevMessagesLengthRef.current = messages.length;
    }, [messages, typingUserNames]);

    // Group messages by date
    const groupMessagesByDate = (messages: Message[]) => {
        const groups: { date: string; messages: Message[] }[] = [];
        let currentDate = '';

        messages.forEach((message) => {
            const messageDate = dayjs(message.createdAt).format('YYYY-MM-DD');

            if (messageDate !== currentDate) {
                currentDate = messageDate;
                groups.push({
                    date: messageDate,
                    messages: [message],
                });
            } else {
                groups[groups.length - 1].messages.push(message);
            }
        });

        return groups;
    };

    const formatDateSeparator = (date: string) => {
        const messageDate = dayjs(date);
        const today = dayjs();
        const yesterday = today.subtract(1, 'day');

        if (messageDate.isSame(today, 'day')) {
            return 'Today';
        } else if (messageDate.isSame(yesterday, 'day')) {
            return 'Yesterday';
        } else if (messageDate.isAfter(today.subtract(7, 'day'))) {
            return messageDate.format('dddd');
        } else {
            return messageDate.format('MMMM D, YYYY');
        }
    };

    if (loading && messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
            </div>
        );
    }

    if (!loading && messages.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <Empty description="No messages yet. Start the conversation!" />
            </div>
        );
    }

    const messageGroups = groupMessagesByDate(messages);

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto p-4 bg-gray-50"
            style={{ height: '100%' }}
        >
            {/* Load More Button */}
            {hasMore && (
                <div className="text-center mb-4">
                    <Button
                        type="link"
                        onClick={onLoadMore}
                        loading={loadingMore}
                        disabled={loadingMore}
                    >
                        {loadingMore ? 'Loading...' : 'Load older messages'}
                    </Button>
                </div>
            )}

            {/* Message Groups */}
            {messageGroups.map((group, _) => (
                <div key={group.date}>
                    {/* Date Separator */}
                    <Divider plain>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            {formatDateSeparator(group.date)}
                        </Text>
                    </Divider>

                    {/* Messages */}
                    {group.messages.map((message, index) => {
                        const isOwnMessage = message.sender.id === currentUserId;
                        const prevMessage = index > 0 ? group.messages[index - 1] : null;
                        const showSender =
                            !prevMessage || prevMessage.sender.id !== message.sender.id;

                        return (
                            <MessageItem
                                key={message.id}
                                message={message}
                                isOwnMessage={isOwnMessage}
                                showSender={showSender}
                                currentUserId={currentUserId}
                                onEdit={onEditMessage}
                                onDelete={onDeleteMessage}
                                deleting={deletingMessageId === message.id}
                            />
                        );
                    })}
                </div>
            ))}

            {/* Typing Indicator */}
            {typingUserNames.length > 0 && (
                <TypingIndicator typingUsers={typingUserNames} />
            )}

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
        </div>
    );
};
