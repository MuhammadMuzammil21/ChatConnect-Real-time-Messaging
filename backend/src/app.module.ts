import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { UserStatus } from './entities/user-status.entity';
import { File } from './entities/file.entity';
import { FileDownload } from './entities/file-download.entity';
import { FileShareLink } from './entities/file-share-link.entity';
import { Subscription } from './entities/subscription.entity';
import { AuthModule } from './auth/auth.module';
import { DemoModule } from './demo/demo.module';
import { UsersModule } from './users/users.module';
import { ProfileModule } from './profile/profile.module';
import { ChatModule } from './chat/chat.module';
import { ConversationsModule } from './conversations/conversations.module';
import { UserStatusModule } from './user-status/user-status.module';
import { FilesModule } from './files/files.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [User, Message, Conversation, ConversationParticipant, UserStatus, File, FileDownload, FileShareLink, Subscription],
        synchronize: configService.get('NODE_ENV') === 'development', // Auto-sync in development only
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    DemoModule,
    UsersModule,
    ProfileModule,
    ChatModule,
    ConversationsModule,
    UserStatusModule,
    FilesModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

