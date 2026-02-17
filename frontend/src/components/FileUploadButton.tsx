import React, { useRef } from 'react';
import { Button } from 'antd';
import { PaperClipOutlined, FileImageOutlined } from '@ant-design/icons';

interface FileUploadButtonProps {
    onFileSelect: (files: File[]) => void;
    multiple?: boolean;
    accept?: string;
    disabled?: boolean;
    maxCount?: number;
    icon?: 'paperclip' | 'image';
    text?: string;
    size?: 'small' | 'middle' | 'large';
}

export const FileUploadButton: React.FC<FileUploadButtonProps> = ({
    onFileSelect,
    multiple = true,
    accept = 'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt',
    disabled = false,
    icon = 'paperclip',
    text,
    size = 'middle',
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            onFileSelect(files);
            // Reset input so same file can be selected again
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const iconComponent = icon === 'image' ? <FileImageOutlined /> : <PaperClipOutlined />;

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept={accept}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                disabled={disabled}
            />
            <Button
                icon={iconComponent}
                onClick={handleClick}
                disabled={disabled}
                size={size}
                type="text"
            >
                {text}
            </Button>
        </>
    );
};
