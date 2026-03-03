import { Button, Card, Typography, Space, Divider, List, Tag, Result } from 'antd';
import {
    CrownFilled,
    CheckCircleFilled,
    ThunderboltOutlined,
    TeamOutlined,
    CloudUploadOutlined,
    CustomerServiceOutlined,
    ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { useRole } from '../hooks/useRole';
import { useEffect } from 'react';

const { Title, Text } = Typography;

const FREE_FEATURES = [
    { icon: <CheckCircleFilled style={{ color: '#52c41a' }} />, text: '1:1 Direct Messaging' },
    { icon: <CheckCircleFilled style={{ color: '#52c41a' }} />, text: 'Real-time message delivery' },
    { icon: <CheckCircleFilled style={{ color: '#52c41a' }} />, text: 'File attachments up to 5MB' },
    { icon: <CheckCircleFilled style={{ color: '#52c41a' }} />, text: 'Typing indicators & read receipts' },
    { icon: <CheckCircleFilled style={{ color: '#52c41a' }} />, text: 'Message search' },
];

const PREMIUM_FEATURES = [
    { icon: <CheckCircleFilled style={{ color: '#faad14' }} />, text: 'Everything in Free, plus:' },
    { icon: <TeamOutlined style={{ color: '#faad14' }} />, text: 'Group conversations (up to 50 members)' },
    { icon: <CloudUploadOutlined style={{ color: '#faad14' }} />, text: 'File attachments up to 50MB' },
    { icon: <CrownFilled style={{ color: '#faad14' }} />, text: 'Priority support' },
    { icon: <ThunderboltOutlined style={{ color: '#faad14' }} />, text: 'Premium badge & profile flair' },
];

export const SubscriptionPage = () => {
    const navigate = useNavigate();
    const { isPremium } = useRole();
    const { subscription, isLoading, startCheckout, openBillingPortal } = useSubscription();

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '40px 20px',
        }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/dashboard')}
                        style={{ color: 'white' }}
                    />
                    <Title level={2} style={{ color: 'white', margin: 0 }}>
                        <CrownFilled style={{ marginRight: 12 }} />
                        Subscription Plans
                    </Title>
                </div>

                {/* Plan Cards */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                    gap: 24,
                }}>
                    {/* Free Plan */}
                    <Card
                        hoverable
                        style={{ borderRadius: 16, border: '2px solid #e8e8e8' }}
                        styles={{ body: { padding: 32 } }}
                    >
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <div>
                                <Tag color="blue" style={{ marginBottom: 8 }}>FREE</Tag>
                                <Title level={3} style={{ margin: 0 }}>Free Plan</Title>
                                <Title level={1} style={{ margin: '8px 0 0' }}>
                                    $0<Text type="secondary" style={{ fontSize: 16 }}>/month</Text>
                                </Title>
                            </div>
                            <Divider style={{ margin: '8px 0' }} />
                            <List
                                dataSource={FREE_FEATURES}
                                split={false}
                                renderItem={(item) => (
                                    <List.Item style={{ padding: '6px 0', border: 'none' }}>
                                        <Space>
                                            {item.icon}
                                            <Text>{item.text}</Text>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                            {!isPremium && (
                                <Button block size="large" disabled style={{ borderRadius: 8 }}>
                                    Current Plan
                                </Button>
                            )}
                        </Space>
                    </Card>

                    {/* Premium Plan */}
                    <Card
                        hoverable
                        style={{
                            borderRadius: 16,
                            border: '2px solid #faad14',
                            background: 'linear-gradient(135deg, #fffbe6 0%, #fff7e6 100%)',
                        }}
                        styles={{ body: { padding: 32 } }}
                    >
                        <Space direction="vertical" size="large" style={{ width: '100%' }}>
                            <div>
                                <Tag icon={<CrownFilled />} color="gold" style={{ marginBottom: 8 }}>PREMIUM</Tag>
                                <Title level={3} style={{ margin: 0 }}>Premium Plan</Title>
                                <Title level={1} style={{ margin: '8px 0 0' }}>
                                    $9.99<Text type="secondary" style={{ fontSize: 16 }}>/month</Text>
                                </Title>
                            </div>
                            <Divider style={{ margin: '8px 0' }} />
                            <List
                                dataSource={PREMIUM_FEATURES}
                                split={false}
                                renderItem={(item) => (
                                    <List.Item style={{ padding: '6px 0', border: 'none' }}>
                                        <Space>
                                            {item.icon}
                                            <Text>{item.text}</Text>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                            {isPremium ? (
                                <Button
                                    block
                                    size="large"
                                    onClick={openBillingPortal}
                                    loading={isLoading}
                                    style={{ borderRadius: 8 }}
                                >
                                    <CustomerServiceOutlined /> Manage Subscription
                                </Button>
                            ) : (
                                <Button
                                    type="primary"
                                    block
                                    size="large"
                                    onClick={startCheckout}
                                    loading={isLoading}
                                    style={{
                                        borderRadius: 8,
                                        background: 'linear-gradient(135deg, #faad14 0%, #fa8c16 100%)',
                                        border: 'none',
                                        height: 48,
                                        fontWeight: 600,
                                        fontSize: 16,
                                    }}
                                >
                                    <CrownFilled /> Upgrade to Premium
                                </Button>
                            )}
                        </Space>
                    </Card>
                </div>

                {/* Subscription Info */}
                {subscription && (
                    <Card style={{ marginTop: 24, borderRadius: 16 }} styles={{ body: { padding: 24 } }}>
                        <Title level={4}>Current Subscription</Title>
                        <Space direction="vertical">
                            <Text>
                                Status: <Tag color={subscription.status === 'ACTIVE' ? 'green' : 'orange'}>{subscription.status}</Tag>
                            </Text>
                            <Text type="secondary">
                                Period: {new Date(subscription.currentPeriodStart).toLocaleDateString()} – {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                            </Text>
                        </Space>
                    </Card>
                )}
            </div>
        </div>
    );
};

export const SubscriptionSuccess = () => {
    const navigate = useNavigate();
    const { refetch } = useSubscription();

    useEffect(() => {
        // Refresh subscription data after successful checkout
        refetch();
    }, [refetch]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #52c41a22 0%, #73d13d22 100%)',
        }}>
            <Result
                status="success"
                title="Welcome to Premium!"
                subTitle="Your subscription is now active. Enjoy group chats, larger file uploads, and more."
                extra={[
                    <Button
                        type="primary"
                        key="dashboard"
                        onClick={() => navigate('/dashboard')}
                        size="large"
                    >
                        Go to Dashboard
                    </Button>,
                    <Button key="chat" onClick={() => navigate('/chat')} size="large">
                        Start Chatting
                    </Button>,
                ]}
            />
        </div>
    );
};

export const SubscriptionCancel = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #fff7e622 0%, #fffbe622 100%)',
        }}>
            <Result
                status="info"
                title="Checkout Cancelled"
                subTitle="No worries! You can upgrade to Premium anytime."
                extra={[
                    <Button
                        type="primary"
                        key="retry"
                        onClick={() => navigate('/subscription')}
                        size="large"
                    >
                        View Plans
                    </Button>,
                    <Button key="dashboard" onClick={() => navigate('/dashboard')} size="large">
                        Back to Dashboard
                    </Button>,
                ]}
            />
        </div>
    );
};
