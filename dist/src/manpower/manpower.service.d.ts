import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateManpowerAllocationDto, DistributeManpowerDto, RaiseManpowerQueryDto, ResolveManpowerQueryDto } from './dto/manpower.dto';
export declare class ManpowerService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private includes;
    create(dto: CreateManpowerAllocationDto, user: any): Promise<{
        workOrder: {
            id: string;
            stageName: string;
            productName: string;
            woNumber: string;
        };
        fromUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        toUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        queries: ({
            raisedBy: {
                firstName: string;
                lastName: string;
            };
            raisedTo: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            allocationId: string;
            message: string;
            response: string | null;
            raisedByUserId: string;
            raisedToUserId: string;
        })[];
    } & {
        level: string;
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        category: string | null;
        remarks: string | null;
        date: Date;
        parentId: string | null;
        count: number;
        workOrderId: string | null;
        toUserId: string | null;
        fromUserId: string;
    }>;
    accept(id: string, user: any): Promise<{
        workOrder: {
            id: string;
            stageName: string;
            productName: string;
            woNumber: string;
        };
        fromUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        toUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        queries: ({
            raisedBy: {
                firstName: string;
                lastName: string;
            };
            raisedTo: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            allocationId: string;
            message: string;
            response: string | null;
            raisedByUserId: string;
            raisedToUserId: string;
        })[];
    } & {
        level: string;
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        category: string | null;
        remarks: string | null;
        date: Date;
        parentId: string | null;
        count: number;
        workOrderId: string | null;
        toUserId: string | null;
        fromUserId: string;
    }>;
    distribute(dto: DistributeManpowerDto, user: any): Promise<{
        children: any[];
        distributedTotal: any;
        parentCount: number;
        difference: number;
    }>;
    findAll(user: any, query: any): Promise<({
        workOrder: {
            id: string;
            stageName: string;
            productName: string;
            woNumber: string;
        };
        fromUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        toUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        queries: ({
            raisedBy: {
                firstName: string;
                lastName: string;
            };
            raisedTo: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            allocationId: string;
            message: string;
            response: string | null;
            raisedByUserId: string;
            raisedToUserId: string;
        })[];
    } & {
        level: string;
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        category: string | null;
        remarks: string | null;
        date: Date;
        parentId: string | null;
        count: number;
        workOrderId: string | null;
        toUserId: string | null;
        fromUserId: string;
    })[]>;
    findOne(id: string, user: any): Promise<{
        workOrder: {
            id: string;
            stageName: string;
            productName: string;
            woNumber: string;
        };
        children: ({
            workOrder: {
                id: string;
                stageName: string;
                productName: string;
                woNumber: string;
            };
            fromUser: {
                role: string;
                id: string;
                firstName: string;
                lastName: string;
            };
            toUser: {
                role: string;
                id: string;
                firstName: string;
                lastName: string;
            };
            queries: ({
                raisedBy: {
                    firstName: string;
                    lastName: string;
                };
                raisedTo: {
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                companyId: string;
                isActive: boolean;
                isTestData: boolean;
                createdAt: Date;
                updatedAt: Date;
                createdBy: string | null;
                updatedBy: string | null;
                status: string;
                allocationId: string;
                message: string;
                response: string | null;
                raisedByUserId: string;
                raisedToUserId: string;
            })[];
        } & {
            level: string;
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            category: string | null;
            remarks: string | null;
            date: Date;
            parentId: string | null;
            count: number;
            workOrderId: string | null;
            toUserId: string | null;
            fromUserId: string;
        })[];
        fromUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        toUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        queries: ({
            raisedBy: {
                firstName: string;
                lastName: string;
            };
            raisedTo: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            allocationId: string;
            message: string;
            response: string | null;
            raisedByUserId: string;
            raisedToUserId: string;
        })[];
    } & {
        level: string;
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        category: string | null;
        remarks: string | null;
        date: Date;
        parentId: string | null;
        count: number;
        workOrderId: string | null;
        toUserId: string | null;
        fromUserId: string;
    }>;
    getChain(rootId: string, user: any): Promise<{
        workOrder: {
            id: string;
            stageName: string;
            productName: string;
            woNumber: string;
        };
        fromUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        toUser: {
            role: string;
            id: string;
            firstName: string;
            lastName: string;
        };
        queries: ({
            raisedBy: {
                firstName: string;
                lastName: string;
            };
            raisedTo: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            companyId: string;
            isActive: boolean;
            isTestData: boolean;
            createdAt: Date;
            updatedAt: Date;
            createdBy: string | null;
            updatedBy: string | null;
            status: string;
            allocationId: string;
            message: string;
            response: string | null;
            raisedByUserId: string;
            raisedToUserId: string;
        })[];
    } & {
        level: string;
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        category: string | null;
        remarks: string | null;
        date: Date;
        parentId: string | null;
        count: number;
        workOrderId: string | null;
        toUserId: string | null;
        fromUserId: string;
    }>;
    raiseQuery(dto: RaiseManpowerQueryDto, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        allocationId: string;
        message: string;
        response: string | null;
        raisedByUserId: string;
        raisedToUserId: string;
    }>;
    resolveQuery(id: string, dto: ResolveManpowerQueryDto, user: any): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        isTestData: boolean;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        status: string;
        allocationId: string;
        message: string;
        response: string | null;
        raisedByUserId: string;
        raisedToUserId: string;
    }>;
}
