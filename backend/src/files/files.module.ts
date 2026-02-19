import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../entities/file.entity';
import { FileDownload } from '../entities/file-download.entity';
import { FileShareLink } from '../entities/file-share-link.entity';
import { ConversationParticipant } from '../entities/conversation-participant.entity';
import { User } from '../entities/user.entity';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { StorageService } from './services/storage.service';
import { LocalStorageService } from './services/local-storage.service';
import { SignedUrlService } from './services/signed-url.service';
import { FileUploadRateLimitService } from './services/file-upload-rate-limit.service';
import { ImageProcessingService } from './services/image-processing.service';
import { VideoProcessingService } from './services/video-processing.service';
import { FileSharingService } from './services/file-sharing.service';
import { StorageQuotaService } from './services/storage-quota.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([File, FileDownload, FileShareLink, ConversationParticipant, User]),
    ],
    controllers: [FilesController],
    providers: [
        FilesService,
        StorageService,
        LocalStorageService,
        SignedUrlService,
        FileUploadRateLimitService,
        ImageProcessingService,
        VideoProcessingService,
        FileSharingService,
        StorageQuotaService,
    ],
    exports: [FilesService],
})
export class FilesModule { }
