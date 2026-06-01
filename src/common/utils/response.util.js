"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.paginatedResponse = paginatedResponse;
function successResponse(data, message, meta) {
    if (message === void 0) { message = 'Success'; }
    return __assign(__assign({ success: true, message: message, data: data }, (meta && { meta: meta })), { timestamp: new Date().toISOString() });
}
function paginatedResponse(data, total, page, limit, message) {
    if (message === void 0) { message = 'Success'; }
    return {
        success: true,
        message: message,
        data: data,
        meta: {
            total: total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
    };
}
