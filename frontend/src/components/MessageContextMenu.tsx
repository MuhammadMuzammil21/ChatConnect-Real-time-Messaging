import React from 'react';
import { Dropdown, message as antMessage } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    CopyOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
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

    const items: MenuProps['items'] = [
        ...(canEdit
            ? [
                {
                    key: 'edit',
                    icon: <EditOutlined />,
                    label: 'Edit',
                    onClick: () => onEdit(message),
                } as const,
            ]
            : []),
        ...(canDelete
            ? [
                {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    label: 'Delete',
                    danger: true,
                    onClick: () => onDelete(message),
                } as const,
            ]
            : []),
        {
            key: 'copy',
            icon: <CopyOutlined />,
            label: 'Copy',
            onClick: handleCopy,
        },
    ];

    return (
        <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            {children}
        </Dropdown>
    );
};
