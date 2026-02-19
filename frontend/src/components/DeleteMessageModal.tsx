import { Modal, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import type { Message } from '../types/message';

const { Text } = Typography;

interface DeleteMessageModalProps {
    visible: boolean;
    message: Message | null;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const DeleteMessageModal: React.FC<DeleteMessageModalProps> = ({
    visible,
    message,
    loading,
    onConfirm,
    onCancel,
}) => {
    if (!message) return null;

    return (
        <Modal
            title={
                <span>
                    <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
                    Delete Message
                </span>
            }
            open={visible}
            onOk={onConfirm}
            onCancel={onCancel}
            okText="Delete"
            okButtonProps={{ danger: true, loading }}
            cancelButtonProps={{ disabled: loading }}
        >
            <div style={{ marginTop: 16 }}>
                <Text>Are you sure you want to delete this message?</Text>
                <div
                    style={{
                        marginTop: 12,
                        padding: 12,
                        background: '#f5f5f5',
                        borderRadius: 4,
                        borderLeft: '3px solid #d9d9d9',
                    }}
                >
                    <Text type="secondary" style={{ fontSize: 14 }}>
                        {message.content}
                    </Text>
                </div>
                <div style={{ marginTop: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        This message will be deleted for everyone in the conversation.
                    </Text>
                </div>
            </div>
        </Modal>
    );
};
