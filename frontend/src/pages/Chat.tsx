import React, { useEffect, useState } from 'react';
import { Layout, Empty } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { useWebSocket } from '../contexts/WebSocketContext';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { ConversationList } from '../components/ConversationList';
import { ConversationHeader } from '../components/ConversationHeader';
import { CreateConversationModal } from '../components/CreateConversationModal';
import { ParticipantList } from '../components/ParticipantList';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';
import { MessageSearch } from '../components/MessageSearch';
import { useConversations } from '../hooks/useConversations';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../contexts/AuthContext';
import { messagesApi } from '../api/messages';

const { Header, Content, Sider } = Layout;

export const Chat: React.FC = () => {
    const { connect, disconnect, isConnected, setUnreadCounts } = useWebSocket();
    const { user } = useAuth();
    const {
        conversations,
        selectedConversation,
        loading,
        selectConversation,
        refreshSelectedConversation,
    } = useConversations();

    const {
        messages,
        loading: messagesLoading,
        sending,
        hasMore,
        loadingMore,
        editingMessageId,
        deletingMessageId,
        sendMessage,
        editMessage,
        deleteMessage,
        loadMore,
        searchMessages,
    } = useMessages({
        conversationId: selectedConversation?.id || null,
        currentUserId: user?.id || '',
    });

    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [participantListVisible, setParticipantListVisible] = useState(false);
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [editingMessage, setEditingMessage] = useState<any | null>(null);

    const handleEditMessage = (message: any) => {
        setEditingMessage(message);
    };

    const handleCancelEdit = () => {
        setEditingMessage(null);
    };

    const handleSendOrEdit = async (content: string) => {
        if (editingMessage) {
            await editMessage(editingMessage.id, content);
            setEditingMessage(null);
        } else {
            await sendMessage(content);
        }
    };

    useEffect(() => {
        // Auto-connect when component mounts
        connect();

        return () => {
            // Disconnect when component unmounts
            disconnect();
        };
    }, [connect, disconnect]);

    // Fetch initial unread counts when connected and user is available
    useEffect(() => {
        if (!isConnected || !user) return;
        messagesApi
            .getAllUnreadCounts()
            .then(setUnreadCounts)
            .catch(() => {});
    }, [isConnected, user, setUnreadCounts]);

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header
                style={{
                    background: '#fff',
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #f0f0f0',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <MessageOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <h2 style={{ margin: 0 }}>Chat Application</h2>
                </div>
                <ConnectionStatus />
            </Header>

            <Layout>
                {/* Conversation List Sidebar */}
                <Sider
                    width={350}
                    style={{
                        background: '#fff',
                        overflow: 'auto',
                        height: 'calc(100vh - 64px)',
                    }}
                    breakpoint="lg"
                    collapsedWidth="0"
                >
                    <ConversationList
                        conversations={conversations}
                        selectedConversationId={selectedConversation?.id}
                        onSelectConversation={selectConversation}
                        onCreateConversation={() => setCreateModalVisible(true)}
                        currentUserId={user?.id || ''}
                        loading={loading}
                    />
                </Sider>

                {/* Main Chat Area */}
                <Content
                    role="main"
                    aria-label="Chat messages"
                    style={{
                        background: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        height: 'calc(100vh - 64px)',
                        minWidth: 0,
                    }}
                >
                    {selectedConversation ? (
                        <>
                            {/* Conversation Header */}
                            <ConversationHeader
                                conversation={selectedConversation}
                                currentUserId={user?.id || ''}
                                onShowParticipants={() => setParticipantListVisible(true)}
                                onOpenSearch={() => setSearchModalVisible(true)}
                            />

                            {/* Messages Area */}
                            <MessageList
                                messages={messages}
                                currentUserId={user?.id || ''}
                                conversationId={selectedConversation.id}
                                loading={messagesLoading}
                                hasMore={hasMore}
                                onLoadMore={loadMore}
                                loadingMore={loadingMore}
                                onEditMessage={handleEditMessage}
                                onDeleteMessage={deleteMessage}
                                deletingMessageId={deletingMessageId}
                            />

                            {/* Message Input */}
                            <MessageInput
                                onSend={handleSendOrEdit}
                                conversationId={selectedConversation.id}
                                loading={sending || editingMessageId !== null}
                                maxLength={2000}
                                initialValue={editingMessage?.content}
                                placeholder={editingMessage ? 'Edit message...' : 'Type a message...'}
                                onCancel={editingMessage ? handleCancelEdit : undefined}
                            />
                        </>
                    ) : (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                            }}
                        >
                            <Empty
                            description="Select a conversation to start chatting"
                            aria-live="polite"
                        />
                        </div>
                    )}
                </Content>
            </Layout>

            {/* Modals */}
            <CreateConversationModal
                visible={createModalVisible}
                onClose={() => setCreateModalVisible(false)}
                onSuccess={() => {
                    setCreateModalVisible(false);
                    refreshSelectedConversation();
                }}
                currentUserId={user?.id || ''}
            />

            {selectedConversation && (
                <ParticipantList
                    visible={participantListVisible}
                    onClose={() => setParticipantListVisible(false)}
                    conversation={selectedConversation}
                    currentUserId={user?.id || ''}
                    onUpdate={refreshSelectedConversation}
                />
            )}

            {selectedConversation && (
                <MessageSearch
                    visible={searchModalVisible}
                    onClose={() => setSearchModalVisible(false)}
                    onSearch={searchMessages}
                    participants={selectedConversation.participants.map((p) => ({
                        id: p.user.id,
                        displayName: p.user.displayName,
                    }))}
                />
            )}
        </Layout>
    );
};
