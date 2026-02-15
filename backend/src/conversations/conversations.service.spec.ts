import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { ConversationsService } from './conversations.service';
import { Conversation, ConversationType } from '../entities/conversation.entity';
import { ConversationParticipant } from '../entities/conversation-participant.entity';
import { Message, MessageType } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { GetMessagesQueryDto } from './dto/get-messages-query.dto';

describe('ConversationsService', () => {
    let service: ConversationsService;
    let messageRepository: Repository<Message>;
    let participantRepository: Repository<ConversationParticipant>;
    let conversationRepository: Repository<Conversation>;
    let userRepository: Repository<User>;

    const mockUser: Partial<User> = {
        id: 'user-1',
        email: 'u@test.com',
        displayName: 'User One',
    };

    const mockConversation: Partial<Conversation> = {
        id: 'conv-1',
        type: ConversationType.DIRECT,
        name: null,
    };

    const mockParticipant: Partial<ConversationParticipant> = {
        id: 'part-1',
        conversation: mockConversation as Conversation,
        user: mockUser as User,
        lastReadAt: null,
        joinedAt: new Date(),
    };

    const mockMessage: Partial<Message> = {
        id: 'msg-1',
        content: 'Hello',
        messageType: MessageType.TEXT,
        sender: mockUser as User,
        conversation: mockConversation as Conversation,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockMessageRepo = {
        create: jest.fn(),
        save: jest.fn(),
        findAndCount: jest.fn(),
        count: jest.fn(),
    };

    const mockParticipantRepo = {
        findOne: jest.fn(),
        find: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined),
    };

    const mockConversationRepo = {
        findOne: jest.fn(),
    };

    const mockUserRepo = {
        findOne: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ConversationsService,
                { provide: getRepositoryToken(Message), useValue: mockMessageRepo },
                { provide: getRepositoryToken(ConversationParticipant), useValue: mockParticipantRepo },
                { provide: getRepositoryToken(Conversation), useValue: mockConversationRepo },
                { provide: getRepositoryToken(User), useValue: mockUserRepo },
            ],
        }).compile();

        service = module.get<ConversationsService>(ConversationsService);
        messageRepository = module.get(getRepositoryToken(Message));
        participantRepository = module.get(getRepositoryToken(ConversationParticipant));
        conversationRepository = module.get(getRepositoryToken(Conversation));
        userRepository = module.get(getRepositoryToken(User));
        jest.clearAllMocks();
    });

    describe('createMessage', () => {
        it('should create and return a message when input is valid', async () => {
            mockParticipantRepo.findOne.mockResolvedValue(mockParticipant);
            mockConversationRepo.findOne.mockResolvedValue(mockConversation);
            mockUserRepo.findOne.mockResolvedValue(mockUser);
            mockMessageRepo.create.mockReturnValue(mockMessage);
            mockMessageRepo.save.mockResolvedValue(mockMessage);

            const result = await service.createMessage(
                'conv-1',
                'user-1',
                '  Hello world  ',
                MessageType.TEXT,
            );

            expect(result).toEqual(mockMessage);
            expect(mockMessageRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    content: 'Hello world',
                    messageType: MessageType.TEXT,
                }),
            );
            expect(mockMessageRepo.save).toHaveBeenCalledWith(mockMessage);
        });

        it('should throw BadRequestException when content is empty', async () => {
            await expect(
                service.createMessage('conv-1', 'user-1', '   ', MessageType.TEXT),
            ).rejects.toThrow(BadRequestException);
            await expect(
                service.createMessage('conv-1', 'user-1', '', MessageType.TEXT),
            ).rejects.toThrow(BadRequestException);
            expect(mockMessageRepo.save).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException when content exceeds max length', async () => {
            const long = 'a'.repeat(2001);
            await expect(
                service.createMessage('conv-1', 'user-1', long, MessageType.TEXT),
            ).rejects.toThrow(BadRequestException);
            expect(mockMessageRepo.save).not.toHaveBeenCalled();
        });

        it('should throw BadRequestException when message type is invalid', async () => {
            mockParticipantRepo.findOne.mockResolvedValue(mockParticipant);
            await expect(
                service.createMessage('conv-1', 'user-1', 'Hi', 'INVALID' as MessageType),
            ).rejects.toThrow(BadRequestException);
            expect(mockMessageRepo.save).not.toHaveBeenCalled();
        });

        it('should throw ForbiddenException when user is not a participant', async () => {
            mockParticipantRepo.findOne.mockResolvedValue(null);
            await expect(
                service.createMessage('conv-1', 'user-1', 'Hi', MessageType.TEXT),
            ).rejects.toThrow(ForbiddenException);
            expect(mockMessageRepo.save).not.toHaveBeenCalled();
        });

        it('should throw NotFoundException when conversation does not exist', async () => {
            mockParticipantRepo.findOne.mockResolvedValue(mockParticipant);
            mockConversationRepo.findOne.mockResolvedValue(null);
            await expect(
                service.createMessage('conv-1', 'user-1', 'Hi', MessageType.TEXT),
            ).rejects.toThrow(NotFoundException);
            expect(mockMessageRepo.save).not.toHaveBeenCalled();
        });
    });

    describe('getMessageHistory', () => {
        it('should return paginated messages for a participant', async () => {
            mockParticipantRepo.findOne.mockResolvedValue(mockParticipant);
            mockMessageRepo.findAndCount.mockResolvedValue([[mockMessage], 1]);

            const query: GetMessagesQueryDto = { page: 1, limit: 50 };
            const result = await service.getMessageHistory('conv-1', 'user-1', query);

            expect(result).toEqual({
                items: [mockMessage],
                total: 1,
                page: 1,
                limit: 50,
            });
            expect(mockMessageRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { conversation: { id: 'conv-1' } },
                    relations: ['sender'],
                    order: { createdAt: 'DESC' },
                    skip: 0,
                    take: 50,
                }),
            );
        });

        it('should cap limit at 100', async () => {
            mockParticipantRepo.findOne.mockResolvedValue(mockParticipant);
            mockMessageRepo.findAndCount.mockResolvedValue([[], 0]);

            await service.getMessageHistory('conv-1', 'user-1', { page: 1, limit: 200 });

            expect(mockMessageRepo.findAndCount).toHaveBeenCalledWith(
                expect.objectContaining({ take: 100 }),
            );
        });

        it('should throw ForbiddenException when user is not a participant', async () => {
            mockParticipantRepo.findOne.mockResolvedValue(null);
            await expect(
                service.getMessageHistory('conv-1', 'user-1', {}),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('getUnreadCountForConversation', () => {
        it('should return unread count for a participant', async () => {
            mockParticipantRepo.findOne.mockResolvedValue(mockParticipant);
            mockMessageRepo.count.mockResolvedValue(3);

            const result = await service.getUnreadCountForConversation('conv-1', 'user-1');

            expect(result).toBe(3);
        });

        it('should throw ForbiddenException when user is not a participant', async () => {
            mockParticipantRepo.findOne.mockResolvedValue(null);
            await expect(
                service.getUnreadCountForConversation('conv-1', 'user-1'),
            ).rejects.toThrow(ForbiddenException);
        });
    });

    describe('markConversationAsRead', () => {
        it('should update lastReadAt for participant', async () => {
            const participant = { ...mockParticipant };
            mockParticipantRepo.findOne.mockResolvedValue(participant);

            await service.markConversationAsRead('conv-1', 'user-1');

            expect(mockParticipantRepo.save).toHaveBeenCalledWith(
                expect.objectContaining({ lastReadAt: expect.any(Date) }),
            );
        });

        it('should throw ForbiddenException when user is not a participant', async () => {
            mockParticipantRepo.findOne.mockResolvedValue(null);
            await expect(
                service.markConversationAsRead('conv-1', 'user-1'),
            ).rejects.toThrow(ForbiddenException);
        });
    });
});
