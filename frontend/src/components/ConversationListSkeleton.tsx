import React from 'react';
import { Skeleton, List } from 'antd';
import './ConversationListSkeleton.css';

export const ConversationListSkeleton: React.FC = () => {
    return (
        <div className="conversation-list-skeleton">
            <List
                dataSource={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                renderItem={(item) => (
                    <List.Item className="skeleton-conversation-item">
                        <Skeleton.Avatar active size="large" />
                        <div className="skeleton-conversation-content">
                            <Skeleton
                                active
                                paragraph={{ rows: 1, width: '100%' }}
                                title={{ width: '60%' }}
                            />
                        </div>
                    </List.Item>
                )}
            />
        </div>
    );
};
