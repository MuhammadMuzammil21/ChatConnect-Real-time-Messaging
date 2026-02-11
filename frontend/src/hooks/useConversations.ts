import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import type { Conversation, CreateConversationDto } from '../types/conversation';
import { conversationsApi } from '../api/conversations';
import { useWebSocket } from '../contexts/WebSocketContext';

export const useConversations = () => {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
        null
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { emit, on, off, isConnected } = useWebSocket();

    // Fetch all conversations
    const fetchConversations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await conversationsApi.getUserConversations();
            setConversations(data);
        } catch (err: any) {
            console.error('Failed to fetch conversations:', err);
            setError(err.response?.data?.message || 'Failed to load conversations');
            message.error('Failed to load conversations');
        } finally {
            setLoading(false);
        }
    }, []);

    // Create a new conversation
    const createConversation = useCallback(
        async (dto: CreateConversationDto): Promise<Conversation | null> => {
            try {
                const newConversation = await conversationsApi.createConversation(dto);
                setConversations((prev) => [newConversation, ...prev]);
                message.success('Conversation created successfully');
                return newConversation;
            } catch (err: any) {
                console.error('Failed to create conversation:', err);
                message.error(
                    err.response?.data?.message || 'Failed to create conversation'
                );
                return null;
            }
        },
        []
    );

    // Select a conversation and join its WebSocket room
    const selectConversation = useCallback(
        async (conversation: Conversation) => {
            // Leave previous conversation room
            if (selectedConversation && isConnected) {
                emit('leaveConversation', { conversationId: selectedConversation.id });
            }

            setSelectedConversation(conversation);

            // Join new conversation room
            if (isConnected) {
                emit('joinConversation', { conversationId: conversation.id });
            }

            // Fetch full conversation details
            try {
                const details = await conversationsApi.getConversationDetails(
                    conversation.id
                );
                setSelectedConversation(details);

                // Update in the list as well
                setConversations((prev) =>
                    prev.map((c) => (c.id === details.id ? details : c))
                );
            } catch (err: any) {
                console.error('Failed to fetch conversation details:', err);
                message.error('Failed to load conversation details');
            }
        },
        [selectedConversation, isConnected, emit]
    );

    // Refresh selected conversation
    const refreshSelectedConversation = useCallback(async () => {
        if (!selectedConversation) return;

        try {
            const details = await conversationsApi.getConversationDetails(
                selectedConversation.id
            );
            setSelectedConversation(details);

            // Update in the list as well
            setConversations((prev) =>
                prev.map((c) => (c.id === details.id ? details : c))
            );
        } catch (err: any) {
            console.error('Failed to refresh conversation:', err);
        }
    }, [selectedConversation]);

    // Handle incoming WebSocket messages
    useEffect(() => {
        if (!isConnected) return;

        const handleConversationMessage = (data: any) => {
            console.log('Received conversation message:', data);
            // Refresh the selected conversation to get the new message
            if (selectedConversation && data.conversationId === selectedConversation.id) {
                refreshSelectedConversation();
            }
            // Also refresh the conversation list to update last message
            fetchConversations();
        };

        const handleConversationJoined = (data: any) => {
            console.log('Joined conversation:', data);
        };

        const handleConversationLeft = (data: any) => {
            console.log('Left conversation:', data);
        };

        on('conversationMessage', handleConversationMessage);
        on('conversationJoined', handleConversationJoined);
        on('conversationLeft', handleConversationLeft);

        return () => {
            off('conversationMessage', handleConversationMessage);
            off('conversationJoined', handleConversationJoined);
            off('conversationLeft', handleConversationLeft);
        };
    }, [isConnected, selectedConversation, on, off, refreshSelectedConversation, fetchConversations]);

    // Initial fetch
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    // Join selected conversation room when WebSocket connects
    useEffect(() => {
        if (isConnected && selectedConversation) {
            emit('joinConversation', { conversationId: selectedConversation.id });
        }
    }, [isConnected, selectedConversation, emit]);

    return {
        conversations,
        selectedConversation,
        loading,
        error,
        fetchConversations,
        createConversation,
        selectConversation,
        refreshSelectedConversation,
    };
};
