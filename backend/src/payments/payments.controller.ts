import {
    Controller,
    Post,
    Body,
    Get,
    Req,
    Res,
    UseGuards,
    Headers,
    HttpCode,
    HttpStatus,
    RawBodyRequest,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { PaymentsService } from './payments.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('checkout')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a Stripe Checkout session for premium subscription' })
    @ApiResponse({ status: 200, description: 'Returns checkout session URL' })
    @ApiResponse({ status: 400, description: 'Already subscribed or invalid request' })
    async createCheckoutSession(
        @CurrentUser() user: User,
        @Body() dto: CreateCheckoutDto,
    ): Promise<{ url: string }> {
        return this.paymentsService.createCheckoutSession(user.id, dto.priceId);
    }

    @Post('billing-portal')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a Stripe Billing Portal session for subscription management' })
    @ApiResponse({ status: 200, description: 'Returns billing portal URL' })
    @ApiResponse({ status: 400, description: 'No billing account found' })
    async createBillingPortalSession(
        @CurrentUser() user: User,
    ): Promise<{ url: string }> {
        return this.paymentsService.createBillingPortalSession(user.id);
    }

    @Get('subscription')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user subscription status' })
    @ApiResponse({ status: 200, description: 'Returns subscription details or null' })
    async getSubscription(@CurrentUser() user: User) {
        const subscription = await this.paymentsService.getUserSubscription(user.id);
        return {
            subscription,
            role: user.role,
            subscriptionStatus: user.subscriptionStatus,
        };
    }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Stripe webhook endpoint (called by Stripe, not by clients)' })
    @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
    async handleWebhook(
        @Req() req: any,
        @Headers('stripe-signature') signature: string,
    ): Promise<{ received: boolean }> {
        const rawBody = req.rawBody;
        if (!rawBody) {
            throw new Error('Raw body not available — ensure raw body parsing is configured');
        }
        await this.paymentsService.handleWebhookEvent(rawBody, signature);
        return { received: true };
    }
}
