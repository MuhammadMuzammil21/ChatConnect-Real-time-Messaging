import React from 'react';
import { Typography } from 'antd';
import './TypingIndicator.css';

const { Text } = Typography;

interface TypingIndicatorProps {
    typingUsers: string[]; // Array of display names
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
    if (typingUsers.length === 0) {
        return null;
    }

    const getTypingText = (): string => {
        if (typingUsers.length === 1) {
            return `${typingUsers[0]} is typing`;
        } else if (typingUsers.length === 2) {
            return `${typingUsers[0]} and ${typingUsers[1]} are typing`;
        } else {
            return `${typingUsers[0]} and ${typingUsers.length - 1} others are typing`;
        }
    };

    return (
        <div className="typing-indicator-container">
            <Text type="secondary" className="typing-text">
                {getTypingText()}
                <span className="typing-dots">
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                    <span className="dot">.</span>
                </span>
            </Text>
        </div>
    );
};
