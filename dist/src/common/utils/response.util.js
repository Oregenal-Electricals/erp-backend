"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.paginatedResponse = paginatedResponse;
function successResponse(data, message = 'Success', meta) {
    return Object.assign(Object.assign({ success: true, message,
        data }, (meta && { meta })), { timestamp: new Date().toISOString() });
}
function paginatedResponse(data, total, page, limit, message = 'Success') {
    return {
        success: true,
        message,
        data,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
        },
        timestamp: new Date().toISOString(),
    };
}
//# sourceMappingURL=response.util.js.map