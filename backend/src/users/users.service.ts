import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }


    async findAll(): Promise<User[]> {
        return this.userRepository.find({
            select: ['id', 'email', 'displayName', 'avatarUrl', 'role', 'subscriptionStatus', 'createdAt'],
        });
    }

    async findAllAdmin(): Promise<User[]> {
        return this.userRepository.find();
    }

    async findOne(id: string): Promise<User | null> {
        return this.userRepository.findOne({
            where: { id },
            select: [
                'id',
                'email',
                'displayName',
                'avatarUrl',
                'role',
                'subscriptionStatus',
                'isBanned',
                'createdAt',
                'updatedAt',
            ],
        });
    }

    async updateRole(id: string, role: UserRole): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        user.role = role;
        return this.userRepository.save(user);
    }
}
