import React from 'react';
import { Input, Button, Space, Typography } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { FileUploadButton } from './FileUploadButton';
import { FilePreview } from './FilePreview';
import { UploadProgress } from './UploadProgress';
import { useFileUpload } from '../hooks/useFileUpload';
import type { FileMetadata } from '../api/files';

const { TextArea } = Input;
const { Text } = Typography;

interface MessageInputProps {
    onSend: (content: string, fileIds?: string[]) => void;
    disabled?: boolean;
    loading?: boolean;
    maxLength?: number;
    conversationId?: string; // Add conversationId for typing indicators and file uploads
    initialValue?: string; // For edit mode
    placeholder?: string; // Custom placeholder
    onCancel?: () => void; // Cancel edit mode
    enableFileUpload?: boolean; // Enable/disable file upload
}

export const MessageInputWithFiles: React.FC<MessageInputProps> = ({
    onSend,
    disabled = false,
    loading = false,
    maxLength = 2000,
    conversationId,
    initialValue,
    placeholder = 'Type a message...',
    onCancel,
    enableFileUpload = true,
}) => {
    const [content, setContent] = useState(initialValue || '');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploadedFileMetadata, setUploadedFileMetadata] = useState<FileMetadata[]>([]);

    const textAreaRef = useRef<any>(null);
    const typingTimeoutRef = useRef<number | null>(null);
    const isTypingRef = useRef(false);
    const { emitTypingStart, emitTypingStop } = useWebSocket();
    const {
        uploadingFiles,
        uploadFile,
        removeUploadingFile,
        isUploading,
    } = useFileUpload();

    // Update content when initialValue changes (for edit mode)
    useEffect(() => {
        if (initialValue !== undefined) {
            setContent(initialValue);
            // Focus textarea when entering edit mode
            setTimeout(() => {
                textAreaRef.current?.focus();
            }, 100);
        }
    }, [initialValue]);

    const handleSend = async () => {
        const trimmed = content.trim();

        // Can send if there's text or uploaded files
        if ((!trimmed && uploadedFileMetadata.length === 0) || loading || isUploading) return;

        // Stop typing indicator
        if (conversationId && isTypingRef.current) {
            emitTypingStop(conversationId);
            isTypingRef.current = false;
        }

        // Clear typing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        // Send message with file IDs
        const fileIds = uploadedFileMetadata.map((f) => f.id);
        onSend(trimmed || '', fileIds.length > 0 ? fileIds : undefined);

        // Clear state
        setContent('');
        setSelectedFiles([]);
        setUploadedFileMetadata([]);

        // Reset textarea height
        if (textAreaRef.current) {
            textAreaRef.current.resizableTextArea.textArea.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Handle typing detection
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setContent(newContent);

        if (!conversationId) return;

        // Start typing indicator if not already typing
        if (!isTypingRef.current && newContent.trim()) {
            emitTypingStart(conversationId);
            isTypingRef.current = true;
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing after 3 seconds of inactivity
        if (newContent.trim()) {
            typingTimeoutRef.current = window.setTimeout(() => {
                if (conversationId && isTypingRef.current) {
                    emitTypingStop(conversationId);
                    isTypingRef.current = false;
                }
            }, 3000);
        } else if (isTypingRef.current) {
            // If content is empty, stop typing immediately
            emitTypingStop(conversationId);
            isTypingRef.current = false;
        }
    };

    // Handle file selection
    const handleFileSelect = async (files: File[]) => {
        setSelectedFiles((prev) => [...prev, ...files]);

        // Upload files immediately
        if (conversationId) {
            for (const file of files) {
                const metadata = await uploadFile(file, { conversationId });
                if (metadata) {
                    setUploadedFileMetadata((prev) => [...prev, metadata]);
                }
            }
        }
    };

    // Remove selected file before upload
    const handleRemoveSelectedFile = (file: File) => {
        setSelectedFiles((prev) => prev.filter((f) => f !== file));
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            if (conversationId && isTypingRef.current) {
                emitTypingStop(conversationId);
            }
        };
    }, [conversationId, emitTypingStop]);

    const remainingChars = maxLength - content.length;
    const isOverLimit = remainingChars < 0;
    const showCounter = content.length > maxLength * 0.8 || isOverLimit;

    // Show selected files that haven't been uploaded yet
    const pendingFiles = selectedFiles.filter(
        (file) => !uploadingFiles.some((uf) => uf.file === file)
    );

    return (
        <div className="p-4 bg-white border-t border-gray-200">
            <Space direction="vertical" style={{ width: '100%' }} size="small">
                {/* Show pending files */}
                {pendingFiles.map((file, index) => (
                    <FilePreview
                        key={index}
                        file={file}
                        onRemove={() => handleRemoveSelectedFile(file)}
                    />
                ))}

                {/* Show uploading files */}
                {uploadingFiles.map((uploadingFile, index) => (
                    <UploadProgress
                        key={index}
                        uploadingFile={uploadingFile}
                        onRemove={() => removeUploadingFile(uploadingFile.file)}
                    />
                ))}

                <TextArea
                    ref={textAreaRef}
                    value={content}
                    onChange={handleContentChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder + ' (Enter to send, Shift+Enter for new line)'}
                    autoSize={{ minRows: 1, maxRows: 6 }}
                    disabled={disabled || loading}
                    maxLength={maxLength}
                    className="resize-none"
                />
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        {enableFileUpload && conversationId && (
                            <FileUploadButton
                                onFileSelect={handleFileSelect}
                                disabled={disabled || loading || isUploading}
                            />
                        )}
                        {showCounter && (
                            <Text
                                type={isOverLimit ? 'danger' : 'secondary'}
                                style={{ fontSize: '12px' }}
                            >
                                {remainingChars} characters remaining
                            </Text>
                        )}
                    </div>
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleSend}
                        disabled={
                            disabled ||
                            loading ||
                            isUploading ||
                            (!content.trim() && uploadedFileMetadata.length === 0) ||
                            isOverLimit
                        }
                        loading={loading || isUploading}
                    >
                        Send
                    </Button>
                </div>
            </Space>
        </div>
    );
};
