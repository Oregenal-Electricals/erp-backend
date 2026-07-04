import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';

@Injectable()
export class CapaAutomationService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  // Auto-create CAPA from NCR when severity is CRITICAL or MAJOR
  async autoCreateFromNcr(ncrId: string, user: any) {
    const ncr = await this.prisma.ncrRecord.findFirst({ where: { id: ncrId, companyId: user.companyId } });
    if (!ncr) return { created: false, reason: 'NCR not found' };
    if (!['CRITICAL', 'MAJOR'].includes(ncr.severity)) return { created: false, reason: 'Severity below threshold — CAPA not required' };

    // Check if CAPA already exists for this NCR
    const existing = await this.prisma.capaRecord.findFirst({ where: { ncrId, companyId: user.companyId } });
    if (existing) return { created: false, reason: 'CAPA already exists', capaId: existing.id, capaNumber: existing.capaNumber };

    // Generate CAPA number
    const count = await this.prisma.capaRecord.count({ where: { companyId: user.companyId } });
    const year = new Date().getFullYear();
    const capaNumber = `CAPA-${year}-${String(count + 1).padStart(4, '0')}`;

    // Auto-set due date: CRITICAL=7 days, MAJOR=14 days
    const daysToAdd = ncr.severity === 'CRITICAL' ? 7 : 14;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysToAdd);

    const capa = await this.prisma.capaRecord.create({
      data: {
        capaNumber, ncrId, companyId: user.companyId,
        correctiveAction: `Auto-generated from NCR ${ncr.ncrNumber}. Please update with actual corrective action.`,
        preventiveAction: `To be determined after root cause analysis of NCR ${ncr.ncrNumber}.`,
        assignedTo: user.id, dueDate,
        remarks: `Auto-created from ${ncr.severity} NCR ${ncr.ncrNumber} — ${ncr.description?.substring(0, 100) || ''}`,
        createdBy: user.id, updatedBy: user.id,
      },
    });

    // Update NCR status to CAPA_PENDING
    await this.prisma.ncrRecord.update({
      where: { id: ncrId },
      data: { status: 'CAPA_PENDING', updatedBy: user.id },
    });

    await this.audit.log({ tableName: 'capa_records', recordId: capa.id, action: 'CREATE', newValues: { ...capa, source: 'AUTO' }, changedBy: user.id });
    return { created: true, capaId: capa.id, capaNumber, dueDate, message: `CAPA ${capaNumber} auto-created from NCR ${ncr.ncrNumber}` };
  }

  // Check all CAPAs for escalation needs
  async checkEscalations(companyId: string) {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 86400000);

    const [overdue, approaching, unactioned] = await Promise.all([
      // Overdue CAPAs
      this.prisma.capaRecord.findMany({
        where: { companyId, status: { notIn: ['COMPLETED', 'VERIFIED'] }, dueDate: { lt: now } },
        include: { ncr: { select: { ncrNumber: true, severity: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      // Approaching due date (3 days)
      this.prisma.capaRecord.findMany({
        where: { companyId, status: { notIn: ['COMPLETED', 'VERIFIED'] }, dueDate: { gte: now, lte: threeDaysFromNow } },
        include: { ncr: { select: { ncrNumber: true, severity: true } } },
        orderBy: { dueDate: 'asc' },
      }),
      // Unactioned for 48h (still ASSIGNED)
      this.prisma.capaRecord.findMany({
        where: { companyId, status: 'ASSIGNED', createdAt: { lt: new Date(now.getTime() - 48 * 3600000) } },
        include: { ncr: { select: { ncrNumber: true } } },
      }),
    ]);

    return {
      overdue: overdue.map(c => ({ id: c.id, capaNumber: c.capaNumber, dueDate: c.dueDate, assignedTo: c.assignedTo, ncrNumber: c.ncr?.ncrNumber, daysOverdue: Math.floor((now.getTime() - new Date(c.dueDate).getTime()) / 86400000) })),
      approaching: approaching.map(c => ({ id: c.id, capaNumber: c.capaNumber, dueDate: c.dueDate, assignedTo: c.assignedTo, ncrNumber: c.ncr?.ncrNumber, daysRemaining: Math.ceil((new Date(c.dueDate).getTime() - now.getTime()) / 86400000) })),
      unactioned: unactioned.map(c => ({ id: c.id, capaNumber: c.capaNumber, assignedTo: c.assignedTo, ncrNumber: c.ncr?.ncrNumber, hoursUnactioned: Math.floor((now.getTime() - new Date(c.createdAt).getTime()) / 3600000) })),
      summary: { overdueCount: overdue.length, approachingCount: approaching.length, unactionedCount: unactioned.length },
    };
  }

  // Check CAPA effectiveness - did the same NCR source recur after CAPA was verified?
  async checkEffectiveness(capaId: string, user: any) {
    const capa = await this.prisma.capaRecord.findFirst({
      where: { id: capaId, companyId: user.companyId },
      include: { ncr: true },
    });
    if (!capa) return { error: 'CAPA not found' };
    if (capa.status !== 'VERIFIED') return { effective: null, reason: 'CAPA not yet verified' };

    // Check for recurring NCRs from same source after CAPA verification
    const verifiedDate = capa.verifiedDate || capa.updatedAt;
    const recurringNcrs = await this.prisma.ncrRecord.findMany({
      where: {
        companyId: user.companyId,
        source: capa.ncr?.source,
        itemCode: capa.ncr?.itemCode || undefined,
        detectedDate: { gt: verifiedDate },
        id: { not: capa.ncrId },
      },
      select: { ncrNumber: true, detectedDate: true, severity: true, source: true },
    });

    const effective = recurringNcrs.length === 0;
    return {
      capaId, capaNumber: capa.capaNumber,
      ncrSource: capa.ncr?.source, ncrItem: capa.ncr?.itemName,
      verifiedDate, effective,
      recurringNcrs: recurringNcrs.length,
      recurringDetails: recurringNcrs,
      message: effective ? 'CAPA is effective — no recurring NCRs from same source' : `CAPA may be ineffective — ${recurringNcrs.length} recurring NCR(s) found`,
    };
  }

  // Get CAPA health score for company
  async getHealthScore(companyId: string) {
    const now = new Date();
    const [total, completed, verified, overdue, critical] = await Promise.all([
      this.prisma.capaRecord.count({ where: { companyId } }),
      this.prisma.capaRecord.count({ where: { companyId, status: 'COMPLETED' } }),
      this.prisma.capaRecord.count({ where: { companyId, status: 'VERIFIED' } }),
      this.prisma.capaRecord.count({ where: { companyId, status: { notIn: ['COMPLETED','VERIFIED'] }, dueDate: { lt: now } } }),
      this.prisma.capaRecord.count({ where: { companyId, ncr: { severity: 'CRITICAL' } } }),
    ]);

    const completionRate = total > 0 ? Math.round((completed + verified) / total * 100) : 100;
    const overdueRate = total > 0 ? Math.round(overdue / total * 100) : 0;
    const healthScore = Math.max(0, completionRate - overdueRate * 2);

    return { total, completed, verified, overdue, critical, completionRate, overdueRate, healthScore, grade: healthScore >= 80 ? 'A' : healthScore >= 60 ? 'B' : healthScore >= 40 ? 'C' : 'D' };
  }
}
