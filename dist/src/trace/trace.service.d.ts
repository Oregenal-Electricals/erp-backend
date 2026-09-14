import { PrismaService } from '../prisma/prisma.service';
export declare class TraceService {
    private prisma;
    constructor(prisma: PrismaService);
    search(query: string, user: any): Promise<any>;
    private traceBatch;
    private traceItem;
}
