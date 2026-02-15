import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserStatus } from '../entities/user-status.entity';
import { UserStatusService } from './user-status.service';
import { UserStatusController } from './user-status.controller';

@Module({
    imports: [TypeOrmModule.forFeature([UserStatus])],
    controllers: [UserStatusController],
    providers: [UserStatusService],
    exports: [UserStatusService],
})
export class UserStatusModule { }
