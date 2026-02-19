import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface FileUploadOptions {
    conversationId?: string;
    messageId?: string;
    onProgress?: (progress: number) => void;
}

export interface FileMetadata {
    id: string;
    filename: string;
    fileUrl: string;
    mimeType: string;
    fileSize: number;
    uploadedById: string;
    conversationId?: string;
    messageId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ShareLink {
    id: string;
    token: string;
    shareUrl: string;
    expiresAt: string | null;
    createdAt: string;
}

export interface UserFileStatistics {
    totalFiles: number;
    totalSize: number;
    byType: { mimeType: string; count: number; totalSize: number }[];
}

export const filesApi = {
    /**
     * Upload a file
     */
    uploadFile: async (
        file: File,
        options: FileUploadOptions = {}
    ): Promise<FileMetadata> => {
        const formData = new FormData();
        formData.append('file', file);

        if (options.conversationId) {
            formData.append('conversationId', options.conversationId);
        }
        if (options.messageId) {
            formData.append('messageId', options.messageId);
        }

        const token = localStorage.getItem('token');

        const response = await axios.post<FileMetadata>(
            `${API_URL}/files/upload`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
                onUploadProgress: (progressEvent) => {
                    if (options.onProgress && progressEvent.total) {
                        const progress = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                        options.onProgress(progress);
                    }
                },
            }
        );

        return response.data;
    },

    /**
     * Get file metadata by ID
     */
    getFile: async (fileId: string): Promise<FileMetadata> => {
        const token = localStorage.getItem('token');

        const response = await axios.get<FileMetadata>(
            `${API_URL}/files/${fileId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    },

    /**
     * Download file
     */
    downloadFile: async (fileId: string, filename: string): Promise<void> => {
        const token = localStorage.getItem('token');

        const response = await axios.get(`${API_URL}/files/${fileId}/download`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            responseType: 'blob',
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    /**
     * Delete file
     */
    deleteFile: async (fileId: string): Promise<void> => {
        const token = localStorage.getItem('token');

        await axios.delete(`${API_URL}/files/${fileId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    },

    /**
     * Get current user's files
     */
    getMyFiles: async (): Promise<FileMetadata[]> => {
        const token = localStorage.getItem('token');

        const response = await axios.get<FileMetadata[]>(
            `${API_URL}/files/user/my-files`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    },

    /**
     * Get files for a conversation
     */
    getConversationFiles: async (
        conversationId: string
    ): Promise<FileMetadata[]> => {
        const token = localStorage.getItem('token');

        const response = await axios.get<FileMetadata[]>(
            `${API_URL}/files/conversation/${conversationId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    },

    /** Generate a signed (time-limited) download URL */
    generateSignedUrl: async (fileId: string, expiresIn?: number): Promise<{ signedUrl: string; expiresAt: Date }> => {
        const token = localStorage.getItem('token');
        const params = expiresIn ? `?expiresIn=${expiresIn}` : '';
        const response = await axios.get(`${API_URL}/files/${fileId}/signed-url${params}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    /** Create a shareable public link for a file */
    createShareLink: async (fileId: string, expiresIn?: number): Promise<ShareLink> => {
        const token = localStorage.getItem('token');
        const response = await axios.post(
            `${API_URL}/files/${fileId}/share-links`,
            { expiresIn },
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return response.data;
    },

    /** List all share links for a file */
    getShareLinks: async (fileId: string): Promise<ShareLink[]> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/files/${fileId}/share-links`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },

    /** Revoke a share link */
    revokeShareLink: async (linkId: string): Promise<void> => {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/files/share-links/${linkId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    },

    /** Rename a file */
    renameFile: async (fileId: string, filename: string): Promise<FileMetadata> => {
        const token = localStorage.getItem('token');
        const response = await axios.put(
            `${API_URL}/files/${fileId}/rename`,
            { filename },
            { headers: { Authorization: `Bearer ${token}` } },
        );
        return response.data;
    },

    /** Get storage usage statistics for the current user */
    getUserStatistics: async (): Promise<UserFileStatistics> => {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/files/user/statistics`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    },
};
