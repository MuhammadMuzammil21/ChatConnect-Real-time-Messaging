import React from 'react';
import { Dropdown, Menu, message as antMessage } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    CopyOutlined,
    MoreOutlined,
} from '@ant-design/icons';
import type { Message } from '../types/message';
import './MessageContextMenu.css';

interface MessageContextMenuProps {
    message: Message;
    currentUserId: string;
    onEdit: (message: Message) => void;
    onDelete: (message: Message) => void;
    children: React.ReactNode;
}

const MESSAGE_EDIT_TIME_LIMIT_MS = 15 * 60 * 1000; // 15 minutes
const MESSAGE_DELETE_TIME_LIMIT_MS = 60 * 60 * 1000; // 1 hour

export const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
    message,
    currentUserId,
    onEdit,
    onDelete,
    children,
}) => {
    const isOwnMessage = message.sender.id === currentUserId;
    const messageAge = Date.now() - new Date(message.createdAt).getTime();
    const canEdit = isOwnMessage && messageAge < MESSAGE_EDIT_TIME_LIMIT_MS && !message.deletedAt;
    const canDelete = isOwnMessage && !message.deletedAt;

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        antMessage.success('Message copied to clipboard');
    };

    const menu = (
        <Menu>
            {canEdit && (
                <Menu.Item
                    key="edit"
                    icon={<EditOutlined />}
                    onClick={() => onEdit(message)}
                >
                    Edit
                </Menu.Item>
            )}
            {canDelete && (
                <Menu.Item
                    key="delete"
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(message)}
                    danger
                >
                    Delete
                </Menu.Item>
            )}
            <Menu.Item
                key="copy"
                icon={<CopyOutlined />}
                onClick={handleCopy}
            >
                Copy
            </Menu.Item>
        </Menu>
    );

    return (
        <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
            {children}
        </Dropdown>
    );
};
