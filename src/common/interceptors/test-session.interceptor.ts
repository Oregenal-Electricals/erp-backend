import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { testSessionStorage } from '../context/test-session.context';

// Roles allowed to still use the raw X-Test-Session header directly (e.g.
// via curl/Postman) for ad-hoc debugging - everyone else's test-session
// status now comes entirely from their own account, with no toggle and no
// way to end up in the wrong state by accident.
const HEADER_ALLOWED_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'CORPORATE_ADMIN']);

/**
 * Decides whether the current request is a "test session" - replaces the
 * old TestSessionMiddleware, which only had the raw X-Test-Session header
 * to go on since middleware runs before the JWT is verified. This runs as
 * a global interceptor instead, which executes after Guards (including
 * JwtAuthGuard) have already resolved and verified req.user - see
 * https://docs.nestjs.com/faq/request-lifecycle - so it can make the
 * actual decision this feature always needed to make:
 *
 *   - req.user.isTestUser (verified fresh from the DB every request by
 *     JwtStrategy, see jwt.strategy.ts) - a dedicated test account.
 *     ALWAYS a test session. No opt-out, no header needed.
 *   - req.user.previewMode (a JWT-only claim set exclusively by
 *     previewLoginAsRole/previewLoginAsUser, see auth.service.ts) -
 *     Preview-as-Role sessions stay fully tagged and purgeable without
 *     touching the previewed user's own real isTestUser flag.
 *   - X-Test-Session header, but ONLY honored for SUPER_ADMIN/ADMIN/
 *     CORPORATE_ADMIN - kept purely as an escape hatch for direct
 *     API-level debugging by trusted roles, not exposed anywhere in the
 *     product UI.
 *
 * Every other real user: always false, unconditionally - the header does
 * nothing for them even if sent, so there is no way for a real user's
 * work to accidentally end up test-tagged, and no way for a test
 * account's work to accidentally end up real.
 */
@Injectable()
export class TestSessionInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    const isDedicatedTestUser = user?.isTestUser === true;
    const isPreviewSession = user?.previewMode === true;
    const headerRequested = req.headers['x-test-session'] === 'true';
    const headerAllowedForThisRole = !!user?.role && HEADER_ALLOWED_ROLES.has(user.role);

    const isTestSession = isDedicatedTestUser || isPreviewSession || (headerRequested && headerAllowedForThisRole);

    return new Observable((subscriber) => {
      testSessionStorage.run({ isTestSession }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
