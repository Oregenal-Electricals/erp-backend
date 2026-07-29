export declare function successResponse(data: any, message?: string, meta?: any): {
    timestamp: string;
    meta: any;
    success: boolean;
    message: string;
    data: any;
};
export declare function paginatedResponse(data: any[], total: number, page: number, limit: number, message?: string): {
    success: boolean;
    message: string;
    data: any[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    timestamp: string;
};
