"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaginationParams = getPaginationParams;
function getPaginationParams(query) {
    var page = Math.max(1, query.page || 1);
    var limit = Math.min(100, Math.max(1, query.limit || 10));
    var skip = (page - 1) * limit;
    return { page: page, limit: limit, skip: skip };
}
