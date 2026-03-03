import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Subscription, SubscriptionPlanStatus } from '../entities/subscription.entity';
import { User, UserRole, SubscriptionStatus } from '../entities/user.entity';

@Injectable()
export class PaymentsService {
    private readonly stripe: Stripe;
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        @InjectRepository(Subscription)
        private readonly subscriptionRepository: Repository<Subscription>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly configService: ConfigService,
    ) {
        const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!stripeSecretKey) {
            this.logger.warn('STRIPE_SECRET_KEY is not set. Stripe functionality will not work.');
        }
        this.stripe = new Stripe(stripeSecretKey || '', {
            apiVersion: '2026-02-25.clover',
        });
    }

    /**
     * Create a Stripe Checkout session for premium subscription
     */
    async createCheckoutSession(userId: string, priceId?: string): Promise<{ url: string }> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (user.role === UserRole.PREMIUM) {
            throw new BadRequestException('You already have a Premium subscription');
        }

        // Create or retrieve Stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await this.stripe.customers.create({
                email: user.email,
                name: user.displayName,
                metadata: { userId: user.id },
            });
            customerId = customer.id;
            await this.userRepository.update(user.id, { stripeCustomerId: customerId });
        }

        const resolvedPriceId = priceId || this.configService.get<string>('STRIPE_PRICE_ID');
        if (!resolvedPriceId) {
            throw new InternalServerErrorException(
                'Stripe Price ID is not configured. Set STRIPE_PRICE_ID in your environment.',
            );
        }

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

        const session = await this.stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price: resolvedPriceId,
                    quantity: 1,
                },
            ],
            success_url: `${frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/subscription/cancel`,
            metadata: { userId: user.id },
        });

        return { url: session.url! };
    }

    /**
     * Create a Stripe Billing Portal session for subscription management
     */
    async createBillingPortalSession(userId: string): Promise<{ url: string }> {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new NotFoundException('User not found');
        }

        if (!user.stripeCustomerId) {
            throw new BadRequestException('No billing account found. Subscribe first.');
        }

        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';

        const session = await this.stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${frontendUrl}/profile`,
        });

        return { url: session.url };
    }

    /**
     * Handle Stripe webhook events
     */
    async handleWebhookEvent(payload: Buffer, signature: string): Promise<void> {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

        let event: Stripe.Event;

        if (webhookSecret) {
            try {
                event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
            } catch (err: any) {
                this.logger.error(`Webhook signature verification failed: ${err.message}`);
                throw new BadRequestException('Invalid webhook signature');
            }
        } else {
            this.logger.warn('STRIPE_WEBHOOK_SECRET not configured — skipping signature verification');
            event = JSON.parse(payload.toString()) as Stripe.Event;
        }

        this.logger.log(`Processing webhook event: ${event.type} (${event.id})`);

        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
                break;
            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;
            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;
            case 'invoice.payment_failed':
                await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
                break;
            default:
                this.logger.log(`Unhandled event type: ${event.type}`);
        }
    }

    /**
     * Handle checkout.session.completed — create subscription record and upgrade role
     */
    private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
        const userId = session.metadata?.userId;
        if (!userId) {
            this.logger.warn('checkout.session.completed missing userId in metadata');
            return;
        }

        const stripeSubscriptionId = session.subscription as string;
        if (!stripeSubscriptionId) {
            this.logger.warn('checkout.session.completed missing subscription ID');
            return;
        }

        // Idempotent: skip if subscription record already exists
        const existing = await this.subscriptionRepository.findOne({
            where: { stripeSubscriptionId },
        });
        if (existing) {
            this.logger.log(`Subscription ${stripeSubscriptionId} already exists — skipping`);
            return;
        }

        // Fetch full subscription from Stripe for period info
        const stripeSubscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);

        const subscription = this.subscriptionRepository.create({
            userId,
            stripeSubscriptionId,
            stripePriceId: stripeSubscription.items.data[0]?.price?.id || '',
            status: SubscriptionPlanStatus.ACTIVE,
            currentPeriodStart: new Date((stripeSubscription as any).current_period_start * 1000),
            currentPeriodEnd: new Date((stripeSubscription as any).current_period_end * 1000),
        });

        await this.subscriptionRepository.save(subscription);

        // Upgrade user role
        await this.userRepository.update(userId, {
            role: UserRole.PREMIUM,
            subscriptionStatus: SubscriptionStatus.ACTIVE,
        });

        this.logger.log(`User ${userId} upgraded to PREMIUM`);
    }

    /**
     * Handle customer.subscription.updated — sync status changes
     */
    private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
        const subscription = await this.subscriptionRepository.findOne({
            where: { stripeSubscriptionId: stripeSubscription.id },
            relations: ['user'],
        });

        if (!subscription) {
            this.logger.warn(`No local subscription found for ${stripeSubscription.id}`);
            return;
        }

        // Map Stripe status to our enum
        const statusMap: Record<string, SubscriptionPlanStatus> = {
            active: SubscriptionPlanStatus.ACTIVE,
            past_due: SubscriptionPlanStatus.PAST_DUE,
            canceled: SubscriptionPlanStatus.CANCELLED,
            incomplete: SubscriptionPlanStatus.INCOMPLETE,
        };

        const newStatus = statusMap[stripeSubscription.status] || SubscriptionPlanStatus.INCOMPLETE;

        subscription.status = newStatus;
        subscription.currentPeriodStart = new Date((stripeSubscription as any).current_period_start * 1000);
        subscription.currentPeriodEnd = new Date((stripeSubscription as any).current_period_end * 1000);
        await this.subscriptionRepository.save(subscription);

        // Update user role based on subscription status
        if (newStatus === SubscriptionPlanStatus.ACTIVE) {
            await this.userRepository.update(subscription.userId, {
                role: UserRole.PREMIUM,
                subscriptionStatus: SubscriptionStatus.ACTIVE,
            });
        } else if (
            newStatus === SubscriptionPlanStatus.CANCELLED ||
            newStatus === SubscriptionPlanStatus.PAST_DUE
        ) {
            await this.userRepository.update(subscription.userId, {
                role: UserRole.FREE,
                subscriptionStatus:
                    newStatus === SubscriptionPlanStatus.CANCELLED
                        ? SubscriptionStatus.CANCELLED
                        : SubscriptionStatus.PAST_DUE,
            });
        }
    }

    /**
     * Handle customer.subscription.deleted — downgrade user
     */
    private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
        const subscription = await this.subscriptionRepository.findOne({
            where: { stripeSubscriptionId: stripeSubscription.id },
        });

        if (!subscription) {
            this.logger.warn(`No local subscription found for ${stripeSubscription.id}`);
            return;
        }

        subscription.status = SubscriptionPlanStatus.CANCELLED;
        await this.subscriptionRepository.save(subscription);

        await this.userRepository.update(subscription.userId, {
            role: UserRole.FREE,
            subscriptionStatus: SubscriptionStatus.CANCELLED,
        });

        this.logger.log(`User ${subscription.userId} downgraded to FREE`);
    }

    /**
     * Handle invoice.payment_failed — mark subscription as past due
     */
    private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
        const stripeSubscriptionId = (invoice as any).subscription as string;
        if (!stripeSubscriptionId) return;

        const subscription = await this.subscriptionRepository.findOne({
            where: { stripeSubscriptionId },
        });

        if (!subscription) return;

        subscription.status = SubscriptionPlanStatus.PAST_DUE;
        await this.subscriptionRepository.save(subscription);

        await this.userRepository.update(subscription.userId, {
            subscriptionStatus: SubscriptionStatus.PAST_DUE,
        });

        this.logger.warn(`Payment failed for user ${subscription.userId}`);
    }

    /**
     * Get current subscription for a user
     */
    async getUserSubscription(userId: string): Promise<Subscription | null> {
        return this.subscriptionRepository.findOne({
            where: { userId },
            order: { createdAt: 'DESC' },
        });
    }
}
