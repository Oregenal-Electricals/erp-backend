import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { CreateDocumentDto, NewVersionDto } from './dto/document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  private async generateNumber(companyId: string): Promise<string> {
    const count = await this.prisma.document.count({ where: { companyId } });
    const year = new Date().getFullYear();
    return `DOC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private detectFileType(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('image')) return 'IMAGE';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'EXCEL';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'WORD';
    return 'OTHER';
  }

  async create(dto: CreateDocumentDto, user: any) {
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (dto.fileSize > MAX_SIZE) throw new BadRequestException('File size exceeds 10MB limit');

    const documentNumber = await this.generateNumber(user.companyId);
    const fileType = dto.fileType || this.detectFileType(dto.mimeType);

    const doc = await this.prisma.document.create({
      data: {
        documentNumber, title: dto.title, category: dto.category || 'GENERAL',
        fileType, fileName: dto.fileName, fileSize: dto.fileSize,
        fileData: dto.fileData, mimeType: dto.mimeType, version: 1,
        referenceType: dto.referenceType, referenceId: dto.referenceId,
        referenceNumber: dto.referenceNumber, tags: dto.tags, description: dto.description,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
    });
    await this.audit.log({ tableName: 'documents', recordId: doc.id, action: 'CREATE', newValues: { ...doc, fileData: '[BASE64]' }, changedBy: user.id });
    return this.sanitize(doc);
  }

  async createVersion(dto: NewVersionDto, user: any) {
    const parent = await this.prisma.document.findFirst({ where: { id: dto.parentDocId, companyId: user.companyId } });
    if (!parent) throw new NotFoundException('Parent document not found');

    // Get latest version number
    const latestVersion = await this.prisma.document.findFirst({
      where: { companyId: user.companyId, OR: [{ id: dto.parentDocId }, { parentDocId: dto.parentDocId }] },
      orderBy: { version: 'desc' },
    });

    const documentNumber = await this.generateNumber(user.companyId);
    const fileType = dto.fileType || this.detectFileType(dto.mimeType);

    const doc = await this.prisma.document.create({
      data: {
        documentNumber, title: dto.title || parent.title,
        category: parent.category, fileType,
        fileName: dto.fileName, fileSize: dto.fileSize,
        fileData: dto.fileData, mimeType: dto.mimeType,
        version: (latestVersion?.version || 1) + 1,
        parentDocId: dto.parentDocId,
        referenceType: parent.referenceType, referenceId: parent.referenceId,
        referenceNumber: parent.referenceNumber,
        tags: dto.tags || parent.tags, description: dto.description || parent.description,
        companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
      },
    });
    await this.audit.log({ tableName: 'documents', recordId: doc.id, action: 'CREATE', newValues: { ...doc, fileData: '[BASE64]' }, changedBy: user.id });
    return this.sanitize(doc);
  }

  async findAll(user: any, query: any) {
    const { page = 1, limit = 20, search, category, fileType, referenceType, referenceId } = query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { companyId: user.companyId, isActive: true, parentDocId: null }; // only show root docs
    if (search) where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { documentNumber: { contains: search, mode: 'insensitive' } },
      { fileName: { contains: search, mode: 'insensitive' } },
      { tags: { contains: search, mode: 'insensitive' } },
      { referenceNumber: { contains: search, mode: 'insensitive' } },
    ];
    if (category) where.category = category;
    if (fileType) where.fileType = fileType;
    if (referenceType) where.referenceType = referenceType;
    if (referenceId) where.referenceId = referenceId;

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
        select: { id: true, documentNumber: true, title: true, category: true, fileType: true, fileName: true, fileSize: true, mimeType: true, version: true, referenceType: true, referenceNumber: true, tags: true, description: true, createdAt: true, createdBy: true, _count: { select: { versions: true } } },
      }),
      this.prisma.document.count({ where }),
    ]);
    return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
  }

  async findOne(id: string, user: any) {
    const doc = await this.prisma.document.findFirst({
      where: { id, companyId: user.companyId },
      include: { versions: { select: { id: true, documentNumber: true, version: true, fileName: true, fileSize: true, createdAt: true, createdBy: true }, orderBy: { version: 'desc' } } },
    });
    if (!doc) throw new NotFoundException('Document not found');
    return this.sanitize(doc);
  }

  async download(id: string, user: any) {
    const doc = await this.prisma.document.findFirst({ where: { id, companyId: user.companyId } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.audit.log({ tableName: 'documents', recordId: id, action: 'VIEW', changedBy: user.id });
    return { fileData: doc.fileData, fileName: doc.fileName, mimeType: doc.mimeType };
  }

  async delete(id: string, user: any) {
    const doc = await this.prisma.document.findFirst({ where: { id, companyId: user.companyId } });
    if (!doc) throw new NotFoundException('Document not found');
    await this.prisma.document.update({ where: { id }, data: { isActive: false, updatedBy: user.id } });
    await this.audit.log({ tableName: 'documents', recordId: id, action: 'DELETE', changedBy: user.id });
    return { message: 'Document deleted' };
  }

  async getStats(user: any) {
    const where: any = { companyId: user.companyId, isActive: true };
    const [total, byCategory, totalSize] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.groupBy({ by: ['category'], where, _count: { id: true } }),
      this.prisma.document.aggregate({ where, _sum: { fileSize: true } }),
    ]);
    return { total, byCategory, totalSizeBytes: totalSize._sum.fileSize || 0, totalSizeMB: Math.round((totalSize._sum.fileSize || 0) / 1024 / 1024 * 100) / 100 };
  }

  private sanitize(doc: any) {
    const { fileData, ...rest } = doc;
    return rest;
  }
}
