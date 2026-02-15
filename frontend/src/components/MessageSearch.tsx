import React, { useState } from 'react';
import { Input, Modal, List, Empty, Spin, DatePicker, Select, Space, Typography, Tag } from 'antd';
import { SearchOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import type { Message } from '../types/conversation';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface MessageSearchProps {
    visible: boolean;
    onClose: () => void;
    onSearch: (query: string, filters?: any) => Promise<Message[]>;
    participants?: Array<{ id: string; displayName: string }>;
}

export const MessageSearch: React.FC<MessageSearchProps> = ({
    visible,
    onClose,
    onSearch,
    participants = [],
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
    const [selectedSender, setSelectedSender] = useState<string | undefined>(undefined);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        try {
            const filters: any = {};

            if (dateRange && dateRange[0] && dateRange[1]) {
                filters.startDate = dateRange[0].toISOString();
                filters.endDate = dateRange[1].toISOString();
            }

            if (selectedSender) {
                filters.senderId = selectedSender;
            }

            const searchResults = await onSearch(query, filters);
            setResults(searchResults);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setDateRange(null);
        setSelectedSender(undefined);
    };

    const highlightText = (text: string, searchQuery: string) => {
        if (!searchQuery.trim()) return text;

        const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
        return parts.map((part, index) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? (
                <mark key={index} style={{ backgroundColor: '#ffd666', padding: '0 2px' }}>
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    return (
        <Modal
            title={
                <Space>
                    <SearchOutlined />
                    <span>Search Messages</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={700}
            bodyStyle={{ padding: '16px' }}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* Search Input */}
                <Input
                    placeholder="Search messages..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onPressEnter={handleSearch}
                    prefix={<SearchOutlined />}
                    suffix={
                        query && (
                            <CloseOutlined
                                onClick={handleClear}
                                style={{ cursor: 'pointer', color: '#999' }}
                            />
                        )
                    }
                    size="large"
                    autoFocus
                />

                {/* Filters */}
                <Space wrap>
                    <RangePicker
                        value={dateRange}
                        onChange={(dates) => setDateRange(dates as any)}
                        placeholder={['Start Date', 'End Date']}
                        style={{ width: 280 }}
                    />

                    {participants.length > 0 && (
                        <Select
                            placeholder="Filter by sender"
                            value={selectedSender}
                            onChange={setSelectedSender}
                            allowClear
                            style={{ width: 200 }}
                        >
                            {participants.map((p) => (
                                <Select.Option key={p.id} value={p.id}>
                                    <Space>
                                        <UserOutlined />
                                        {p.displayName}
                                    </Space>
                                </Select.Option>
                            ))}
                        </Select>
                    )}
                </Space>

                {/* Results */}
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <Spin size="large" />
                        </div>
                    ) : results.length > 0 ? (
                        <List
                            dataSource={results}
                            renderItem={(message) => (
                                <List.Item
                                    style={{
                                        padding: '12px',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                        background: '#fafafa',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => {
                                        // Could scroll to message in conversation
                                        console.log('Navigate to message:', message.id);
                                    }}
                                >
                                    <List.Item.Meta
                                        title={
                                            <Space>
                                                <Text strong>{message.sender.displayName}</Text>
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {dayjs(message.createdAt).format('MMM D, YYYY h:mm A')}
                                                </Text>
                                                {message.isEdited && (
                                                    <Tag color="blue" style={{ fontSize: '11px' }}>
                                                        Edited
                                                    </Tag>
                                                )}
                                            </Space>
                                        }
                                        description={
                                            <Text style={{ fontSize: '14px' }}>
                                                {highlightText(message.content, query)}
                                            </Text>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    ) : query ? (
                        <Empty
                            description="No messages found"
                            style={{ padding: '40px 0' }}
                        />
                    ) : (
                        <Empty
                            description="Enter a search query to find messages"
                            style={{ padding: '40px 0' }}
                        />
                    )}
                </div>

                {/* Results Count */}
                {results.length > 0 && (
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Found {results.length} message{results.length !== 1 ? 's' : ''}
                    </Text>
                )}
            </Space>
        </Modal>
    );
};
