import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { UserRole } from '../../entities/user.entity';

/**
 * Guard that restricts access to PREMIUM and ADMIN users only.
 * Use this to protect premium-only features like group chat creation.
 */
@Injectable()
export class PremiumGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user) {
            throw new ForbiddenException('User not authenticated');
        }

        if (user.role === UserRole.PREMIUM || user.role === UserRole.ADMIN) {
            return true;
        }

        throw new ForbiddenException(
            'Premium subscription required. Upgrade to access this feature.',
        );
    }
}
