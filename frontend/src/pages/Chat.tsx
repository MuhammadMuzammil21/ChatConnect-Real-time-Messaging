import React, { useEffect, useState, useRef, useCallback } from 'react';
import { MessageSquare, ArrowLeft, LogOut, Menu, X } from 'lucide-react';
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
import { ConversationFilesPanel } from '../components/ConversationFilesPanel';
import { useConversations } from '../hooks/useConversations';
import { useMessages } from '../hooks/useMessages';
import { useAuth } from '../contexts/AuthContext';
import { messagesApi } from '../api/messages';

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
    const [filesPanelOpen, setFilesPanelOpen] = useState(false);
    const [editingMessage, setEditingMessage] = useState<any | null>(null);
    const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    const dragDepthRef = useRef(0);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleEditMessage = (message: any) => setEditingMessage(message);
    const handleCancelEdit = () => setEditingMessage(null);

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

    const handleBack = () => navigate('/dashboard');

    const handleSelectConversation = (conv: any) => {
        selectConversation(conv);
        setMobileSidebarOpen(false);
    };

    // Drag-and-drop handlers
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        dragDepthRef.current++;
        if (e.dataTransfer.types.includes('Files')) setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((_e: React.DragEvent) => {
        dragDepthRef.current--;
        if (dragDepthRef.current === 0) setIsDragOver(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        dragDepthRef.current = 0;
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) setDroppedFiles(files);
    }, []);

    // Paste handler
    useEffect(() => {
        const onPaste = (e: ClipboardEvent) => {
            if (!selectedConversation) return;
            const items = Array.from(e.clipboardData?.items || []);
            const files = items
                .filter(item => item.kind === 'file')
                .map(item => item.getAsFile())
                .filter((f): f is File => f !== null);
            if (files.length > 0) setDroppedFiles(files);
        };
        window.addEventListener('paste', onPaste);
        return () => window.removeEventListener('paste', onPaste);
    }, [selectedConversation]);

    useEffect(() => {
        connect();
        return () => { disconnect(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isConnected || !user) return;
        messagesApi
            .getAllUnreadCounts()
            .then(setUnreadCounts)
            .catch(() => { });
    }, [isConnected, user, setUnreadCounts]);

    return (
        <div className="flex flex-col h-screen" style={{ background: '#0a0a0a' }}>
            {/* ── Header ── */}
            <header className="flex items-center justify-between px-3 sm:px-4 md:px-6 h-14 border-b border-white/[0.06] shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Mobile sidebar toggle */}
                    <button
                        onClick={() => setMobileSidebarOpen(o => !o)}
                        className="lg:hidden flex items-center justify-center h-8 w-8 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                        {mobileSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                    <button
                        onClick={handleBack}
                        className="hidden lg:flex items-center justify-center h-8 w-8 rounded-md text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="hidden sm:block h-4 w-px bg-white/[0.08]" />
                    <div
                        className="flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                        <MessageSquare className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-neutral-200 tracking-wide">Chat</span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    <ConnectionStatus />
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md text-sm text-neutral-500 hover:text-red-400 hover:bg-white/[0.04] transition-colors"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </header>

            {/* ── Body (sidebar + chat area) ── */}
            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile sidebar overlay backdrop */}
                {mobileSidebarOpen && (
                    <div
                        className="lg:hidden fixed inset-0 z-30 bg-black/50"
                        onClick={() => setMobileSidebarOpen(false)}
                    />
                )}

                {/* Sidebar — always visible on lg+, slide-in overlay on mobile */}
                <aside
                    className={`
                        fixed lg:relative z-40 lg:z-auto top-14 lg:top-0 bottom-0 left-0
                        flex flex-col border-r border-white/[0.06] overflow-y-auto
                        transition-transform duration-200 ease-in-out
                        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    `}
                    style={{ width: '320px', maxWidth: '85vw', background: '#0f0f0f' }}
                >
                    <ConversationList
                        conversations={conversations}
                        selectedConversationId={selectedConversation?.id}
                        onSelectConversation={handleSelectConversation}
                        onCreateConversation={() => setCreateModalVisible(true)}
                        currentUserId={user?.id || ''}
                        loading={loading}
                    />
                </aside>

                {/* Main Chat Area */}
                <main
                    role="main"
                    aria-label="Chat messages"
                    className="flex-1 flex flex-col min-w-0 relative"
                    style={{ background: '#0a0a0a' }}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                >
                    {selectedConversation ? (
                        <>
                            <ConversationHeader
                                conversation={selectedConversation}
                                currentUserId={user?.id || ''}
                                onShowParticipants={() => setParticipantListVisible(true)}
                                onOpenSearch={() => setSearchModalVisible(true)}
                                onToggleFiles={() => setFilesPanelOpen(o => !o)}
                                filesOpen={filesPanelOpen}
                            />

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

                            {/* Drag-over overlay */}
                            {isDragOver && (
                                <div className="absolute inset-0 z-50 flex items-center justify-center rounded-lg pointer-events-none"
                                    style={{ background: 'rgba(99, 102, 241, 0.08)', border: '2px dashed rgba(99, 102, 241, 0.4)' }}
                                >
                                    <div className="text-center" style={{ color: '#818cf8' }}>
                                        <div className="text-4xl mb-2">📎</div>
                                        <div className="text-sm font-medium">Drop files to attach</div>
                                    </div>
                                </div>
                            )}

                            <MessageInputWithFiles
                                onSend={handleSendOrEdit}
                                conversationId={selectedConversation.id}
                                loading={sending || editingMessageId !== null}
                                maxLength={2000}
                                initialValue={editingMessage?.content}
                                placeholder={editingMessage ? 'Edit message...' : 'Type a message...'}
                                onCancel={editingMessage ? handleCancelEdit : undefined}
                                enableFileUpload={!editingMessage}
                                droppedFiles={droppedFiles}
                                onDroppedFilesConsumed={() => setDroppedFiles([])}
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4">
                            <MessageSquare className="h-12 w-12 text-neutral-700" />
                            <p className="text-sm text-neutral-500 text-center">Select a conversation to start chatting</p>
                            <button
                                onClick={() => setMobileSidebarOpen(true)}
                                className="lg:hidden mt-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                            >
                                View Conversations
                            </button>
                        </div>
                    )}
                </main>
            </div>

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

            {selectedConversation && (
                <ConversationFilesPanel
                    conversationId={selectedConversation.id}
                    open={filesPanelOpen}
                    onClose={() => setFilesPanelOpen(false)}
                />
            )}
        </div>
    );
};
