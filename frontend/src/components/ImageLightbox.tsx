import React, { useEffect, useCallback } from 'react';
import { Button, Tooltip } from 'antd';
import {
    CloseOutlined,
    LeftOutlined,
    RightOutlined,
    DownloadOutlined,
    ZoomInOutlined,
    ZoomOutOutlined,
} from '@ant-design/icons';
import { filesApi } from '../api/files';
import type { FileMetadata } from '../api/files';

interface ImageLightboxProps {
    files: FileMetadata[];
    startIndex: number;
    onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ files, startIndex, onClose }) => {
    const [currentIndex, setCurrentIndex] = React.useState(startIndex);
    const [scale, setScale] = React.useState(1);

    const current = files[currentIndex];
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < files.length - 1;

    const prev = useCallback(() => {
        if (hasPrev) { setCurrentIndex(i => i - 1); setScale(1); }
    }, [hasPrev]);

    const next = useCallback(() => {
        if (hasNext) { setCurrentIndex(i => i + 1); setScale(1); }
    }, [hasNext]);

    const handleDownload = () => filesApi.downloadFile(current.id, current.filename);

    // Keyboard navigation
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, prev, next]);

    // Lock body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 2000,
                background: 'rgba(0,0,0,0.92)',
                display: 'flex', flexDirection: 'column',
            }}
            onClick={onClose}
        >
            {/* Top toolbar */}
            <div
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', color: '#fff', flexShrink: 0,
                }}
                onClick={e => e.stopPropagation()}
            >
                <span style={{ fontSize: 14, opacity: 0.7 }}>
                    {current.filename}
                    <span style={{ marginLeft: 12, opacity: 0.5 }}>
                        {currentIndex + 1} / {files.length}
                    </span>
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <Tooltip title="Zoom in">
                        <Button type="text" icon={<ZoomInOutlined />}
                            style={{ color: '#fff' }}
                            onClick={() => setScale(s => Math.min(s + 0.25, 4))} />
                    </Tooltip>
                    <Tooltip title="Zoom out">
                        <Button type="text" icon={<ZoomOutOutlined />}
                            style={{ color: '#fff' }}
                            onClick={() => setScale(s => Math.max(s - 0.25, 0.25))} />
                    </Tooltip>
                    <Tooltip title="Download">
                        <Button type="text" icon={<DownloadOutlined />}
                            style={{ color: '#fff' }}
                            onClick={handleDownload} />
                    </Tooltip>
                    <Tooltip title="Close (Esc)">
                        <Button type="text" icon={<CloseOutlined />}
                            style={{ color: '#fff' }}
                            onClick={onClose} />
                    </Tooltip>
                </div>
            </div>

            {/* Image area */}
            <div
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Prev arrow */}
                {hasPrev && (
                    <Button
                        type="text"
                        icon={<LeftOutlined />}
                        onClick={prev}
                        style={{
                            position: 'absolute', left: 16, color: '#fff',
                            fontSize: 20, width: 48, height: 48,
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1,
                        }}
                    />
                )}

                {/* Image */}
                {current.mimeType.startsWith('image/') ? (
                    <img
                        src={current.fileUrl}
                        alt={current.filename}
                        style={{
                            maxWidth: '90%', maxHeight: '90%',
                            objectFit: 'contain',
                            transform: `scale(${scale})`,
                            transition: 'transform 0.2s',
                            userSelect: 'none',
                        }}
                        draggable={false}
                    />
                ) : current.mimeType.startsWith('video/') ? (
                    <video
                        src={current.fileUrl}
                        controls
                        style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 8 }}
                    />
                ) : null}

                {/* Next arrow */}
                {hasNext && (
                    <Button
                        type="text"
                        icon={<RightOutlined />}
                        onClick={next}
                        style={{
                            position: 'absolute', right: 16, color: '#fff',
                            fontSize: 20, width: 48, height: 48,
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '50%', border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1,
                        }}
                    />
                )}
            </div>

            {/* Thumbnail strip */}
            {files.length > 1 && (
                <div
                    style={{
                        display: 'flex', gap: 8, padding: '12px 16px',
                        overflowX: 'auto', flexShrink: 0, justifyContent: 'center',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {files.map((f, i) => (
                        <div
                            key={f.id}
                            onClick={() => { setCurrentIndex(i); setScale(1); }}
                            style={{
                                width: 52, height: 52, flexShrink: 0, cursor: 'pointer',
                                borderRadius: 4, overflow: 'hidden',
                                border: i === currentIndex ? '2px solid #1890ff' : '2px solid transparent',
                                opacity: i === currentIndex ? 1 : 0.5,
                                transition: 'all 0.15s',
                            }}
                        >
                            {f.mimeType.startsWith('image/') ? (
                                <img src={f.fileUrl} alt={f.filename}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{
                                    width: '100%', height: '100%',
                                    background: '#333',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: 10,
                                }}>
                                    VID
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
