import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserStatusService } from './user-status.service';
import { UserStatus } from '../entities/user-status.entity';

class BulkStatusRequestDto {
    userIds: string[];
}

@ApiTags('User Status')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserStatusController {
    constructor(private readonly userStatusService: UserStatusService) { }

    @Get(':id/status')
    @ApiOperation({ summary: 'Get user status by ID' })
    @ApiParam({ name: 'id', description: 'User ID' })
    @ApiResponse({
        status: 200,
        description: 'User status retrieved successfully',
    })
    @ApiResponse({ status: 404, description: 'User status not found' })
    async getUserStatus(@Param('id') userId: string): Promise<UserStatus | null> {
        return await this.userStatusService.getUserStatus(userId);
    }

    @Post('status')
    @ApiOperation({ summary: 'Get bulk user statuses' })
    @ApiBody({
        description: 'Array of user IDs',
        schema: {
            type: 'object',
            properties: {
                userIds: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['uuid1', 'uuid2', 'uuid3'],
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'User statuses retrieved successfully',
    })
    async getBulkUserStatus(
        @Body() body: BulkStatusRequestDto,
    ): Promise<UserStatus[]> {
        return await this.userStatusService.getBulkUserStatus(body.userIds);
    }
}
