import React from 'react';
import { Card, Typography, Space, Button, Tag } from 'antd';
import {
    FileOutlined,
    FileImageOutlined,
    FilePdfOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FileTextOutlined,
    VideoCameraOutlined,
    CloseOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface FilePreviewProps {
    file: File;
    onRemove?: () => void;
    showSize?: boolean;
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImageOutlined style={{ fontSize: 24 }} />;
    if (mimeType.startsWith('video/')) return <VideoCameraOutlined style={{ fontSize: 24 }} />;
    if (mimeType === 'application/pdf') return <FilePdfOutlined style={{ fontSize: 24 }} />;
    if (
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
        return <FileWordOutlined style={{ fontSize: 24 }} />;
    if (
        mimeType === 'application/vnd.ms-excel' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
        return <FileExcelOutlined style={{ fontSize: 24 }} />;
    if (mimeType === 'text/plain') return <FileTextOutlined style={{ fontSize: 24 }} />;
    return <FileOutlined style={{ fontSize: 24 }} />;
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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

export const FilePreview: React.FC<FilePreviewProps> = ({
    file,
    onRemove,
    showSize = true,
}) => {
    const [imagePreview, setImagePreview] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [file]);

    return (
        <Card
            size="small"
            style={{ marginBottom: 8 }}
            bodyStyle={{ padding: 12 }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {imagePreview ? (
                    <img
                        src={imagePreview}
                        alt={file.name}
                        style={{
                            width: 48,
                            height: 48,
                            objectFit: 'cover',
                            borderRadius: 4,
                        }}
                    />
                ) : (
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
                        {getFileIcon(file.type)}
                    </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <Text
                        strong
                        ellipsis
                        style={{ display: 'block', marginBottom: 4 }}
                    >
                        {file.name}
                    </Text>
                    <Space size="small">
                        <Tag color="blue">{getFileTypeLabel(file.type)}</Tag>
                        {showSize && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {formatFileSize(file.size)}
                            </Text>
                        )}
                    </Space>
                </div>
                {onRemove && (
                    <Button
                        type="text"
                        danger
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={onRemove}
                    />
                )}
            </div>
        </Card>
    );
};
