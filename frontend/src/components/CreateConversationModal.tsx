import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Radio, message, Alert, Button } from 'antd';
import { CrownFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { CreateConversationDto } from '../types/conversation';
import { ConversationType } from '../types/conversation';
import type { User } from '../types';
import { useRole } from '../hooks/useRole';
import axios from 'axios';

const { Option } = Select;

interface CreateConversationModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    currentUserId: string;
}

export const CreateConversationModal: React.FC<CreateConversationModalProps> = ({
    visible,
    onClose,
    onSuccess,
    currentUserId,
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const { isPremium } = useRole();
    const navigate = useNavigate();
    const [conversationType, setConversationType] = useState<ConversationType>(
        ConversationType.DIRECT
    );

    // Fetch users for participant selection
    useEffect(() => {
        if (visible) {
            fetchUsers();
        }
    }, [visible]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const token = localStorage.getItem('accessToken');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

            const response = await axios.get(`${API_URL}/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            // Filter out current user
            const filteredUsers = response.data.filter(
                (user: User) => user.id !== currentUserId
            );
            setUsers(filteredUsers);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            message.error('Failed to load users');
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const dto: CreateConversationDto = {
                type: conversationType,
                participantIds: values.participantIds,
            };

            if (conversationType === ConversationType.GROUP) {
                dto.name = values.name;
            }

            const token = localStorage.getItem('accessToken');
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

            await axios.post(`${API_URL}/conversations`, dto, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            message.success('Conversation created successfully');
            form.resetFields();
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to create conversation:', error);
            message.error(
                error.response?.data?.message || 'Failed to create conversation'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setConversationType(ConversationType.DIRECT);
        onClose();
    };

    return (
        <Modal
            title="Create New Conversation"
            open={visible}
            onOk={handleSubmit}
            onCancel={handleCancel}
            confirmLoading={loading}
            okText="Create"
            cancelText="Cancel"
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    type: ConversationType.DIRECT,
                }}
            >
                <Form.Item
                    label="Conversation Type"
                    name="type"
                    rules={[{ required: true, message: 'Please select a type' }]}
                >
                    <Radio.Group
                        onChange={(e) => {
                            if (e.target.value === ConversationType.GROUP && !isPremium) {
                                return; // Don't allow switching
                            }
                            setConversationType(e.target.value);
                        }}
                        value={conversationType}
                    >
                        <Radio value={ConversationType.DIRECT}>Direct Message</Radio>
                        <Radio value={ConversationType.GROUP} disabled={!isPremium}>
                            Group Chat {!isPremium && <CrownFilled style={{ color: '#faad14', marginLeft: 4 }} />}
                        </Radio>
                    </Radio.Group>
                </Form.Item>

                {!isPremium && (
                    <Alert
                        message="Premium Feature"
                        description={
                            <span>
                                Group chats are available for Premium subscribers.{' '}
                                <Button
                                    type="link"
                                    size="small"
                                    style={{ padding: 0 }}
                                    onClick={() => {
                                        onClose();
                                        navigate('/subscription');
                                    }}
                                >
                                    Upgrade now
                                </Button>
                            </span>
                        }
                        type="info"
                        showIcon
                        icon={<CrownFilled style={{ color: '#faad14' }} />}
                        style={{ marginBottom: 16 }}
                    />
                )}

                {conversationType === ConversationType.GROUP && (
                    <Form.Item
                        label="Group Name"
                        name="name"
                        rules={[
                            { required: true, message: 'Please enter a group name' },
                            { max: 100, message: 'Name must be less than 100 characters' },
                        ]}
                    >
                        <Input placeholder="Enter group name" />
                    </Form.Item>
                )}

                <Form.Item
                    label="Participants"
                    name="participantIds"
                    rules={[
                        { required: true, message: 'Please select at least one participant' },
                        {
                            validator: (_, value) => {
                                if (
                                    conversationType === ConversationType.DIRECT &&
                                    value?.length !== 1
                                ) {
                                    return Promise.reject(
                                        'Direct conversations must have exactly one other participant'
                                    );
                                }
                                if (
                                    conversationType === ConversationType.GROUP &&
                                    value?.length > 49
                                ) {
                                    return Promise.reject(
                                        'Group conversations cannot have more than 50 participants'
                                    );
                                }
                                return Promise.resolve();
                            },
                        },
                    ]}
                >
                    <Select
                        mode={
                            conversationType === ConversationType.GROUP
                                ? 'multiple'
                                : undefined
                        }
                        placeholder="Select participants"
                        loading={loadingUsers}
                        optionFilterProp="children"
                        showSearch
                    >
                        {users.map((user) => (
                            <Option key={user.id} value={user.id}>
                                {user.displayName} ({user.email})
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            </Form>
        </Modal>
    );
};
