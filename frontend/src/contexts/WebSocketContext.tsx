import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { message as antdMessage } from 'antd';

interface WebSocketContextType {
    socket: Socket | null;
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;
    emit: (event: string, data: any) => void;
    on: (event: string, handler: (...args: any[]) => void) => void;
    off: (event: string, handler: (...args: any[]) => void) => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
    children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    const connect = useCallback(() => {
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
            antdMessage.success('Connected to chat server');
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
            } else {
                antdMessage.error('Failed to connect to chat server');
            }
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

        setSocket(newSocket);
    }, []);

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
