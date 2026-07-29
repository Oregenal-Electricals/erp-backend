export interface PaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare function getPaginationParams(query: PaginationQuery): {
    page: number;
    limit: number;
    skip: number;
};
