"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestSessionInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const test_session_context_1 = require("../context/test-session.context");
const HEADER_ALLOWED_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'CORPORATE_ADMIN']);
let TestSessionInterceptor = class TestSessionInterceptor {
    intercept(context, next) {
        const req = context.switchToHttp().getRequest();
        const user = req.user;
        const isDedicatedTestUser = (user === null || user === void 0 ? void 0 : user.isTestUser) === true;
        const isPreviewSession = (user === null || user === void 0 ? void 0 : user.previewMode) === true;
        const headerRequested = req.headers['x-test-session'] === 'true';
        const headerAllowedForThisRole = !!(user === null || user === void 0 ? void 0 : user.role) && HEADER_ALLOWED_ROLES.has(user.role);
        const isTestSession = isDedicatedTestUser || isPreviewSession || (headerRequested && headerAllowedForThisRole);
        return new rxjs_1.Observable((subscriber) => {
            test_session_context_1.testSessionStorage.run({ isTestSession }, () => {
                next.handle().subscribe(subscriber);
            });
        });
    }
};
exports.TestSessionInterceptor = TestSessionInterceptor;
exports.TestSessionInterceptor = TestSessionInterceptor = __decorate([
    (0, common_1.Injectable)()
], TestSessionInterceptor);
//# sourceMappingURL=test-session.interceptor.js.map