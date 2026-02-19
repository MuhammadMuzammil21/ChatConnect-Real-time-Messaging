import React from 'react';
import { Drawer, Typography } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';
import { MediaGallery } from './MediaGallery';

const { Title } = Typography;

interface ConversationFilesPanelProps {
    conversationId: string;
    open: boolean;
    onClose: () => void;
}

export const ConversationFilesPanel: React.FC<ConversationFilesPanelProps> = ({
    conversationId,
    open,
    onClose,
}) => {
    return (
        <Drawer
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <PaperClipOutlined />
                    <Title level={5} style={{ margin: 0 }}>Files & Media</Title>
                </div>
            }
            placement="right"
            width={320}
            open={open}
            onClose={onClose}
            styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column' } }}
            mask={false}
        >
            {open && <MediaGallery conversationId={conversationId} />}
        </Drawer>
    );
};
