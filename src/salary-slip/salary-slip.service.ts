import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function numberToWords(num: number): string {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  const n = Math.floor(num);
  if (n === 0) return 'Zero';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
  if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' '+numberToWords(n%100) : '');
  if (n < 100000) return numberToWords(Math.floor(n/1000)) + ' Thousand' + (n%1000 ? ' '+numberToWords(n%1000) : '');
  if (n < 10000000) return numberToWords(Math.floor(n/100000)) + ' Lakh' + (n%100000 ? ' '+numberToWords(n%100000) : '');
  return numberToWords(Math.floor(n/10000000)) + ' Crore' + (n%10000000 ? ' '+numberToWords(n%10000000) : '');
}

@Injectable()
export class SalarySlipService {
  constructor(private prisma: PrismaService) {}

  async generateSlip(employeeId: string, month: number, year: number, companyId: string): Promise<Buffer> {
    const entry = await this.prisma.payrollEntry.findFirst({
      where: { companyId, employeeId, month, year },
      include: {
        employee: {
          include: {
            department: { select: { name: true } },
            designation: { select: { name: true } },
          },
        },
        payrollRun: { select: { runNumber: true, status: true } },
      },
    });
    if (!entry) throw new NotFoundException(`No payroll entry found for employee ${employeeId} for ${month}/${year}`);

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });
    return this.buildPdf(entry, company);
  }

  async generateBulkSlips(payrollRunId: string, companyId: string): Promise<Buffer> {
    const run = await this.prisma.payrollRun.findFirst({
      where: { id: payrollRunId, companyId },
      include: {
        entries: {
          include: {
            employee: {
              include: {
                department: { select: { name: true } },
                designation: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    if (!run) throw new NotFoundException('Payroll run not found');
    if (!run.entries.length) throw new NotFoundException('No entries in this payroll run');

    const company = await this.prisma.company.findUnique({ where: { id: companyId } });

    // Generate all slips as one merged PDF
    const doc = new PDFDocument({ margin: 40, size: 'A4', autoFirstPage: false });
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));

    for (const entry of run.entries) {
      doc.addPage();
      await this.renderSlipPage(doc, { ...entry, payrollRun: { runNumber: run.runNumber, status: run.status } }, company);
    }

    doc.end();
    return new Promise(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));
  }

  private async buildPdf(entry: any, company: any): Promise<Buffer> {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    await this.renderSlipPage(doc, entry, company);
    doc.end();
    return new Promise(resolve => doc.on('end', () => resolve(Buffer.concat(chunks))));
  }

  private async renderSlipPage(doc: any, entry: any, company: any) {
    const emp = entry.employee;
    const fmtAmt = (n: number) => `Rs.${Number(n||0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    const monthName = MONTHS[entry.month - 1];

    // ── Header ────────────────────────────────────────────────────────────────
    doc.rect(40, 40, 515, 70).fillColor('#1e40af').fill();
    doc.fontSize(16).font('Helvetica-Bold').fillColor('#ffffff')
       .text(company?.name || 'Acme Electronics Pvt Ltd', 55, 52);
    doc.fontSize(9).font('Helvetica').fillColor('#bfdbfe')
       .text(`GSTIN: ${company?.gstin || 'XXXXXXXXXXXX'} | ${company?.address || ''}`, 55, 72);
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#ffffff')
       .text(`SALARY SLIP — ${monthName.toUpperCase()} ${entry.year}`, 55, 88, { align: 'right', width: 490 });

    // ── Employee Info ─────────────────────────────────────────────────────────
    let y = 125;
    doc.rect(40, y, 515, 70).strokeColor('#d1d5db').lineWidth(0.5).stroke();
    const col1 = 50, col2 = 305;

    doc.fontSize(8).font('Helvetica-Bold').fillColor('#6b7280');
    const empFields = [
      ['Employee Name', `${emp.firstName} ${emp.lastName}`],
      ['Employee No', emp.employeeNumber],
      ['Department', emp.department?.name || '—'],
      ['Designation', emp.designation?.name || '—'],
    ];
    const empFields2 = [
      ['PF Number', emp.pfNumber || '—'],
      ['PAN Number', emp.panNumber || '—'],
      ['Bank', emp.bankName || '—'],
      ['A/C No', emp.bankAccountNumber ? '****'+emp.bankAccountNumber.slice(-4) : '—'],
    ];

    empFields.forEach(([label, value], i) => {
      doc.font('Helvetica-Bold').fillColor('#6b7280').text(label+':', col1, y+8+i*14, { width: 90 });
      doc.font('Helvetica').fillColor('#111827').text(value, col1+95, y+8+i*14);
    });
    empFields2.forEach(([label, value], i) => {
      doc.font('Helvetica-Bold').fillColor('#6b7280').text(label+':', col2, y+8+i*14, { width: 90 });
      doc.font('Helvetica').fillColor('#111827').text(value, col2+95, y+8+i*14);
    });

    // ── Attendance Info ───────────────────────────────────────────────────────
    y += 80;
    doc.rect(40, y, 515, 22).fillColor('#f3f4f6').fill();
    doc.rect(40, y, 515, 22).strokeColor('#d1d5db').lineWidth(0.5).stroke();
    const attFields = [
      ['Working Days', entry.workingDays],
      ['Present Days', entry.presentDays],
      ['Absent Days', entry.absentDays],
      ['LOP Days', entry.lopDays],
      ['OT Hours', entry.otHours?.toFixed(1)+'h'],
    ];
    attFields.forEach(([label, value], i) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#374151')
         .text(`${label}: `, 50+i*100, y+7, { continued: true })
         .font('Helvetica').fillColor('#111827').text(String(value));
    });

    // ── Earnings & Deductions ─────────────────────────────────────────────────
    y += 30;
    const colMid = 297;

    // Headers
    doc.rect(40, y, 257, 18).fillColor('#1e40af').fill();
    doc.rect(colMid, y, 258, 18).fillColor('#1e40af').fill();
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
       .text('EARNINGS', 50, y+5)
       .text('DEDUCTIONS', colMid+10, y+5);

    y += 18;
    const earnings = [
      ['Basic Salary', entry.basicSalary],
      ['HRA', entry.hraAmount],
      ['Conveyance', entry.conveyanceAmount],
      ['Other Allowances', entry.otherAllowances],
      ['Overtime', entry.otAmount],
    ].filter(([, v]) => Number(v) > 0);

    const deductions = [
      ['PF (Employee)', entry.pfEmployee],
      ['ESI (Employee)', entry.esiEmployee],
      ['TDS', entry.tdsAmount],
      ['Loss of Pay', entry.lopAmount],
      ['Other Deductions', entry.otherDeductions],
    ].filter(([, v]) => Number(v) > 0);

    const maxRows = Math.max(earnings.length, deductions.length, 1);
    const rowH = 18;

    for (let i = 0; i < maxRows; i++) {
      const rowY = y + i * rowH;
      const shade = i % 2 === 0;
      if (shade) {
        doc.rect(40, rowY, 257, rowH).fillColor('#f9fafb').fill();
        doc.rect(colMid, rowY, 258, rowH).fillColor('#f9fafb').fill();
      }
      doc.rect(40, rowY, 257, rowH).strokeColor('#e5e7eb').lineWidth(0.3).stroke();
      doc.rect(colMid, rowY, 258, rowH).strokeColor('#e5e7eb').lineWidth(0.3).stroke();

      if (earnings[i]) {
        doc.fontSize(8).font('Helvetica').fillColor('#374151')
           .text(earnings[i][0], 50, rowY+5, { width: 150 });
        doc.font('Helvetica-Bold').fillColor('#111827')
           .text(fmtAmt(earnings[i][1] as number), 200, rowY+5, { width: 90, align: 'right' });
      }
      if (deductions[i]) {
        doc.fontSize(8).font('Helvetica').fillColor('#374151')
           .text(deductions[i][0], colMid+10, rowY+5, { width: 150 });
        doc.font('Helvetica-Bold').fillColor('#dc2626')
           .text(fmtAmt(deductions[i][1] as number), colMid+160, rowY+5, { width: 90, align: 'right' });
      }
    }

    y += maxRows * rowH;

    // Totals row
    doc.rect(40, y, 257, 20).fillColor('#dbeafe').fill();
    doc.rect(colMid, y, 258, 20).fillColor('#fee2e2').fill();
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e40af')
       .text('Gross Earnings', 50, y+6)
       .text(fmtAmt(entry.grossEarnings), 200, y+6, { width: 90, align: 'right' });
    doc.fillColor('#dc2626')
       .text('Total Deductions', colMid+10, y+6)
       .text(fmtAmt(entry.totalDeductions), colMid+160, y+6, { width: 90, align: 'right' });

    y += 28;

    // ── Net Pay ───────────────────────────────────────────────────────────────
    doc.rect(40, y, 515, 40).fillColor('#1e40af').fill();
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff')
       .text(`NET PAY: ${fmtAmt(entry.netPay)}`, 50, y+6);
    doc.fontSize(8).font('Helvetica').fillColor('#bfdbfe')
       .text(`In Words: ${numberToWords(Math.round(entry.netPay))} Rupees Only`, 50, y+24);

    y += 50;

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.fontSize(7).font('Helvetica').fillColor('#9ca3af')
       .text(`Payroll Run: ${entry.payrollRun?.runNumber || '—'} | Status: ${entry.payrollRun?.status || '—'} | Generated: ${new Date().toLocaleDateString('en-IN')}`, 40, y, { align: 'center', width: 515 });
    doc.text('This is a computer-generated salary slip and does not require a signature.', 40, y+10, { align: 'center', width: 515 });
    doc.moveTo(40, y-10).lineTo(555, y-10).strokeColor('#d1d5db').lineWidth(0.5).stroke();
  }

  async getSlipHistory(companyId: string, employeeId: string) {
    return this.prisma.payrollEntry.findMany({
      where: { companyId, employeeId, status: { not: 'DRAFT' } },
      select: { id: true, month: true, year: true, grossEarnings: true, netPay: true, status: true, payrollRunId: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }
}
