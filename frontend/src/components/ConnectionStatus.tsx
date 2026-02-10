import React from 'react';
import { Badge, Tooltip } from 'antd';
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useWebSocket } from '../contexts/WebSocketContext';

export const ConnectionStatus: React.FC = () => {
    const { isConnected } = useWebSocket();

    return (
        <Tooltip title={isConnected ? 'Connected to chat server' : 'Disconnected from chat server'}>
            <Badge
                status={isConnected ? 'success' : 'error'}
                text={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isConnected ? <WifiOutlined /> : <DisconnectOutlined />}
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                }
            />
        </Tooltip>
    );
};
