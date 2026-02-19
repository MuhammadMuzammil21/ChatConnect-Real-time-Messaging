import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Select, Space, Typography, Tooltip, message, Spin, Empty, Tag } from 'antd';
import { CopyOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import { filesApi } from '../api/files';
import type { ShareLink, FileMetadata } from '../api/files';

const { Text } = Typography;

const EXPIRY_OPTIONS = [
    { label: '1 hour', value: 3600 },
    { label: '24 hours', value: 86400 },
    { label: '7 days', value: 604800 },
    { label: 'Never', value: undefined },
];

interface ShareFileModalProps {
    file: FileMetadata | { id: string; filename: string };
    open: boolean;
    onClose: () => void;
}

export const ShareFileModal: React.FC<ShareFileModalProps> = ({ file, open, onClose }) => {
    const [links, setLinks] = useState<ShareLink[]>([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [expiresIn, setExpiresIn] = useState<number | undefined>(86400);

    useEffect(() => {
        if (open) fetchLinks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const fetchLinks = async () => {
        setLoading(true);
        try {
            const data = await filesApi.getShareLinks(file.id);
            setLinks(data);
        } catch {
            setLinks([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        setCreating(true);
        try {
            const link = await filesApi.createShareLink(file.id, expiresIn);
            setLinks(prev => [link, ...prev]);
            message.success('Share link created!');
        } catch {
            message.error('Failed to create share link');
        } finally {
            setCreating(false);
        }
    };

    const handleRevoke = async (linkId: string) => {
        try {
            await filesApi.revokeShareLink(linkId);
            setLinks(prev => prev.filter(l => l.id !== linkId));
            message.success('Link revoked');
        } catch {
            message.error('Failed to revoke link');
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url).then(() => message.success('Copied to clipboard!'));
    };

    const formatExpiry = (expiresAt: string | null) => {
        if (!expiresAt) return <Tag color="green">Never expires</Tag>;
        const d = new Date(expiresAt);
        if (d < new Date()) return <Tag color="red">Expired</Tag>;
        return <Tag color="blue">{d.toLocaleString()}</Tag>;
    };

    return (
        <Modal
            title={
                <Space>
                    <LinkOutlined />
                    Share "{file.filename}"
                </Space>
            }
            open={open}
            onCancel={onClose}
            footer={null}
            width={520}
        >
            {/* Create new link */}
            <div style={{ marginBottom: 20 }}>
                <Text strong>Create a new share link</Text>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Select
                        value={expiresIn}
                        onChange={setExpiresIn}
                        style={{ width: 140 }}
                        options={EXPIRY_OPTIONS}
                    />
                    <Button
                        type="primary"
                        icon={<LinkOutlined />}
                        loading={creating}
                        onClick={handleCreate}
                    >
                        Generate Link
                    </Button>
                </div>
            </div>

            {/* Existing links */}
            <Text strong>Existing links</Text>
            {loading ? (
                <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
            ) : links.length === 0 ? (
                <Empty description="No share links yet" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '12px 0' }} />
            ) : (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {links.map(link => (
                        <div key={link.id} style={{
                            border: '1px solid #f0f0f0', borderRadius: 6, padding: '10px 12px',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <Input
                                    value={link.shareUrl}
                                    readOnly
                                    size="small"
                                    style={{ flex: 1, fontFamily: 'monospace', fontSize: 12 }}
                                />
                                <Tooltip title="Copy link">
                                    <Button
                                        size="small"
                                        icon={<CopyOutlined />}
                                        onClick={() => copyToClipboard(link.shareUrl)}
                                    />
                                </Tooltip>
                                <Tooltip title="Revoke">
                                    <Button
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleRevoke(link.id)}
                                    />
                                </Tooltip>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Expires: </Text>
                                {formatExpiry(link.expiresAt)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Modal>
    );
};
