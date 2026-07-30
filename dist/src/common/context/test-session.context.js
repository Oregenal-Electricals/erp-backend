"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testSessionStorage = void 0;
exports.isTestSessionActive = isTestSessionActive;
const async_hooks_1 = require("async_hooks");
exports.testSessionStorage = new async_hooks_1.AsyncLocalStorage();
function isTestSessionActive() {
    var _a;
    return ((_a = exports.testSessionStorage.getStore()) === null || _a === void 0 ? void 0 : _a.isTestSession) === true;
}
//# sourceMappingURL=test-session.context.js.map