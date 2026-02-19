import { Input, Button, Space, Typography } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useState, useRef, useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';

const { TextArea } = Input;
const { Text } = Typography;

interface MessageInputProps {
    onSend: (content: string) => void;
    disabled?: boolean;
    loading?: boolean;
    maxLength?: number;
    conversationId?: string; // Add conversationId for typing indicators
    initialValue?: string; // For edit mode
    placeholder?: string; // Custom placeholder
    onCancel?: () => void; // Cancel edit mode
}

export const MessageInput: React.FC<MessageInputProps> = ({
    onSend,
    disabled = false,
    loading = false,
    maxLength = 2000,
    conversationId,
    initialValue,
    placeholder = 'Type a message...',
    onCancel,
}) => {
    const [content, setContent] = useState(initialValue || '');
    const textAreaRef = useRef<any>(null);
    const typingTimeoutRef = useRef<number | null>(null);
    const isTypingRef = useRef(false);
    const { emitTypingStart, emitTypingStop } = useWebSocket();

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

    const handleSend = () => {
        const trimmed = content.trim();
        if (!trimmed || loading) return;

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

        onSend(trimmed);
        setContent('');

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

    return (
        <div className="p-4 bg-white border-t border-gray-200">
            <Space direction="vertical" style={{ width: '100%' }} size="small">
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
                    <div>
                        {showCounter && (
                            <Text
                                type={isOverLimit ? 'danger' : 'secondary'}
                                style={{ fontSize: '12px' }}
                            >
                                {remainingChars} characters remaining
                            </Text>
                        )}
                    </div>
                    <Space>
                        {onCancel && initialValue !== undefined && (
                            <Button onClick={onCancel} disabled={disabled || loading}>
                                Cancel
                            </Button>
                        )}
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={handleSend}
                            disabled={disabled || loading || !content.trim() || isOverLimit}
                            loading={loading}
                        >
                            Send
                        </Button>
                    </Space>
                </div>
            </Space>
        </div>
    );
};
