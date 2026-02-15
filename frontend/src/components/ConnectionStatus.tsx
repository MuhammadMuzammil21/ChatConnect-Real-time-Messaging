import React from 'react';
import { Badge, Tooltip } from 'antd';
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useWebSocket } from '../contexts/WebSocketContext';

export const ConnectionStatus: React.FC = () => {
    const { isConnected } = useWebSocket();

    return (
        <Tooltip title={isConnected ? 'Connected to chat server' : 'Disconnected from chat server'}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    background: isConnected
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 500,
                }}
            >
                <Badge
                    status={isConnected ? 'success' : 'error'}
                    style={{
                        fontSize: '10px',
                    }}
                />
                {isConnected ? (
                    <WifiOutlined style={{ fontSize: '14px', color: '#10b981' }} />
                ) : (
                    <DisconnectOutlined style={{ fontSize: '14px', color: '#ef4444' }} />
                )}
                <span style={{ color: isConnected ? '#10b981' : '#ef4444' }}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </span>
            </div>
        </Tooltip>
    );
};
