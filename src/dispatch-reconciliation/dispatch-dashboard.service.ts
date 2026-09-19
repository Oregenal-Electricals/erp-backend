import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DispatchDashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(user: any) {
    const companyId = user.companyId;
    const [
      plansPending, reservationsPending, pickingPending, documentsPending,
      vehiclePending, loadingPending, readyForGateOut, gateOutPending,
      partiallyDispatched, reconciliationExceptions,
    ] = await Promise.all([
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
}
