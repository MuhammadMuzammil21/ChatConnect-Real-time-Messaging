import React from 'react';
import { Progress, Card, Typography, Space, Tag, Button } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    LoadingOutlined,
    CloseOutlined,
} from '@ant-design/icons';
import type { UploadingFile } from '../hooks/useFileUpload';

const { Text } = Typography;

interface UploadProgressProps {
    uploadingFile: UploadingFile;
    onRemove?: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
    uploadingFile,
    onRemove,
}) => {
    const { file, progress, status, error } = uploadingFile;

    const getStatusIcon = () => {
        switch (status) {
            case 'uploading':
                return <LoadingOutlined spin style={{ color: '#1890ff' }} />;
            case 'success':
                return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
            case 'error':
                return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'uploading':
                return undefined; // Default blue
            case 'success':
                return 'success';
            case 'error':
                return 'exception';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'uploading':
                return 'Uploading...';
            case 'success':
                return 'Uploaded';
            case 'error':
                return 'Failed';
        }
    };

    return (
        <Card
            size="small"
            style={{ marginBottom: 8 }}
            bodyStyle={{ padding: 12 }}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {getStatusIcon()}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Text
                            strong
                            ellipsis
                            style={{ display: 'block', marginBottom: 4 }}
                        >
                            {file.name}
                        </Text>
                        <Space size="small">
                            <Tag color={status === 'error' ? 'red' : status === 'success' ? 'green' : 'blue'}>
                                {getStatusText()}
                            </Tag>
                            {status === 'uploading' && (
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {progress}%
                                </Text>
                            )}
                        </Space>
                    </div>
                    {onRemove && status !== 'uploading' && (
                        <Button
                            type="text"
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={onRemove}
                        />
                    )}
                </div>
                {status === 'uploading' && (
                    <Progress
                        percent={progress}
                        status={getStatusColor()}
                        showInfo={false}
                        strokeWidth={6}
                    />
                )}
                {status === 'error' && error && (
                    <Text type="danger" style={{ fontSize: 12 }}>
                        {error}
                    </Text>
                )}
            </Space>
        </Card>
    );
};
