import React from 'react';
import { Skeleton } from 'antd';
import './MessageListSkeleton.css';

export const MessageListSkeleton: React.FC = () => {
    return (
        <div className="message-list-skeleton">
            {[1, 2, 3, 4, 5, 6, 7].map((index) => (
                <div
                    key={index}
                    className={`skeleton-message ${index % 2 === 0 ? 'skeleton-message-right' : 'skeleton-message-left'}`}
                >
                    <div className="skeleton-message-content">
                        <Skeleton.Avatar active size="default" />
                        <div className="skeleton-message-bubble">
                            <Skeleton
                                active
                                paragraph={{ rows: index % 3 === 0 ? 2 : 1, width: ['100%', '60%'] }}
                                title={false}
                            />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};
