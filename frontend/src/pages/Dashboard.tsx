import { Card, Button, Avatar, Descriptions, Divider } from 'antd';
import { LogoutOutlined, UserOutlined, LockOutlined, CrownOutlined, SettingOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRole } from '../hooks/useRole';
import RoleBadge from '../components/RoleBadge';
import RoleGate from '../components/RoleGate';
import UpgradeBanner from '../components/UpgradeBanner';
import { UserRole } from '../types/auth';

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <Card
                    className="shadow-2xl"
                    title={
                        <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-bold">Dashboard</h1>
                            <div className="flex gap-2">
                                <Button
                                    type="default"
                                    icon={<MessageOutlined />}
                                    onClick={() => navigate('/chat')}
                                >
                                    Chat
                                </Button>
                                <Button
                                    type="default"
                                    icon={<SettingOutlined />}
                                    onClick={() => navigate('/profile')}
                                >
                                    Profile
                                </Button>
                                <Button
                                    type="primary"
                                    danger
                                    icon={<LogoutOutlined />}
                                    onClick={handleLogout}
                                >
                                    Logout
                                </Button>
                            </div>
                        </div>
                    }
                >
                    <div className="flex items-center space-x-6 mb-8">
                        <Avatar
                            size={80}
                            src={user.avatarUrl}
                            icon={<UserOutlined />}
                        />
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-800">
                                {user.displayName}
                            </h2>
                            <p className="text-gray-600">{user.email}</p>
                            <div className="mt-2">
                                <RoleBadge role={user.role} />
                            </div>
                        </div>
                    </div>

                    <Descriptions title="User Information" bordered column={1}>
                        <Descriptions.Item label="User ID">{user.id}</Descriptions.Item>
                        <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                        <Descriptions.Item label="Display Name">{user.displayName}</Descriptions.Item>
                        <Descriptions.Item label="Role">
                            <RoleBadge role={user.role} />
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider>Role-Based Features</Divider>

                    {/* Free User Features */}
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center gap-2">
                                <UserOutlined /> Free Features (Everyone)
                            </h3>
                            <ul className="text-green-700 list-disc list-inside">
                                <li>Basic chat messaging</li>
                                <li>Profile management</li>
                                <li>Standard support</li>
                            </ul>
                        </div>

                        {/* Premium Features */}
                        <RoleGate
                            allowedRoles={[UserRole.PREMIUM, UserRole.ADMIN]}
                            fallback={
                                <div className="p-4 bg-gray-100 border border-gray-300 rounded-lg relative">
                                    <div className="absolute top-2 right-2">
                                        <LockOutlined className="text-gray-400 text-xl" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                                        Premium Features (Locked)
                                    </h3>
                                    <ul className="text-gray-500 list-disc list-inside mb-3">
                                        <li>Advanced chat features</li>
                                        <li>File sharing (up to 100MB)</li>
                                        <li>Custom themes</li>
                                        <li>Priority support</li>
                                    </ul>
                                    <UpgradeBanner feature="premium features" />
                                </div>
                            }
                        >
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                                    Premium Features (Unlocked)
                                </h3>
                                <ul className="text-blue-700 list-disc list-inside">
                                    <li>Advanced chat features</li>
                                    <li>File sharing (up to 100MB)</li>
                                    <li>Custom themes</li>
                                    <li>Priority support</li>
                                </ul>
                            </div>
                        </RoleGate>

                        {/* Admin Features */}
                        <RoleGate
                            allowedRoles={[UserRole.ADMIN]}
                            fallback={null}
                        >
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <h3 className="text-lg font-semibold text-purple-800 mb-2 flex items-center gap-2">
                                    <CrownOutlined /> Admin Features
                                </h3>
                                <ul className="text-purple-700 list-disc list-inside">
                                    <li>User management</li>
                                    <li>System analytics</li>
                                    <li>Role assignment</li>
                                    <li>Full system access</li>
                                </ul>
                            </div>
                        </RoleGate>
                    </div>

                    <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                        <h3 className="text-lg font-semibold text-green-800 mb-2">
                            🎉 Authentication Successful!
                        </h3>
                        <p className="text-green-700">
                            You have successfully logged in using Google OAuth 2.0.
                            Your JWT tokens are securely stored and automatically refreshed when needed.
                        </p>
                        <p className="text-green-700 mt-2">
                            <strong>Current Role:</strong> {user.role} - {isFree && 'Basic access granted'}
                            {isPremium && !isAdmin && 'Premium features unlocked'}
                            {isAdmin && 'Full admin access granted'}
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default Dashboard;
