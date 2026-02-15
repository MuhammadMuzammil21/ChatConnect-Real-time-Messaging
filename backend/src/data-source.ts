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
  ],
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
});

