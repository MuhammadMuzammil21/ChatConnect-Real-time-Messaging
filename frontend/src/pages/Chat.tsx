import React, { useEffect, useState } from 'react';
import { Layout, Empty, Button, Space, Typography, Input, List, Avatar } from 'antd';
import { MessageOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { useWebSocket } from '../contexts/WebSocketContext';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { ConversationList } from '../components/ConversationList';
import { ConversationHeader } from '../components/ConversationHeader';
import { CreateConversationModal } from '../components/CreateConversationModal';
import { ParticipantList } from '../components/ParticipantList';
import { useConversations } from '../hooks/useConversations';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;
const { TextArea } = Input;

export const Chat: React.FC = () => {
    const { connect, disconnect, isConnected, emit } = useWebSocket();
    const { user } = useAuth();
    const {
        conversations,
        selectedConversation,
        loading,
        selectConversation,
        refreshSelectedConversation,
    } = useConversations();

    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [participantListVisible, setParticipantListVisible] = useState(false);
    const [messageInput, setMessageInput] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);

    useEffect(() => {
        // Auto-connect when component mounts
        connect();

        return () => {
            // Disconnect when component unmounts
            disconnect();
        };
    }, [connect, disconnect]);

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedConversation || !isConnected) {
            return;
        }

        setSendingMessage(true);
        try {
            emit('sendConversationMessage', {
                conversationId: selectedConversation.id,
                content: messageInput.trim(),
            });
            setMessageInput('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSendingMessage(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

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
                <Content style={{ background: '#f5f5f5' }}>
                    {selectedConversation ? (
                        <div className="flex flex-col h-full">
                            {/* Conversation Header */}
                            <ConversationHeader
                                conversation={selectedConversation}
                                currentUserId={user?.id || ''}
                                onShowParticipants={() => setParticipantListVisible(true)}
                            />

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                                {selectedConversation.messages &&
                                    selectedConversation.messages.length > 0 ? (
                                    <List
                                        dataSource={selectedConversation.messages}
                                        renderItem={(message) => {
                                            const isOwnMessage =
                                                message.sender.id === user?.id;
                                            return (
                                                <div
                                                    key={message.id}
                                                    className={`flex mb-4 ${isOwnMessage
                                                        ? 'justify-end'
                                                        : 'justify-start'
                                                        }`}
                                                >
                                                    {!isOwnMessage && (
                                                        <Avatar
                                                            src={message.sender.avatarUrl}
                                                            icon={<UserOutlined />}
                                                            className="mr-2"
                                                        >
                                                            {!message.sender.avatarUrl &&
                                                                message.sender.displayName[0].toUpperCase()}
                                                        </Avatar>
                                                    )}
                                                    <div
                                                        className={`max-w-[70%] ${isOwnMessage
                                                            ? 'items-end'
                                                            : 'items-start'
                                                            }`}
                                                    >
                                                        {!isOwnMessage && (
                                                            <Text
                                                                strong
                                                                className="text-xs mb-1 block"
                                                            >
                                                                {message.sender.displayName}
                                                            </Text>
                                                        )}
                                                        <div
                                                            className={`p-3 rounded-lg ${isOwnMessage
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-white'
                                                                }`}
                                                        >
                                                            <Text
                                                                className={
                                                                    isOwnMessage
                                                                        ? 'text-white'
                                                                        : ''
                                                                }
                                                            >
                                                                {message.content}
                                                            </Text>
                                                        </div>
                                                        <Text
                                                            type="secondary"
                                                            className="text-xs mt-1 block"
                                                        >
                                                            {dayjs(message.createdAt).format(
                                                                'HH:mm'
                                                            )}
                                                        </Text>
                                                    </div>
                                                    {isOwnMessage && (
                                                        <Avatar
                                                            src={message.sender.avatarUrl}
                                                            icon={<UserOutlined />}
                                                            className="ml-2"
                                                        >
                                                            {!message.sender.avatarUrl &&
                                                                message.sender.displayName[0].toUpperCase()}
                                                        </Avatar>
                                                    )}
                                                </div>
                                            );
                                        }}
                                    />
                                ) : (
                                    <Empty
                                        description="No messages yet"
                                        className="mt-20"
                                    />
                                )}
                            </div>

                            {/* Message Input */}
                            <div className="p-4 bg-white border-t border-gray-200">
                                <Space.Compact style={{ width: '100%' }}>
                                    <TextArea
                                        placeholder="Type a message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        autoSize={{ minRows: 1, maxRows: 4 }}
                                        disabled={!isConnected}
                                    />
                                    <Button
                                        type="primary"
                                        icon={<SendOutlined />}
                                        onClick={handleSendMessage}
                                        loading={sendingMessage}
                                        disabled={!isConnected || !messageInput.trim()}
                                    >
                                        Send
                                    </Button>
                                </Space.Compact>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Select a conversation to start chatting"
                            >
                                <Button
                                    type="primary"
                                    onClick={() => setCreateModalVisible(true)}
                                >
                                    Create New Conversation
                                </Button>
                            </Empty>
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
                    // Conversations will be refreshed automatically by the hook
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
        </Layout>
    );
};

