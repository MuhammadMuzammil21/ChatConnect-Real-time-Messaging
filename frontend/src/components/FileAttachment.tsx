import React from 'react';
import { Card, Typography, Space, Button, Tag, Tooltip } from 'antd';
import {
    FileOutlined,
    FileImageOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FileTextOutlined,
    VideoCameraOutlined,
    DownloadOutlined,
    EyeOutlined,
} from '@ant-design/icons';
import type { FileMetadata } from '../api/files';
import { filesApi } from '../api/files';

const { Text } = Typography;

interface FileAttachmentProps {
    file: {
        id: string;
        filename: string;
        fileUrl: string;
        mimeType: string;
        fileSize: number;
    };
    compact?: boolean;
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/'))
        return <FileImageOutlined style={{ fontSize: 20, color: '#1890ff' }} />;
    if (mimeType.startsWith('video/'))
        return <VideoCameraOutlined style={{ fontSize: 20, color: '#722ed1' }} />;
    if (mimeType === 'application/pdf')
        return <FilePdfOutlined style={{ fontSize: 20, color: '#f5222d' }} />;
    if (
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
        return <FileWordOutlined style={{ fontSize: 20, color: '#2f54eb' }} />;
    if (
        mimeType === 'application/vnd.ms-excel' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
        return <FileExcelOutlined style={{ fontSize: 20, color: '#52c41a' }} />;
    if (mimeType === 'text/plain')
        return <FileTextOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />;
    return <FileOutlined style={{ fontSize: 20, color: '#8c8c8c' }} />;
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

const getFileTypeLabel = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType.startsWith('video/')) return 'Video';
    if (mimeType === 'application/pdf') return 'PDF';
    if (
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
        return 'Word';
    if (
        mimeType === 'application/vnd.ms-excel' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
        return 'Excel';
    if (mimeType === 'text/plain') return 'Text';
    return 'File';
};

const getFileColor = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'blue';
    if (mimeType.startsWith('video/')) return 'purple';
    if (mimeType === 'application/pdf') return 'red';
    if (
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
        return 'geekblue';
    if (
        mimeType === 'application/vnd.ms-excel' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
        return 'green';
    return 'default';
};

export const FileAttachment: React.FC<FileAttachmentProps> = ({ file, compact = false }) => {
    const handleDownload = async () => {
        try {
            await filesApi.downloadFile(file.id, file.filename);
        } catch (error) {
            console.error('Failed to download file:', error);
        }
    };

    const handleView = () => {
        // Open file in new tab
        window.open(file.fileUrl, '_blank');
    };

    const isImage = file.mimeType.startsWith('image/');
    const isVideo = file.mimeType.startsWith('video/');

    if (compact) {
        return (
            <Card
                size="small"
                style={{
                    marginBottom: 4,
                    cursor: 'pointer',
                    borderColor: '#d9d9d9',
                }}
                bodyStyle={{ padding: 8 }}
                onClick={isImage || isVideo ? handleView : handleDownload}
                hoverable
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {getFileIcon(file.mimeType)}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Text
                            ellipsis
                            style={{ display: 'block', fontSize: 13, marginBottom: 2 }}
                        >
                            {file.filename}
                        </Text>
                        <Space size={4}>
                            <Tag color={getFileColor(file.mimeType)} style={{ fontSize: 11, margin: 0 }}>
                                {getFileTypeLabel(file.mimeType)}
                            </Tag>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {formatFileSize(file.fileSize)}
                            </Text>
                        </Space>
                    </div>
                    <Tooltip title={isImage || isVideo ? 'View' : 'Download'}>
                        <Button
                            type="text"
                            size="small"
                            icon={isImage || isVideo ? <EyeOutlined /> : <DownloadOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                isImage || isVideo ? handleView() : handleDownload();
                            }}
                        />
                    </Tooltip>
                </div>
            </Card>
        );
    }

    // Full size display with image/video preview
    return (
        <Card
            size="small"
            style={{
                marginBottom: 8,
                maxWidth: 400,
            }}
            bodyStyle={{ padding: 12 }}
        >
            {isImage && (
                <img
                    src={file.fileUrl}
                    alt={file.filename}
                    style={{
                        width: '100%',
                        maxHeight: 200,
                        objectFit: 'cover',
                        borderRadius: 4,
                        marginBottom: 8,
                        cursor: 'pointer',
                    }}
                    onClick={handleView}
                />
            )}
            {isVideo && (
                <video
                    src={file.fileUrl}
                    controls
                    style={{
                        width: '100%',
                        maxHeight: 200,
                        borderRadius: 4,
                        marginBottom: 8,
                    }}
                />
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {!isImage && !isVideo && (
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f5f5f5',
                            borderRadius: 4,
                        }}
                    >
                        {getFileIcon(file.mimeType)}
                    </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong ellipsis style={{ display: 'block', marginBottom: 4 }}>
                        {file.filename}
                    </Text>
                    <Space size="small">
                        <Tag color={getFileColor(file.mimeType)}>
                            {getFileTypeLabel(file.mimeType)}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {formatFileSize(file.fileSize)}
                        </Text>
                    </Space>
                </div>
                <Space>
                    {(isImage || isVideo) && (
                        <Tooltip title="View">
                            <Button
                                type="text"
                                icon={<EyeOutlined />}
                                onClick={handleView}
                            />
                        </Tooltip>
                    )}
                    <Tooltip title="Download">
                        <Button
                            type="text"
                            icon={<DownloadOutlined />}
                            onClick={handleDownload}
                        />
                    </Tooltip>
                </Space>
            </div>
        </Card>
    );
};
