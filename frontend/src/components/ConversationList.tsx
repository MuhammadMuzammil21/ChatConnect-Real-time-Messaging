import React, { useState, useMemo } from 'react';
import { Spin } from 'antd';
import { Plus, Search, MessageSquare } from 'lucide-react';
import type { Conversation } from '../types/conversation';
import { ConversationItem } from './ConversationItem';
import { useWebSocket } from '../contexts/WebSocketContext';

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
    const { getUnreadCount } = useWebSocket();

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        const query = searchQuery.toLowerCase();
        return conversations.filter((conversation) => {
            if (conversation.name?.toLowerCase().includes(query)) return true;
            const participantMatch = conversation.participants.some((p) =>
                p.user.displayName.toLowerCase().includes(query)
            );
            if (participantMatch) return true;
            const lastMessage = conversation.messages?.[conversation.messages.length - 1];
            if (lastMessage?.content.toLowerCase().includes(query)) return true;
            return false;
        });
    }, [conversations, searchQuery]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-white/[0.06]">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-neutral-200 tracking-wide">Conversations</h3>
                    <button
                        onClick={onCreateConversation}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        New
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-600" />
                    <input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] pl-9 pr-3 py-2 text-sm text-neutral-300 placeholder:text-neutral-600 focus:outline-none focus:border-indigo-500/30 transition-colors"
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Spin size="large" />
                    </div>
                ) : filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                        <MessageSquare className="h-10 w-10 text-neutral-700 mb-3" />
                        <p className="text-sm text-neutral-500 mb-4">
                            {searchQuery ? 'No conversations found' : 'No conversations yet'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={onCreateConversation}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white transition-all hover:opacity-90"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Start a Conversation
                            </button>
                        )}
                    </div>
                ) : (
                    <div>
                        {filteredConversations.map((conversation) => (
                            <ConversationItem
                                key={conversation.id}
                                conversation={conversation}
                                isSelected={conversation.id === selectedConversationId}
                                onClick={onSelectConversation}
                                currentUserId={currentUserId}
                                unreadCount={getUnreadCount(conversation.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
