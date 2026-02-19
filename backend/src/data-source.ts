import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { Message } from './entities/message.entity';
import { Conversation } from './entities/conversation.entity';
import { ConversationParticipant } from './entities/conversation-participant.entity';
import { CreateChatEntities1739200000000 } from './migrations/1739200000000-CreateChatEntities';
import { CreateUserStatus1739520000000 } from './migrations/1739520000000-CreateUserStatus';
import { UpdateMessageEntity1739520100000 } from './migrations/1739520100000-UpdateMessageEntity';
import { CreateFilesTable1739520150000 } from './migrations/1739520150000-CreateFilesTable';
import { CreateFileDownload1739520200000 } from './migrations/1739520200000-CreateFileDownload';
import { AddImageVariantsToFiles1739520300000 } from './migrations/1739520300000-AddImageVariantsToFiles';
import { AddFileSharingAndVersioning1739520400000 } from './migrations/1739520400000-AddFileSharingAndVersioning';
import { AddFileIndexes1739520500000 } from './migrations/1739520500000-AddFileIndexes';

ConfigModule.forRoot({
  isGlobal: false,
  envFilePath: '.env',
});

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: configService.get('DB_PORT'),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: [User, Message, Conversation, ConversationParticipant],
  migrations: [
    CreateChatEntities1739200000000,
    CreateUserStatus1739520000000,
    UpdateMessageEntity1739520100000,
    CreateFilesTable1739520150000,
    CreateFileDownload1739520200000,
    AddImageVariantsToFiles1739520300000,
    AddFileSharingAndVersioning1739520400000,
    AddFileIndexes1739520500000,
  ],
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
});

