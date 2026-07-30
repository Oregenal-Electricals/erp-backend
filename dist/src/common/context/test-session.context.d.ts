import { AsyncLocalStorage } from 'async_hooks';
interface TestSessionStore {
    isTestSession: boolean;
}
export declare const testSessionStorage: AsyncLocalStorage<TestSessionStore>;
export declare function isTestSessionActive(): boolean;
export {};
