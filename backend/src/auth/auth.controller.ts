import {
    Controller,
    Get,
    Post,
    UseGuards,
    Req,
    Res,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiBody,
    ApiExcludeEndpoint,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { RefreshTokenDto } from './dto/auth.dto';
import { UserRole, User } from '../entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Get('google')
    @UseGuards(GoogleAuthGuard)
    @ApiOperation({ summary: 'Initiate Google OAuth login' })
    @ApiExcludeEndpoint()
    async googleAuth() {
        // Initiates Google OAuth flow
    }

    @Get('google/callback')
    @UseGuards(GoogleAuthGuard)
    @ApiOperation({ summary: 'Google OAuth callback' })
    @ApiExcludeEndpoint()
    async googleAuthCallback(@Req() req, @Res() res: Response) {
        const tokenResponse = await this.authService.login(req.user);

        // Redirect to frontend with tokens
        const frontendUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth/callback`;
        const params = new URLSearchParams({
            accessToken: tokenResponse.accessToken,
            refreshToken: tokenResponse.refreshToken,
            user: JSON.stringify(tokenResponse.user),
        });

        return res.redirect(`${frontendUrl}?${params.toString()}`);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Refresh access token' })
    @ApiBody({ type: RefreshTokenDto })
    @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
    @ApiResponse({ status: 401, description: 'Invalid refresh token' })
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        return this.authService.refreshToken(refreshTokenDto.refreshToken);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@CurrentUser() user: User) {
        return {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
            role: user.role,
            subscriptionStatus: user.subscriptionStatus,
        };
    }

    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Logout user' })
    @ApiResponse({ status: 200, description: 'Logged out successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async logout(@CurrentUser() user: User) {
        await this.authService.logout(user.id);
        return { message: 'Logged out successfully' };
    }

    @Get('premium/content')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.PREMIUM, UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get premium content (PREMIUM/ADMIN only)' })
    @ApiResponse({ status: 200, description: 'Premium content retrieved successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Premium or Admin role required' })
    async getPremiumContent(@CurrentUser() user: User) {
        return {
            message: 'Welcome to premium content!',
            content: 'This is exclusive premium content only accessible to PREMIUM and ADMIN users.',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }

    @Post('admin/assign-role')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Assign role to user (ADMIN only)' })
    @ApiResponse({ status: 200, description: 'Role assigned successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async assignRole(
        @CurrentUser() admin: User,
        @Body() body: { userId: string; role: UserRole },
    ) {
        const updatedUser = await this.authService.assignRole(body.userId, body.role);
        return {
            message: 'Role assigned successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                role: updatedUser.role,
            },
            admin: {
                id: admin.id,
                email: admin.email,
            },
        };
    }

    @Get('admin/users')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Get all users (ADMIN only)' })
    @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
    async getAllUsers(@CurrentUser() admin: User) {
        const users = await this.authService.getAllUsers();
        return {
            message: 'Users retrieved successfully',
            count: users.length,
            users: users.map(user => ({
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                role: user.role,
                subscriptionStatus: user.subscriptionStatus,
                isBanned: user.isBanned,
                createdAt: user.createdAt,
            })),
            admin: {
                id: admin.id,
                email: admin.email,
            },
        };
    }
}
