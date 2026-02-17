import { useState, useEffect, useCallback, useRef } from 'react';
import { message as antdMessage } from 'antd';
import type { Message } from '../types/conversation';
import { messagesApi } from '../api/messages';
import { useWebSocket } from '../contexts/WebSocketContext';

interface UseMessagesOptions {
    conversationId: string | null;
    currentUserId: string;
}

export const useMessages = ({ conversationId, currentUserId }: UseMessagesOptions) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
    const { emit, on, off } = useWebSocket();
    const conversationIdRef = useRef(conversationId);

    // Update ref when conversationId changes
    useEffect(() => {
        conversationIdRef.current = conversationId;
    }, [conversationId]);

    // Fetch initial messages
    const fetchMessages = useCallback(async () => {
        if (!conversationId) {
            setMessages([]);
            return;
        }

        setLoading(true);
        try {
            const response = await messagesApi.getMessageHistory(conversationId, 1, 50);
            // Reverse to show oldest first
            setMessages(response.items.reverse());
            setPage(1);
            setHasMore(response.total > response.items.length);
        } catch (error: any) {
            console.error('Failed to fetch messages:', error);
            antdMessage.error('Failed to load messages');
        } finally {
            setLoading(false);
        }
    }, [conversationId]);

    // Load more messages (pagination)
    const loadMore = useCallback(async () => {
        if (!conversationId || loadingMore || !hasMore) return;

        setLoadingMore(true);
        try {
            const nextPage = page + 1;
            const response = await messagesApi.getMessageHistory(conversationId, nextPage, 50);

            // Prepend older messages
            setMessages((prev) => [...response.items.reverse(), ...prev]);
            setPage(nextPage);
            setHasMore(response.page * response.limit < response.total);
        } catch (error: any) {
            console.error('Failed to load more messages:', error);
            antdMessage.error('Failed to load older messages');
        } finally {
            setLoadingMore(false);
        }
    }, [conversationId, page, hasMore, loadingMore]);

    // Send message
    const sendMessage = useCallback(
        async (content: string, fileIds?: string[]) => {
            if (!conversationId || (!content.trim() && (!fileIds || fileIds.length === 0))) return;

            setSending(true);
            try {
                emit('sendConversationMessage', {
                    conversationId,
                    content: content.trim(),
                    fileIds,
                });
            } catch (error: any) {
                console.error('Failed to send message:', error);
                antdMessage.error('Failed to send message');
            } finally {
                setSending(false);
            }
        },
        [conversationId, emit]
    );

    // Mark conversation as read
    const markAsRead = useCallback(async () => {
        if (!conversationId) return;

        try {
            emit('markConversationRead', { conversationId });
        } catch (error: any) {
            console.error('Failed to mark as read:', error);
        }
    }, [conversationId, emit]);

    // Edit message
    const editMessage = useCallback(
        async (messageId: string, content: string) => {
            if (!conversationId || !content.trim()) return;

            setEditingMessageId(messageId);
            try {
                emit('editMessage', {
                    messageId,
                    content: content.trim(),
                });
            } catch (error: any) {
                console.error('Failed to edit message:', error);
                antdMessage.error('Failed to edit message');
            } finally {
                setEditingMessageId(null);
            }
        },
        [conversationId, emit]
    );

    // Delete message
    const deleteMessage = useCallback(
        async (messageId: string) => {
            if (!conversationId) return;

            setDeletingMessageId(messageId);
            try {
                emit('deleteMessage', {
                    messageId,
                    conversationId,
                });
            } catch (error: any) {
                console.error('Failed to delete message:', error);
                antdMessage.error('Failed to delete message');
            } finally {
                setDeletingMessageId(null);
            }
        },
        [conversationId, emit]
    );

    // Search messages
    const searchMessages = useCallback(
        async (query: string, filters?: any) => {
            if (!conversationId || !query.trim()) return [];

            try {
                const response = await messagesApi.searchMessages(conversationId, {
                    query: query.trim(),
                    ...filters,
                });
                return response.items;
            } catch (error: any) {
                console.error('Failed to search messages:', error);
                antdMessage.error('Failed to search messages');
                return [];
            }
        },
        [conversationId]
    );

    // Handle incoming messages
    useEffect(() => {
        const handleIncomingMessage = (data: any) => {
            // Only add message if it's for the current conversation
            if (data.conversationId === conversationIdRef.current) {
                const newMessage: Message = {
                    id: data.id,
                    content: data.content,
                    sender: {
                        id: data.senderId,
                        email: '',
                        displayName: data.senderName || 'Unknown',
                        avatarUrl: data.senderAvatar,
                        role: 'FREE',
                    },
                    messageType: data.messageType,
                    isRead: false,
                    isEdited: false,
                    createdAt: data.createdAt,
                    updatedAt: data.createdAt,
                    attachments: data.attachments || [],
                };

                setMessages((prev) => [...prev, newMessage]);

                // Auto mark as read if message is from someone else
                if (data.senderId !== currentUserId) {
                    setTimeout(() => {
                        markAsRead();
                    }, 1000);
                }
            }
        };

        on('conversationMessage', handleIncomingMessage);

        return () => {
            off('conversationMessage', handleIncomingMessage);
        };
    }, [on, off, currentUserId, markAsRead]);

    // Handle message edited
    useEffect(() => {
        const handleMessageEdited = (data: any) => {
            if (data.conversationId === conversationIdRef.current) {
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === data.messageId
                            ? {
                                ...msg,
                                content: data.content,
                                isEdited: true,
                                updatedAt: data.editedAt,
                            }
                            : msg
                    )
                );
            }
        };

        on('messageEdited', handleMessageEdited);

        return () => {
            off('messageEdited', handleMessageEdited);
        };
    }, [on, off]);

    // Handle message deleted
    useEffect(() => {
        const handleMessageDeleted = (data: any) => {
            if (data.conversationId === conversationIdRef.current) {
                setMessages((prev) =>
                    prev.filter((msg) => msg.id !== data.messageId)
                );
            }
        };

        on('messageDeleted', handleMessageDeleted);

        return () => {
            off('messageDeleted', handleMessageDeleted);
        };
    }, [on, off]);

    // Fetch messages when conversation changes
    useEffect(() => {
        if (conversationId) {
            fetchMessages();
            // Mark as read when opening conversation
            setTimeout(() => {
                markAsRead();
            }, 500);
        } else {
            setMessages([]);
        }
    }, [conversationId, fetchMessages, markAsRead]);

    return {
        messages,
        loading,
        sending,
        hasMore,
        loadingMore,
        editingMessageId,
        deletingMessageId,
        sendMessage,
        editMessage,
        deleteMessage,
        searchMessages,
        loadMore,
        markAsRead,
        refreshMessages: fetchMessages,
    };
};
