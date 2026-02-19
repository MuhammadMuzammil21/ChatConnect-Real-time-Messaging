import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Spin, Empty, Typography, Tooltip, Button } from 'antd';
import {
    PictureOutlined,
    VideoCameraOutlined,
    FileOutlined,
    DownloadOutlined,
    EyeOutlined,
    ShareAltOutlined,
} from '@ant-design/icons';
import { filesApi } from '../api/files';
import type { FileMetadata } from '../api/files';
import { ImageLightbox } from './ImageLightbox';
import { ShareFileModal } from './ShareFileModal';

const { Text } = Typography;

type FilterType = 'all' | 'images' | 'videos' | 'documents';

const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

interface MediaGalleryProps {
    conversationId: string;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ conversationId }) => {
    const [files, setFiles] = useState<FileMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [shareFile, setShareFile] = useState<FileMetadata | null>(null);

    const loadFiles = useCallback(async () => {
        setLoading(true);
        try {
            const data = await filesApi.getConversationFiles(conversationId);
            setFiles(data);
        } catch {
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, [conversationId]);

    useEffect(() => { loadFiles(); }, [loadFiles]);

    const filtered = files.filter(f => {
        if (filter === 'images') return f.mimeType.startsWith('image/');
        if (filter === 'videos') return f.mimeType.startsWith('video/');
        if (filter === 'documents') return !f.mimeType.startsWith('image/') && !f.mimeType.startsWith('video/');
        return true;
    });

    // Only images/videos are lightbox-viewable
    const viewableFiles = filtered.filter(f => f.mimeType.startsWith('image/') || f.mimeType.startsWith('video/'));

    const openLightbox = (file: FileMetadata) => {
        const idx = viewableFiles.findIndex(f => f.id === file.id);
        if (idx >= 0) setLightboxIndex(idx);
    };

    const tabs = [
        { key: 'all', label: `All (${files.length})` },
        { key: 'images', label: <><PictureOutlined /> Images ({files.filter(f => f.mimeType.startsWith('image/')).length})</> },
        { key: 'videos', label: <><VideoCameraOutlined /> Videos ({files.filter(f => f.mimeType.startsWith('video/')).length})</> },
        { key: 'documents', label: <><FileOutlined /> Docs ({files.filter(f => !f.mimeType.startsWith('image/') && !f.mimeType.startsWith('video/')).length})</> },
    ];

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Tabs
                size="small"
                activeKey={filter}
                onChange={k => setFilter(k as FilterType)}
                items={tabs.map(t => ({ ...t, children: null }))}
                style={{ padding: '0 12px' }}
            />

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                        <Spin size="large" />
                    </div>
                ) : filtered.length === 0 ? (
                    <Empty
                        description={`No ${filter === 'all' ? 'files' : filter} yet`}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        style={{ marginTop: 32 }}
                    />
                ) : (
                    <>
                        {/* Image/video grid */}
                        {(filter === 'all' || filter === 'images' || filter === 'videos') && (
                            <MediaGrid
                                files={filtered.filter(f => f.mimeType.startsWith('image/') || f.mimeType.startsWith('video/'))}
                                onOpen={openLightbox}
                                onShare={setShareFile}
                            />
                        )}

                        {/* Document list */}
                        {(filter === 'all' || filter === 'documents') && (
                            <DocumentList
                                files={filtered.filter(f => !f.mimeType.startsWith('image/') && !f.mimeType.startsWith('video/'))}
                                onShare={setShareFile}
                            />
                        )}
                    </>
                )}
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <ImageLightbox
                    files={viewableFiles}
                    startIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}

            {/* Share modal */}
            {shareFile && (
                <ShareFileModal
                    file={shareFile}
                    open
                    onClose={() => setShareFile(null)}
                />
            )}
        </div>
    );
};

/* ── Media Grid (images + videos) ─────────────────────────────── */
const MediaGrid: React.FC<{
    files: FileMetadata[];
    onOpen: (f: FileMetadata) => void;
    onShare: (f: FileMetadata) => void;
}> = ({ files, onOpen, onShare }) => {
    if (files.length === 0) return null;
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
            gap: 6, marginBottom: 12,
        }}>
            {files.map(f => (
                <div
                    key={f.id}
                    style={{ position: 'relative', paddingBottom: '100%', borderRadius: 6, overflow: 'hidden', background: '#f0f0f0', cursor: 'pointer' }}
                    onClick={() => onOpen(f)}
                >
                    {f.mimeType.startsWith('image/') ? (
                        <img
                            src={f.fileUrl}
                            alt={f.filename}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', color: '#fff' }}>
                            <VideoCameraOutlined style={{ fontSize: 24, marginBottom: 4 }} />
                            <span style={{ fontSize: 10, textAlign: 'center', padding: '0 4px', wordBreak: 'break-word' }}>{f.filename}</span>
                        </div>
                    )}
                    {/* Hover overlay */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(0,0,0,0.38)',
                        opacity: 0, transition: 'opacity 0.15s',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                        className="media-overlay"
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                    >
                        <Button
                            size="small" type="text"
                            icon={<EyeOutlined style={{ color: '#fff' }} />}
                            onClick={e => { e.stopPropagation(); onOpen(f); }}
                        />
                        <Button
                            size="small" type="text"
                            icon={<ShareAltOutlined style={{ color: '#fff' }} />}
                            onClick={e => { e.stopPropagation(); onShare(f); }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

/* ── Document List ─────────────────────────────────────────────── */
const DocumentList: React.FC<{
    files: FileMetadata[];
    onShare: (f: FileMetadata) => void;
}> = ({ files, onShare }) => {
    if (files.length === 0) return null;
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {files.map(f => (
                <div key={f.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 6,
                    background: '#fafafa', border: '1px solid #f0f0f0',
                }}>
                    <FileOutlined style={{ fontSize: 20, color: '#8c8c8c', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <Text ellipsis style={{ display: 'block', fontSize: 13 }}>{f.filename}</Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>{formatSize(f.fileSize)}</Text>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <Tooltip title="Download">
                            <Button size="small" type="text" icon={<DownloadOutlined />}
                                onClick={() => filesApi.downloadFile(f.id, f.filename)} />
                        </Tooltip>
                        <Tooltip title="Share">
                            <Button size="small" type="text" icon={<ShareAltOutlined />}
                                onClick={() => onShare(f)} />
                        </Tooltip>
                    </div>
                </div>
            ))}
        </div>
    );
};
