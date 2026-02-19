import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { message as antdMessage } from 'antd';

import { UserStatusEnum } from '../components/OnlineStatusBadge';

interface UserStatus {
    userId: string;
    status: UserStatusEnum;
    lastSeen?: Date;
}

interface WebSocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
    emit: (event: string, data: any) => void;
    on: (event: string, handler: (...args: any[]) => void) => void;
    off: (event: string, handler: (...args: any[]) => void) => void;
    // Typing indicators
    typingUsers: Map<string, Set<string>>; // conversationId -> Set of userIds
    emitTypingStart: (conversationId: string) => void;
    emitTypingStop: (conversationId: string) => void;
    // User status
    userStatuses: Map<string, UserStatus>; // userId -> UserStatus
    getUserStatus: (userId: string) => UserStatus | undefined;
    // Unread counts (real-time updates)
    unreadCounts: Record<string, number>; // conversationId -> unread count
    getUnreadCount: (conversationId: string) => number;
    setUnreadCounts: (counts: { conversationId: string; unreadCount: number }[]) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
    children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [typingUsers, setTypingUsers] = useState<Map<string, Set<string>>>(new Map());
    const [userStatuses, setUserStatuses] = useState<Map<string, UserStatus>>(new Map());
    const [unreadCounts, setUnreadCountsState] = useState<Record<string, number>>({});
    const [heartbeatInterval, setHeartbeatInterval] = useState<number | null>(null);
    // Track first-ever connection so we only show the 'connected' toast once,
    // not on every automatic reconnect.
    const hasConnectedOnce = React.useRef(false);

    const connect = useCallback(() => {
        // Guard: don't create a second socket if one is already alive
        if (socket && socket.connected) {
            console.log('Socket already connected, skipping duplicate connect()');
            return;
        }

        // Get token from localStorage
        const token = localStorage.getItem('accessToken');

        if (!token) {
            antdMessage.error('Please login to use chat features');
            return;
        }

        // Create socket connection with authentication
        const newSocket = io('http://localhost:3000/chat', {
            auth: {
                token: token,
            },
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5,
        });

        // Connection event handlers
        newSocket.on('connect', () => {
            console.log('WebSocket connected:', newSocket.id);
            setIsConnected(true);
            // Only show toast on the very first connection, not on silent auto-reconnects
            if (!hasConnectedOnce.current) {
                hasConnectedOnce.current = true;
                antdMessage.success('Connected to chat server');
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.log('WebSocket disconnected:', reason);
            setIsConnected(false);

            if (reason === 'io server disconnect') {
                // Server disconnected the socket, try to reconnect manually
                antdMessage.warning('Disconnected from chat server');
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            setIsConnected(false);

            if (error.message.includes('Unauthorized') || error.message.includes('auth')) {
                antdMessage.error('Authentication failed. Please login again.');
            }
            // Do NOT show a toast on every transient connect_error (fires on each retry),
            // the reconnect_failed event below handles the final failure toast.
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('WebSocket reconnected after', attemptNumber, 'attempts');
            antdMessage.success('Reconnected to chat server');
        });

        newSocket.on('reconnect_attempt', (attemptNumber) => {
            console.log('Reconnection attempt:', attemptNumber);
        });

        newSocket.on('reconnect_failed', () => {
            console.error('WebSocket reconnection failed');
            antdMessage.error('Failed to reconnect to chat server');
        });

        // Test ping/pong
        newSocket.on('pong', (data) => {
            console.log('Received pong:', data);
        });

        // Typing indicators
        newSocket.on('userTyping', (data: { userId: string; conversationId: string }) => {
            setTypingUsers((prev) => {
                const newMap = new Map(prev);
                if (!newMap.has(data.conversationId)) {
                    newMap.set(data.conversationId, new Set());
                }
                newMap.get(data.conversationId)!.add(data.userId);
                return newMap;
            });
        });

        newSocket.on('userStoppedTyping', (data: { userId: string; conversationId: string }) => {
            setTypingUsers((prev) => {
                const newMap = new Map(prev);
                const conversationTyping = newMap.get(data.conversationId);
                if (conversationTyping) {
                    conversationTyping.delete(data.userId);
                    if (conversationTyping.size === 0) {
                        newMap.delete(data.conversationId);
                    }
                }
                return newMap;
            });
        });

        // User status changes
        newSocket.on('userStatusChanged', (data: { userId: string; status: string; lastSeen: Date }) => {
            setUserStatuses((prev) => {
                const newMap = new Map(prev);
                newMap.set(data.userId, {
                    userId: data.userId,
                    status: data.status as UserStatusEnum,
                    lastSeen: data.lastSeen ? new Date(data.lastSeen) : undefined,
                });
                return newMap;
            });
        });

        // Real-time unread count updates
        newSocket.on('unreadCountUpdated', (data: { conversationId: string; unreadCount: number }) => {
            setUnreadCountsState((prev) => ({ ...prev, [data.conversationId]: data.unreadCount }));
        });
        newSocket.on('conversationRead', (data: { conversationId: string; unreadCount?: number }) => {
            setUnreadCountsState((prev) => ({
                ...prev,
                [data.conversationId]: data.unreadCount ?? 0,
            }));
        });

        setSocket(newSocket);
    }, []);

    // Start heartbeat when connected
    useEffect(() => {
        if (socket && isConnected) {
            // Send heartbeat every 30 seconds
            const interval = setInterval(() => {
                socket.emit('heartbeat');
            }, 30000);

            setHeartbeatInterval(interval);

            return () => {
                clearInterval(interval);
            };
        } else if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            setHeartbeatInterval(null);
        }
    }, [socket, isConnected]);

    const disconnect = useCallback(() => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
        }
    }, [socket]);

    const emit = useCallback((event: string, data: any) => {
        if (socket && isConnected) {
            socket.emit(event, data);
        } else {
            console.warn('Socket not connected, cannot emit event:', event);
        }
    }, [socket, isConnected]);

    const on = useCallback((event: string, handler: (...args: any[]) => void) => {
        if (socket) {
            socket.on(event, handler);
        }
    }, [socket]);

    const off = useCallback((event: string, handler: (...args: any[]) => void) => {
        if (socket) {
            socket.off(event, handler);
        }
    }, [socket]);

    const emitTypingStart = useCallback((conversationId: string) => {
        if (socket && isConnected) {
            socket.emit('typingStart', { conversationId });
        }
    }, [socket, isConnected]);

    const emitTypingStop = useCallback((conversationId: string) => {
        if (socket && isConnected) {
            socket.emit('typingStop', { conversationId });
        }
    }, [socket, isConnected]);

    const getUserStatus = useCallback((userId: string): UserStatus | undefined => {
        return userStatuses.get(userId);
    }, [userStatuses]);

    const getUnreadCount = useCallback(
        (conversationId: string): number => {
            return unreadCounts[conversationId] ?? 0;
        },
        [unreadCounts]
    );

    const setUnreadCounts = useCallback(
        (counts: { conversationId: string; unreadCount: number }[]) => {
            setUnreadCountsState(
                counts.reduce<Record<string, number>>((acc, { conversationId, unreadCount }) => {
                    acc[conversationId] = unreadCount;
                    return acc;
                }, {})
            );
        },
        []
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [socket]);

    const value: WebSocketContextType = {
        socket,
        isConnected,
        connect,
        disconnect,
        emit,
        on,
        off,
        typingUsers,
        emitTypingStart,
        emitTypingStop,
        userStatuses,
        getUserStatus,
        unreadCounts,
        getUnreadCount,
        setUnreadCounts,
    };

    return (
        <WebSocketContext.Provider value={value}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = (): WebSocketContextType => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};
