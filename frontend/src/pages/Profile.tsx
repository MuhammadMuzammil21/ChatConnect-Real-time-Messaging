import { useState, useEffect } from 'react';
import { Card, Button, Form, Input, Spin, message, Layout, Row, Col, Avatar } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, ArrowLeftOutlined, UserOutlined, MessageOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileApi, type ProfileData, type UpdateProfileData } from '../api/profile';
import AvatarUpload from '../components/AvatarUpload';
import RoleBadge from '../components/RoleBadge';
import '../App.css';

const { TextArea } = Input;
const { Header, Content } = Layout;

function Profile() {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const [form] = Form.useForm();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState<ProfileData | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await profileApi.getProfile();
            setProfileData(data);
            form.setFieldsValue({
                displayName: data.displayName,
                statusMessage: data.statusMessage || '',
            });
        } catch (error) {
            message.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        form.setFieldsValue({
            displayName: profileData?.displayName,
            statusMessage: profileData?.statusMessage || '',
        });
    };

    const handleSave = async (values: UpdateProfileData) => {
        try {
            setLoading(true);
            const updatedProfile = await profileApi.updateProfile(values);
            setProfileData(updatedProfile);
            setIsEditing(false);
            message.success('Profile updated successfully!');

            // Update auth context with new user data
            if (user) {
                login({
                    accessToken: localStorage.getItem('accessToken') || '',
                    refreshToken: localStorage.getItem('refreshToken') || '',
                    user: {
                        ...user,
                        displayName: updatedProfile.displayName,
                        avatarUrl: updatedProfile.avatarUrl,
                    },
                });
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to update profile';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUploadSuccess = (avatarUrl: string) => {
        setProfileData(prev => prev ? { ...prev, avatarUrl } : null);

        // Update auth context
        if (user) {
            login({
                accessToken: localStorage.getItem('accessToken') || '',
                refreshToken: localStorage.getItem('refreshToken') || '',
                user: {
                    ...user,
                    avatarUrl,
                },
            });
        }
    };

    if (loading && !profileData) {
        return (
            <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
            </div>
        );
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
                    <Button
                        type="text"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/dashboard')}
                        style={{
                            color: '#fff',
                            fontSize: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                        }}
                        className="header-back-button"
                    />
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
                    {!isEditing ? (
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={handleEdit}
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
                            Edit Profile
                        </Button>
                    ) : (
                        <>
                            <Button
                                type="text"
                                icon={<SaveOutlined />}
                                onClick={() => form.submit()}
                                loading={loading}
                                style={{
                                    color: '#fff',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    padding: '0 16px',
                                    background: 'rgba(255, 255, 255, 0.15)',
                                }}
                                className="header-logout-button"
                            >
                                Save
                            </Button>
                            <Button
                                type="text"
                                icon={<CloseOutlined />}
                                onClick={handleCancel}
                                disabled={loading}
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
                                Cancel
                            </Button>
                        </>
                    )}
                </div>
            </Header>

            <Content style={{ padding: '32px', background: '#f8fafc' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {profileData && (
                        <>
                            {/* Profile Header Card */}
                            <Card
                                style={{
                                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                    border: 'none',
                                    borderRadius: '16px',
                                    marginBottom: '24px',
                                    boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)',
                                }}
                                bodyStyle={{ padding: '32px', textAlign: 'center' }}
                            >
                                <AvatarUpload
                                    currentAvatar={profileData.avatarUrl}
                                    onUploadSuccess={handleAvatarUploadSuccess}
                                    size={120}
                                />
                                <h2 style={{ margin: '16px 0 8px 0', color: '#fff', fontSize: '28px', fontWeight: 700 }}>
                                    {profileData.displayName}
                                </h2>
                                <p style={{ margin: '0 0 12px 0', color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px' }}>
                                    {profileData.email}
                                </p>
                                <RoleBadge role={profileData.role} />
                            </Card>

                            {/* Profile Information Card */}
                            {!isEditing ? (
                                <Card
                                    title={<span style={{ fontSize: '18px', fontWeight: 600 }}>Profile Information</span>}
                                    style={{
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                    }}
                                >
                                    <Row gutter={[16, 16]}>
                                        <Col span={24}>
                                            <div style={{ marginBottom: '16px' }}>
                                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Display Name</div>
                                                <div style={{ fontSize: '16px', color: '#1f2937', fontWeight: 500 }}>{profileData.displayName}</div>
                                            </div>
                                        </Col>
                                        <Col span={24}>
                                            <div style={{ marginBottom: '16px' }}>
                                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Email</div>
                                                <div style={{ fontSize: '16px', color: '#1f2937', fontWeight: 500 }}>{profileData.email}</div>
                                            </div>
                                        </Col>
                                        <Col span={24}>
                                            <div style={{ marginBottom: '16px' }}>
                                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Status Message</div>
                                                <div style={{ fontSize: '16px', color: '#1f2937', fontWeight: 500 }}>
                                                    {profileData.statusMessage || 'No status message'}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <div style={{ marginBottom: '16px' }}>
                                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Member Since</div>
                                                <div style={{ fontSize: '16px', color: '#1f2937', fontWeight: 500 }}>
                                                    {new Date(profileData.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </Col>
                                        <Col span={12}>
                                            <div style={{ marginBottom: '16px' }}>
                                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Subscription</div>
                                                <div style={{ fontSize: '16px', color: '#1f2937', fontWeight: 500 }}>
                                                    {profileData.subscriptionStatus}
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>
                                </Card>
                            ) : (
                                <Card
                                    title={<span style={{ fontSize: '18px', fontWeight: 600 }}>Edit Profile</span>}
                                    style={{
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                                    }}
                                >
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        onFinish={handleSave}
                                        initialValues={{
                                            displayName: profileData.displayName,
                                            statusMessage: profileData.statusMessage || '',
                                        }}
                                    >
                                        <Form.Item
                                            label={<span style={{ fontSize: '14px', fontWeight: 500 }}>Display Name</span>}
                                            name="displayName"
                                            rules={[
                                                { required: true, message: 'Please enter your display name' },
                                                { min: 2, message: 'Display name must be at least 2 characters' },
                                                { max: 50, message: 'Display name must not exceed 50 characters' },
                                            ]}
                                        >
                                            <Input
                                                placeholder="Enter your display name"
                                                size="large"
                                                style={{ borderRadius: '8px' }}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label={<span style={{ fontSize: '14px', fontWeight: 500 }}>Status Message</span>}
                                            name="statusMessage"
                                            rules={[
                                                { max: 200, message: 'Status message must not exceed 200 characters' },
                                            ]}
                                        >
                                            <TextArea
                                                rows={3}
                                                placeholder="What's on your mind?"
                                                showCount
                                                maxLength={200}
                                                style={{ borderRadius: '8px' }}
                                            />
                                        </Form.Item>
                                    </Form>
                                </Card>
                            )}
                        </>
                    )}
                </div>
            </Content>
        </Layout>
    );
}

export default Profile;
