import React, { useEffect } from 'react';
import { Layout, Card, Button, Space } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { useWebSocket } from '../contexts/WebSocketContext';
import { ConnectionStatus } from '../components/ConnectionStatus';

const { Header, Content } = Layout;

export const Chat: React.FC = () => {
    const { connect, disconnect, isConnected, emit } = useWebSocket();

    useEffect(() => {
        // Auto-connect when component mounts
        connect();

        return () => {
            // Disconnect when component unmounts
            disconnect();
        };
    }, [connect, disconnect]);

    const handlePing = () => {
        emit('ping', { message: 'Hello from client!' });
    };

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{
                background: '#fff',
                padding: '0 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #f0f0f0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <MessageOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                    <h2 style={{ margin: 0 }}>Chat Application</h2>
                </div>
                <ConnectionStatus />
            </Header>

            <Content style={{ padding: '24px' }}>
                <Card title="Chat Interface" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        <div>
                            <h3>WebSocket Status</h3>
                            <p>Connection Status: <strong>{isConnected ? 'Connected' : 'Disconnected'}</strong></p>
                        </div>

                        <div>
                            <h3>Test Connection</h3>
                            <Space>
                                <Button type="primary" onClick={connect} disabled={isConnected}>
                                    Connect
                                </Button>
                                <Button onClick={disconnect} disabled={!isConnected}>
                                    Disconnect
                                </Button>
                                <Button onClick={handlePing} disabled={!isConnected}>
                                    Send Ping
                                </Button>
                            </Space>
                        </div>

                        <div>
                            <p style={{ color: '#666', fontSize: '14px' }}>
                                This is a placeholder chat interface. Conversation list and messaging features will be added in the next days.
                            </p>
                        </div>
                    </Space>
                </Card>
            </Content>
        </Layout>
    );
};
