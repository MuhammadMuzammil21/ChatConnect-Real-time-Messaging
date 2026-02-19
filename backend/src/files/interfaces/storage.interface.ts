export interface UploadResult {
    storedFilename: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
}

export interface IStorageProvider {
    uploadFile(file: Express.Multer.File, userId: string): Promise<UploadResult>;
    deleteFile(storedFilename: string): Promise<void>;
    getFileUrl(storedFilename: string): string;
    getFileStream(storedFilename: string): Promise<import('stream').Readable>;
    getFileMetadata(storedFilename: string): Promise<{ size: number; mimeType: string }>;
}
