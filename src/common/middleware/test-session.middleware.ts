import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { testSessionStorage } from '../context/test-session.context';

/**
 * A request carrying header `X-Test-Session: true` has every record it
 * creates (across every module, no matter how deeply nested the service
 * calls) automatically stamped isTestData: true by PrismaService's
 * Client Extension - see prisma.service.ts.
 *
 * This is the ONLY thing that turns a request into a "test session" -
 * curl sets the header directly; the frontend's Test Mode toggle sets it
 * via an interceptor on every request it sends while enabled.
 *
 * Completely inert for every normal request: no header means
 * isTestSession stays false, and PrismaService's extension does nothing
 * different from stock Prisma behavior.
 */
@Injectable()
export class TestSessionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const isTestSession = req.headers['x-test-session'] === 'true';
    testSessionStorage.run({ isTestSession }, () => next());
  }
}
