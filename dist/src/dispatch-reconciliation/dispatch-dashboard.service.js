"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchDashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DispatchDashboardService = class DispatchDashboardService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboard(user) {
        const companyId = user.companyId;
        const [plansPending, reservationsPending, pickingPending, documentsPending, vehiclePending, loadingPending, readyForGateOut, gateOutPending, partiallyDispatched, reconciliationExceptions,] = await Promise.all([
            this.prisma.dispatchPlan.count({ where: { companyId, status: 'DRAFT' } }),
            this.prisma.dispatchReservation.count({ where: { companyId, status: 'ACTIVE' } }),
            this.prisma.pickList.count({ where: { dispatchPlan: { companyId }, status: { in: ['DRAFT', 'PARTIALLY_PICKED'] } } }),
            this.prisma.dispatchPlan.count({ where: { companyId, status: 'APPROVED' } }),
            this.prisma.dispatchTransportAssignment.count({ where: { companyId, status: 'DRAFT' } }),
            this.prisma.dispatchLoading.count({ where: { transportAssignment: { companyId }, status: { in: ['IN_PROGRESS', 'PARTIALLY_LOADED'] } } }),
            this.prisma.dispatchConfirmation.count({ where: { companyId, status: 'READY_FOR_GATE_OUT' } }),
            this.prisma.dispatchConfirmation.count({ where: { companyId, status: { in: ['PENDING_CONFIRMATION', 'PARTIALLY_CONFIRMED'] } } }),
            this.prisma.salesOrder.count({ where: { companyId, status: 'PARTIALLY_DISPATCHED' } }),
            this.prisma.dispatchLoadingItem.count({ where: { loading: { transportAssignment: { companyId } }, status: 'EXCEPTION' } }),
        ]);
        return {
            dispatchOrdersPending: plansPending,
            stockReservationPending: reservationsPending,
            pickingPending,
            documentsPending,
            vehiclePending,
            loadingPending,
            readyForGateOut,
            gateOutPending,
            partiallyDispatched,
            reconciliationExceptions,
        };
    }
};
exports.DispatchDashboardService = DispatchDashboardService;
exports.DispatchDashboardService = DispatchDashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DispatchDashboardService);
//# sourceMappingURL=dispatch-dashboard.service.js.map