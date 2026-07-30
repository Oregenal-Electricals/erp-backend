"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestSessionMiddleware = void 0;
const common_1 = require("@nestjs/common");
const test_session_context_1 = require("../context/test-session.context");
let TestSessionMiddleware = class TestSessionMiddleware {
    use(req, res, next) {
        const isTestSession = req.headers['x-test-session'] === 'true';
        test_session_context_1.testSessionStorage.run({ isTestSession }, () => next());
    }
};
exports.TestSessionMiddleware = TestSessionMiddleware;
exports.TestSessionMiddleware = TestSessionMiddleware = __decorate([
    (0, common_1.Injectable)()
], TestSessionMiddleware);
//# sourceMappingURL=test-session.middleware.js.map