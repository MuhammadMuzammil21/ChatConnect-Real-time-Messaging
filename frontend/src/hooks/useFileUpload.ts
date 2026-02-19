import { useState, useCallback } from 'react';
import { message } from 'antd';
import { filesApi } from '../api/files';
import type { FileMetadata, FileUploadOptions } from '../api/files';

// File size limits (in bytes)
const FILE_SIZE_LIMITS = {
    FREE: 10 * 1024 * 1024, // 10MB
    PREMIUM: 50 * 1024 * 1024, // 50MB
};

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    documents: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
    ],
    videos: ['video/mp4', 'video/webm', 'video/quicktime'],
};

const getAllowedMimeTypes = (): string[] => {
    return [
        ...ALLOWED_MIME_TYPES.images,
        ...ALLOWED_MIME_TYPES.documents,
        ...ALLOWED_MIME_TYPES.videos,
    ];
};

export interface UploadingFile {
    file: File;
    progress: number;
    status: 'uploading' | 'success' | 'error';
    metadata?: FileMetadata;
    error?: string;
}

interface UseFileUploadReturn {
    uploadingFiles: UploadingFile[];
    uploadFile: (file: File, options?: FileUploadOptions) => Promise<FileMetadata | null>;
    uploadFiles: (files: File[], options?: FileUploadOptions) => Promise<FileMetadata[]>;
    removeUploadingFile: (file: File) => void;
    clearUploadingFiles: () => void;
    isUploading: boolean;
    validateFile: (file: File, userRole?: 'FREE' | 'PREMIUM') => { valid: boolean; error?: string };
}

export const useFileUpload = (): UseFileUploadReturn => {
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

    const validateFile = useCallback(
        (file: File, userRole: 'FREE' | 'PREMIUM' = 'FREE'): { valid: boolean; error?: string } => {
            // Check MIME type
            const allowedTypes = getAllowedMimeTypes();
            if (!allowedTypes.includes(file.type)) {
                return {
                    valid: false,
                    error: `Invalid file type. Allowed: images, documents, videos`,
                };
            }

            // Check file size
            const maxSize = FILE_SIZE_LIMITS[userRole];
            if (file.size > maxSize) {
                const maxSizeMB = Math.round(maxSize / (1024 * 1024));
                return {
                    valid: false,
                    error: `File size exceeds ${maxSizeMB}MB limit for ${userRole} users`,
                };
            }

            return { valid: true };
        },
        []
    );

    const uploadFile = useCallback(
        async (file: File, options: FileUploadOptions = {}): Promise<FileMetadata | null> => {
            // Validate file
            const validation = validateFile(file);
            if (!validation.valid) {
                message.error(validation.error);
                return null;
            }

            // Add to uploading files
            const uploadingFile: UploadingFile = {
                file,
                progress: 0,
                status: 'uploading',
            };

            setUploadingFiles((prev) => [...prev, uploadingFile]);

            try {
                const metadata = await filesApi.uploadFile(file, {
                    ...options,
                    onProgress: (progress) => {
                        setUploadingFiles((prev) =>
                            prev.map((f) =>
                                f.file === file ? { ...f, progress } : f
                            )
                        );
                    },
                });

                // Update status to success
                setUploadingFiles((prev) =>
                    prev.map((f) =>
                        f.file === file
                            ? { ...f, status: 'success', metadata, progress: 100 }
                            : f
                    )
                );

                message.success(`${file.name} uploaded successfully`);
                return metadata;
            } catch (error: any) {
                const errorMessage =
                    error.response?.data?.message || 'Failed to upload file';

                // Update status to error
                setUploadingFiles((prev) =>
                    prev.map((f) =>
                        f.file === file
                            ? { ...f, status: 'error', error: errorMessage }
                            : f
                    )
                );

                message.error(errorMessage);
                return null;
            }
        },
        [validateFile]
    );

    const uploadFiles = useCallback(
        async (files: File[], options: FileUploadOptions = {}): Promise<FileMetadata[]> => {
            const uploadPromises = files.map((file) => uploadFile(file, options));
            const results = await Promise.all(uploadPromises);
            return results.filter((metadata): metadata is FileMetadata => metadata !== null);
        },
        [uploadFile]
    );

    const removeUploadingFile = useCallback((file: File) => {
        setUploadingFiles((prev) => prev.filter((f) => f.file !== file));
    }, []);

    const clearUploadingFiles = useCallback(() => {
        setUploadingFiles([]);
    }, []);

    const isUploading = uploadingFiles.some((f) => f.status === 'uploading');

    return {
        uploadingFiles,
        uploadFile,
        uploadFiles,
        removeUploadingFile,
        clearUploadingFiles,
        isUploading,
        validateFile,
    };
};
