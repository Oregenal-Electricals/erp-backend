import { AsyncLocalStorage } from 'async_hooks';

/**
 * Propagates whether the current request is a "test session" through
 * async call chains (middleware -> controller -> service -> Prisma),
 * without threading an extra parameter through every function signature.
 *
 * Set by TestSessionMiddleware at the very start of the request, read by
 * the Prisma Client extension in PrismaService to decide whether to stamp
 * isTestData: true on records being created. Nothing else should read or
 * write this - it exists purely to connect those two points.
 */
interface TestSessionStore {
  isTestSession: boolean;
}

export const testSessionStorage = new AsyncLocalStorage<TestSessionStore>();

export function isTestSessionActive(): boolean {
  return testSessionStorage.getStore()?.isTestSession === true;
}
