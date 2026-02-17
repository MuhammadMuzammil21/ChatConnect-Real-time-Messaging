export const storageConfig = {
    type: process.env.STORAGE_TYPE || 'local',
    local: {
        path: process.env.STORAGE_LOCAL_PATH || './uploads/files',
        baseUrl: process.env.STORAGE_BASE_URL || 'http://localhost:3000/files',
    },
    s3: {
        region: process.env.AWS_REGION || 'us-east-1',
        bucket: process.env.AWS_S3_BUCKET_NAME,
        baseUrl: process.env.AWS_S3_BASE_URL,
    },
    limits: {
        free: parseInt(process.env.FILE_MAX_SIZE_FREE || '10485760'), // 10MB
        premium: parseInt(process.env.FILE_MAX_SIZE_PREMIUM || '52428800'), // 50MB
        maxFiles: 5,
    },
    allowedTypes: {
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
    },
};

export const getAllowedMimeTypes = (): string[] => {
    return [
        ...storageConfig.allowedTypes.images,
        ...storageConfig.allowedTypes.documents,
        ...storageConfig.allowedTypes.videos,
    ];
};
