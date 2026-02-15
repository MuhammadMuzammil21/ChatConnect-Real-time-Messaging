import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UserStatus, UserStatusEnum } from '../entities/user-status.entity';

@Injectable()
export class UserStatusService {
    private readonly logger = new Logger(UserStatusService.name);
    private readonly AWAY_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

    constructor(
        @InjectRepository(UserStatus)
        private readonly userStatusRepository: Repository<UserStatus>,
    ) { }

    /**
     * Set user status to ONLINE
     */
    async setUserOnline(userId: string): Promise<UserStatus> {
        let userStatus = await this.userStatusRepository.findOne({
            where: { userId },
        });

        if (!userStatus) {
            userStatus = this.userStatusRepository.create({
                userId,
                status: UserStatusEnum.ONLINE,
                lastSeen: new Date(),
            });
        } else {
            userStatus.status = UserStatusEnum.ONLINE;
            userStatus.lastSeen = new Date();
        }

        const saved = await this.userStatusRepository.save(userStatus);
        this.logger.debug(`User ${userId} is now ONLINE`);
        return saved;
    }

    /**
     * Set user status to OFFLINE
     */
    async setUserOffline(userId: string): Promise<UserStatus> {
        let userStatus = await this.userStatusRepository.findOne({
            where: { userId },
        });

        if (!userStatus) {
            userStatus = this.userStatusRepository.create({
                userId,
                status: UserStatusEnum.OFFLINE,
                lastSeen: new Date(),
            });
        } else {
            userStatus.status = UserStatusEnum.OFFLINE;
            userStatus.lastSeen = new Date();
        }

        const saved = await this.userStatusRepository.save(userStatus);
        this.logger.debug(`User ${userId} is now OFFLINE`);
        return saved;
    }

    /**
     * Set user status to AWAY
     */
    async setUserAway(userId: string): Promise<UserStatus> {
        const userStatus = await this.userStatusRepository.findOne({
            where: { userId },
        });

        if (!userStatus) {
            throw new NotFoundException(`User status not found for user ${userId}`);
        }

        userStatus.status = UserStatusEnum.AWAY;
        const saved = await this.userStatusRepository.save(userStatus);
        this.logger.debug(`User ${userId} is now AWAY`);
        return saved;
    }

    /**
     * Update user's last seen timestamp (heartbeat)
     */
    async updateHeartbeat(userId: string): Promise<UserStatus> {
        let userStatus = await this.userStatusRepository.findOne({
            where: { userId },
        });

        if (!userStatus) {
            // Create if doesn't exist
            userStatus = this.userStatusRepository.create({
                userId,
                status: UserStatusEnum.ONLINE,
                lastSeen: new Date(),
            });
        } else {
            userStatus.lastSeen = new Date();
            // If user was AWAY, set back to ONLINE
            if (userStatus.status === UserStatusEnum.AWAY) {
                userStatus.status = UserStatusEnum.ONLINE;
            }
        }

        return await this.userStatusRepository.save(userStatus);
    }

    /**
     * Get user status by user ID
     */
    async getUserStatus(userId: string): Promise<UserStatus | null> {
        return await this.userStatusRepository.findOne({
            where: { userId },
        });
    }

    /**
     * Get multiple user statuses efficiently
     */
    async getBulkUserStatus(userIds: string[]): Promise<UserStatus[]> {
        if (userIds.length === 0) {
            return [];
        }

        return await this.userStatusRepository.find({
            where: { userId: In(userIds) },
        });
    }

    /**
     * Cron job to check for inactive users and mark them as AWAY
     * Runs every minute
     */
    @Cron(CronExpression.EVERY_MINUTE)
    async checkInactiveUsers(): Promise<void> {
        const threshold = new Date(Date.now() - this.AWAY_THRESHOLD_MS);

        try {
            const result = await this.userStatusRepository
                .createQueryBuilder()
                .update(UserStatus)
                .set({ status: UserStatusEnum.AWAY })
                .where('status = :status', { status: UserStatusEnum.ONLINE })
                .andWhere('last_seen < :threshold', { threshold })
                .execute();

            if (result.affected && result.affected > 0) {
                this.logger.debug(
                    `Marked ${result.affected} inactive users as AWAY`,
                );
            }
        } catch (error) {
            this.logger.error(`Error checking inactive users: ${error.message}`);
        }
    }
}
