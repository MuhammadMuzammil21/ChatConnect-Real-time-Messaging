import { Card, Button, Avatar, Layout, Statistic, Row, Col } from 'antd';
import { LogoutOutlined, UserOutlined, MessageOutlined, SettingOutlined, TeamOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../hooks/useRole';
import RoleBadge from '../components/RoleBadge';
import '../App.css';

const { Header, Content } = Layout;

function Dashboard() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { isFree, isPremium, isAdmin } = useRole();

    const handleLogout = async () => {
        await logout();
    };

    if (!user) {
        return null;
    }

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
                    <Button
                        type="text"
                        icon={<MessageOutlined />}
                        onClick={() => navigate('/chat')}
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
                        Chat
                    </Button>
                    <Button
                        type="text"
                        icon={<SettingOutlined />}
                        onClick={() => navigate('/profile')}
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
                        Profile
                    </Button>
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

            <Content style={{ padding: '32px', background: '#f8fafc' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    {/* Welcome Card */}
                    <Card
                        style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            border: 'none',
                            borderRadius: '16px',
                            marginBottom: '24px',
                            boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)',
                        }}
                        bodyStyle={{ padding: '32px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                            <Avatar
                                size={80}
                                src={user.avatarUrl}
                                icon={<UserOutlined />}
                                style={{
                                    border: '4px solid rgba(255, 255, 255, 0.3)',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <h1 style={{ margin: 0, color: '#fff', fontSize: '28px', fontWeight: 700 }}>
                                    Welcome back, {user.displayName}!
                                </h1>
                                <p style={{ margin: '8px 0 0 0', color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px' }}>
                                    {user.email}
                                </p>
                                <div style={{ marginTop: '12px' }}>
                                    <RoleBadge role={user.role} />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Stats Cards */}
                    <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                        <Col xs={24} sm={12} lg={8}>
                            <Card
                                style={{
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                }}
                            >
                                <Statistic
                                    title="Account Status"
                                    value="Active"
                                    prefix={<CheckCircleOutlined style={{ color: '#10b981' }} />}
                                    valueStyle={{ color: '#10b981', fontSize: '24px', fontWeight: 600 }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={8}>
                            <Card
                                style={{
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                }}
                            >
                                <Statistic
                                    title="Member Since"
                                    value={new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    prefix={<ClockCircleOutlined style={{ color: '#6366f1' }} />}
                                    valueStyle={{ color: '#1f2937', fontSize: '20px', fontWeight: 600 }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={8}>
                            <Card
                                style={{
                                    borderRadius: '12px',
                                    border: '1px solid #e2e8f0',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                }}
                            >
                                <Statistic
                                    title="Account Type"
                                    value={user.role}
                                    prefix={<TeamOutlined style={{ color: '#8b5cf6' }} />}
                                    valueStyle={{ color: '#1f2937', fontSize: '20px', fontWeight: 600 }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Quick Actions */}
                    <Card
                        title={<span style={{ fontSize: '18px', fontWeight: 600 }}>Quick Actions</span>}
                        style={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                            marginBottom: '24px',
                        }}
                    >
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12}>
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<MessageOutlined />}
                                    onClick={() => navigate('/chat')}
                                    block
                                    style={{
                                        height: '56px',
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                        border: 'none',
                                    }}
                                >
                                    Start Chatting
                                </Button>
                            </Col>
                            <Col xs={24} sm={12}>
                                <Button
                                    size="large"
                                    icon={<SettingOutlined />}
                                    onClick={() => navigate('/profile')}
                                    block
                                    style={{
                                        height: '56px',
                                        fontSize: '16px',
                                        fontWeight: 500,
                                        borderRadius: '10px',
                                        borderColor: '#6366f1',
                                        color: '#6366f1',
                                    }}
                                >
                                    Edit Profile
                                </Button>
                            </Col>
                        </Row>
                    </Card>

                    {/* Features Overview */}
                    <Card
                        title={<span style={{ fontSize: '18px', fontWeight: 600 }}>Your Features</span>}
                        style={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                        }}
                    >
                        <div style={{ display: 'grid', gap: '16px' }}>
                            {/* Free Features */}
                            <div
                                style={{
                                    padding: '20px',
                                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                                    borderRadius: '12px',
                                    border: '1px solid #86efac',
                                }}
                            >
                                <h3 style={{ margin: '0 0 12px 0', color: '#166534', fontSize: '16px', fontWeight: 600 }}>
                                    ✓ Included Features
                                </h3>
                                <ul style={{ margin: 0, paddingLeft: '20px', color: '#15803d' }}>
                                    <li>Real-time messaging</li>
                                    <li>Create conversations</li>
                                    <li>Message editing & deletion</li>
                                    <li>Online status indicators</li>
                                    <li>Typing indicators</li>
                                </ul>
                            </div>

                            {/* Premium/Admin Features */}
                            {(isPremium || isAdmin) && (
                                <div
                                    style={{
                                        padding: '20px',
                                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                                        borderRadius: '12px',
                                        border: '1px solid #93c5fd',
                                    }}
                                >
                                    <h3 style={{ margin: '0 0 12px 0', color: '#1e40af', fontSize: '16px', fontWeight: 600 }}>
                                        ⭐ {isAdmin ? 'Admin' : 'Premium'} Features
                                    </h3>
                                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#1e3a8a' }}>
                                        {isAdmin ? (
                                            <>
                                                <li>User management</li>
                                                <li>System analytics</li>
                                                <li>Role assignment</li>
                                                <li>Full system access</li>
                                            </>
                                        ) : (
                                            <>
                                                <li>Advanced chat features</li>
                                                <li>File sharing (up to 100MB)</li>
                                                <li>Custom themes</li>
                                                <li>Priority support</li>
                                            </>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </Content>
        </Layout>
    );
}

export default Dashboard;
