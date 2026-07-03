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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../common/services/audit.service");
let DocumentsService = class DocumentsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async generateNumber(companyId) {
        const count = await this.prisma.document.count({ where: { companyId } });
        const year = new Date().getFullYear();
        return `DOC-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    detectFileType(mimeType) {
        if (mimeType.includes('pdf'))
            return 'PDF';
        if (mimeType.includes('image'))
            return 'IMAGE';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet'))
            return 'EXCEL';
        if (mimeType.includes('word') || mimeType.includes('document'))
            return 'WORD';
        return 'OTHER';
    }
    async create(dto, user) {
        const MAX_SIZE = 10 * 1024 * 1024;
        if (dto.fileSize > MAX_SIZE)
            throw new common_1.BadRequestException('File size exceeds 10MB limit');
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
        await this.audit.log({ tableName: 'documents', recordId: doc.id, action: 'CREATE', newValues: Object.assign(Object.assign({}, doc), { fileData: '[BASE64]' }), changedBy: user.id });
        return this.sanitize(doc);
    }
    async createVersion(dto, user) {
        const parent = await this.prisma.document.findFirst({ where: { id: dto.parentDocId, companyId: user.companyId } });
        if (!parent)
            throw new common_1.NotFoundException('Parent document not found');
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
                version: ((latestVersion === null || latestVersion === void 0 ? void 0 : latestVersion.version) || 1) + 1,
                parentDocId: dto.parentDocId,
                referenceType: parent.referenceType, referenceId: parent.referenceId,
                referenceNumber: parent.referenceNumber,
                tags: dto.tags || parent.tags, description: dto.description || parent.description,
                companyId: user.companyId, createdBy: user.id, updatedBy: user.id,
            },
        });
        await this.audit.log({ tableName: 'documents', recordId: doc.id, action: 'CREATE', newValues: Object.assign(Object.assign({}, doc), { fileData: '[BASE64]' }), changedBy: user.id });
        return this.sanitize(doc);
    }
    async findAll(user, query) {
        const { page = 1, limit = 20, search, category, fileType, referenceType, referenceId } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = { companyId: user.companyId, isActive: true, parentDocId: null };
        if (search)
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { documentNumber: { contains: search, mode: 'insensitive' } },
                { fileName: { contains: search, mode: 'insensitive' } },
                { tags: { contains: search, mode: 'insensitive' } },
                { referenceNumber: { contains: search, mode: 'insensitive' } },
            ];
        if (category)
            where.category = category;
        if (fileType)
            where.fileType = fileType;
        if (referenceType)
            where.referenceType = referenceType;
        if (referenceId)
            where.referenceId = referenceId;
        const [data, total] = await Promise.all([
            this.prisma.document.findMany({
                where, skip, take: Number(limit), orderBy: { createdAt: 'desc' },
                select: { id: true, documentNumber: true, title: true, category: true, fileType: true, fileName: true, fileSize: true, mimeType: true, version: true, referenceType: true, referenceNumber: true, tags: true, description: true, createdAt: true, createdBy: true, _count: { select: { versions: true } } },
            }),
            this.prisma.document.count({ where }),
        ]);
        return { data, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) };
    }
    async findOne(id, user) {
        const doc = await this.prisma.document.findFirst({
            where: { id, companyId: user.companyId },
            include: { versions: { select: { id: true, documentNumber: true, version: true, fileName: true, fileSize: true, createdAt: true, createdBy: true }, orderBy: { version: 'desc' } } },
        });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        return this.sanitize(doc);
    }
    async download(id, user) {
        const doc = await this.prisma.document.findFirst({ where: { id, companyId: user.companyId } });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        await this.audit.log({ tableName: 'documents', recordId: id, action: 'VIEW', changedBy: user.id });
        return { fileData: doc.fileData, fileName: doc.fileName, mimeType: doc.mimeType };
    }
    async delete(id, user) {
        const doc = await this.prisma.document.findFirst({ where: { id, companyId: user.companyId } });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        await this.prisma.document.update({ where: { id }, data: { isActive: false, updatedBy: user.id } });
        await this.audit.log({ tableName: 'documents', recordId: id, action: 'DELETE', changedBy: user.id });
        return { message: 'Document deleted' };
    }
    async getStats(user) {
        const where = { companyId: user.companyId, isActive: true };
        const [total, byCategory, totalSize] = await Promise.all([
            this.prisma.document.count({ where }),
            this.prisma.document.groupBy({ by: ['category'], where, _count: { id: true } }),
            this.prisma.document.aggregate({ where, _sum: { fileSize: true } }),
        ]);
        return { total, byCategory, totalSizeBytes: totalSize._sum.fileSize || 0, totalSizeMB: Math.round((totalSize._sum.fileSize || 0) / 1024 / 1024 * 100) / 100 };
    }
    sanitize(doc) {
        const { fileData } = doc, rest = __rest(doc, ["fileData"]);
        return rest;
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, audit_service_1.AuditService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map