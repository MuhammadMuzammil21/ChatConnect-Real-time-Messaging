import React, { useState } from 'react';
import { Avatar, Typography, Space, Button } from 'antd';
import { UserOutlined, CheckOutlined, MoreOutlined } from '@ant-design/icons';
import type { Message } from '../types/conversation';
import { MessageContextMenu } from './MessageContextMenu';
import { DeleteMessageModal } from './DeleteMessageModal';
import { FileAttachment } from './FileAttachment';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';
import './MessageContextMenu.css';

dayjs.extend(relativeTime);
dayjs.extend(calendar);

const { Text } = Typography;

interface MessageItemProps {
    message: Message;
    isOwnMessage: boolean;
    showSender?: boolean;
    currentUserId: string;
    onEdit?: (message: Message) => void;
    onDelete?: (messageId: string) => void;
    deleting?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({
    message,
    isOwnMessage,
    showSender = true,
    currentUserId,
    onEdit,
    onDelete,
    deleting = false,
}) => {
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);

    const handleEdit = (msg: Message) => {
        if (onEdit) {
            onEdit(msg);
        }
    };

    const handleDeleteClick = () => {
        setDeleteModalVisible(true);
    };

    const handleDeleteConfirm = () => {
        if (onDelete) {
            onDelete(message.id);
        }
        setDeleteModalVisible(false);
    };
    const formatTimestamp = (date: string) => {
        const messageDate = dayjs(date);
        const now = dayjs();
        const diffHours = now.diff(messageDate, 'hour');

        if (diffHours < 24) {
            return messageDate.format('h:mm A');
        } else if (diffHours < 168) {
            // Less than a week
            return messageDate.calendar(null, {
                sameDay: 'h:mm A',
                lastDay: '[Yesterday] h:mm A',
                lastWeek: 'ddd h:mm A',
                sameElse: 'MMM D, h:mm A',
            });
        } else {
            return messageDate.format('MMM D, YYYY h:mm A');
        }
    };

    // Show deleted message placeholder
    if (message.deletedAt) {
        return (
            <div
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
            >
                <div className="px-4 py-2 rounded-lg bg-neutral-800/50 text-neutral-500 italic">
                    <Text type="secondary">This message was deleted</Text>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
        >
            <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} max-w-[70%] gap-2`}>
                {/* Avatar */}
                {!isOwnMessage && (
                    <Avatar
                        src={message.sender.avatarUrl}
                        icon={<UserOutlined />}
                        size="small"
                        className="flex-shrink-0 mt-1"
                        style={{ background: '#262626', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                )}

                {/* Message Content */}
                <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} message-item`}>
                    {/* Sender Name */}
                    {showSender && !isOwnMessage && (
                        <Text
                            strong
                            style={{
                                fontSize: '12px',
                                marginBottom: '4px',
                                color: '#818cf8',
                            }}
                        >
                            {message.sender.displayName}
                        </Text>
                    )}

                    {/* Message Bubble with Context Menu */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                            className={`px-4 py-2 rounded-lg ${isOwnMessage
                                ? 'text-white'
                                : 'text-neutral-200'
                                }`}
                            style={{
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-wrap',
                                background: isOwnMessage ? '#6366f1' : '#1a1a1a',
                                border: isOwnMessage ? 'none' : '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            {message.content && (
                                <Text
                                    style={{
                                        color: isOwnMessage ? 'white' : 'inherit',
                                    }}
                                >
                                    {message.content}
                                </Text>
                            )}

                            {/* File Attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                                <div style={{ marginTop: message.content ? 8 : 0 }}>
                                    {message.attachments.map((file) => (
                                        <FileAttachment
                                            key={file.id}
                                            file={file}
                                            compact
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Context Menu Trigger */}
                        <MessageContextMenu
                            message={message}
                            currentUserId={currentUserId}
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                        >
                            <Button
                                type="text"
                                size="small"
                                icon={<MoreOutlined />}
                                className="message-context-menu-trigger"
                                style={{ padding: '4px 8px' }}
                            />
                        </MessageContextMenu>
                    </div>

                    {/* Timestamp and Status */}
                    <Space size={4} className="mt-1">
                        <Text
                            type="secondary"
                            style={{
                                fontSize: '11px',
                            }}
                        >
                            {formatTimestamp(message.createdAt)}
                        </Text>
                        {isOwnMessage && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
                                {/* Double checkmark for read receipts */}
                                <CheckOutlined
                                    style={{
                                        fontSize: '11px',
                                        color: message.isRead ? '#52c41a' : '#d9d9d9',
                                    }}
                                />
                                <CheckOutlined
                                    style={{
                                        fontSize: '11px',
                                        color: message.isRead ? '#52c41a' : '#d9d9d9',
                                        marginLeft: '-6px',
                                    }}
                                />
                            </span>
                        )}
                        {message.isEdited && (
                            <Text
                                type="secondary"
                                style={{
                                    fontSize: '11px',
                                    fontStyle: 'italic',
                                }}
                            >
                                (edited)
                            </Text>
                        )}
                    </Space>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteMessageModal
                visible={deleteModalVisible}
                message={message}
                loading={deleting}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteModalVisible(false)}
            />
        </div>
    );
};
