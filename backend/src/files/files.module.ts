import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { File } from '../entities/file.entity';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';
import { StorageService } from './services/storage.service';
import { LocalStorageService } from './services/local-storage.service';

@Module({
    imports: [TypeOrmModule.forFeature([File])],
    controllers: [FilesController],
    providers: [FilesService, StorageService, LocalStorageService],
    exports: [FilesService],
})
export class FilesModule { }
