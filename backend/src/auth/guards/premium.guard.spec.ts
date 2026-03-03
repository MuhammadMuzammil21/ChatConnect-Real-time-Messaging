import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PremiumGuard } from './premium.guard';
import { UserRole } from '../../entities/user.entity';

describe('PremiumGuard', () => {
    let guard: PremiumGuard;

    const createMockContext = (user: any): ExecutionContext => {
        return {
            switchToHttp: () => ({
                getRequest: () => ({
                    user,
                }),
            }),
            getHandler: () => (() => { }),
            getClass: () => class { },
        } as unknown as ExecutionContext;
    };

    beforeEach(() => {
        guard = new PremiumGuard();
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should allow PREMIUM users', () => {
        const context = createMockContext({ role: UserRole.PREMIUM });
        expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow ADMIN users', () => {
        const context = createMockContext({ role: UserRole.ADMIN });
        expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny FREE users with ForbiddenException', () => {
        const context = createMockContext({ role: UserRole.FREE });
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow('Premium subscription required');
    });

    it('should throw ForbiddenException when user is not authenticated', () => {
        const context = createMockContext(null);
        expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        expect(() => guard.canActivate(context)).toThrow('User not authenticated');
    });
});
