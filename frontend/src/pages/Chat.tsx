import React, { useEffect, useState } from 'react';
import { Layout, Empty, Button } from 'antd';
import { MessageOutlined, ArrowLeftOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { ConversationList } from '../components/ConversationList';
import { ConversationHeader } from '../components/ConversationHeader';
import { CreateConversationModal } from '../components/CreateConversationModal';
import { ParticipantList } from '../components/ParticipantList';
import { MessageList } from '../components/MessageList';
import { MessageInputWithFiles } from '../components/MessageInputWithFiles';
import { MessageSearch } from '../components/MessageSearch';
import { useConversations } from '../hooks/useConversations';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../contexts/AuthContext';
import { messagesApi } from '../api/messages';

const { Header, Content, Sider } = Layout;

export const Chat: React.FC = () => {
    const navigate = useNavigate();
    const { connect, disconnect, isConnected, setUnreadCounts } = useWebSocket();
    const { user, logout } = useAuth();
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

    const handleSendOrEdit = async (content: string, fileIds?: string[]) => {
        if (editingMessage) {
            await editMessage(editingMessage.id, content);
            setEditingMessage(null);
        } else {
            await sendMessage(content, fileIds);
        }
    };

    const handleLogout = () => {
        disconnect();
        logout();
        navigate('/');
    };

    const handleBack = () => {
        navigate('/dashboard');
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
            .catch(() => { });
    }, [isConnected, user, setUnreadCounts]);

    return (
        <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Header
                style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    padding: '0 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    height: '72px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={handleBack}
                        style={{
                            color: '#fff',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                        }}
                        className="header-back-button"
                    />
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)',
                    }}>
                        <MessageOutlined style={{ fontSize: '24px', color: '#fff' }} />
                    </div>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: 600 }}>
                        ChatConnect
                    </h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <ConnectionStatus />
                    <Button
                        type="text"
                        icon={<LogoutOutlined />}
                        onClick={handleLogout}
                        style={{
                            color: '#fff',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            height: '40px',
                            borderRadius: '10px',
                            padding: '0 16px',
                        }}
                        className="header-logout-button"
                    >
                        Logout
                    </Button>
                </div>
            </Header>

            <Layout style={{ background: '#f8fafc' }}>
                {/* Conversation List Sidebar */}
                <Sider
                    width={380}
                    style={{
                        background: '#fff',
                        overflow: 'auto',
                        height: 'calc(100vh - 72px)',
                        borderRight: '1px solid #e2e8f0',
                        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.04)',
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
                            <MessageInputWithFiles
                                onSend={handleSendOrEdit}
                                conversationId={selectedConversation.id}
                                loading={sending || editingMessageId !== null}
                                maxLength={2000}
                                initialValue={editingMessage?.content}
                                placeholder={editingMessage ? 'Edit message...' : 'Type a message...'}
                                onCancel={editingMessage ? handleCancelEdit : undefined}
                                enableFileUpload={!editingMessage}
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
