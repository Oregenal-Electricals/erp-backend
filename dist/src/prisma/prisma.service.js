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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const test_session_context_1 = require("../common/context/test-session.context");
const MODELS_WITH_TEST_DATA_FIELD = new Set(client_1.Prisma.dmmf.datamodel.models
    .filter((m) => m.fields.some((f) => f.name === 'isTestData'))
    .map((m) => m.name.charAt(0).toLowerCase() + m.name.slice(1)));
const CREATE_METHODS = ['create', 'createMany', 'createManyAndReturn', 'upsert'];
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super({
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']
                : ['error'],
        });
        this.logger = new common_1.Logger(PrismaService_1.name);
    }
    async onModuleInit() {
        await this.$connect();
        this.logger.log('Database connected');
        try {
            this.installTestDataAutoTagging();
        }
        catch (e) {
            this.logger.error('Failed to install test-data auto-tagging - continuing without it', e);
        }
    }
    installTestDataAutoTagging() {
        for (const modelProp of MODELS_WITH_TEST_DATA_FIELD) {
            const delegate = this[modelProp];
            if (!delegate)
                continue;
            for (const method of CREATE_METHODS) {
                if (typeof delegate[method] !== 'function')
                    continue;
                const original = delegate[method].bind(delegate);
                delegate[method] = (args) => {
                    if ((0, test_session_context_1.isTestSessionActive)() && args) {
                        if (method === 'upsert' && args.create) {
                            args.create.isTestData = true;
                        }
                        else if (method === 'createMany' || method === 'createManyAndReturn') {
                            if (Array.isArray(args.data)) {
                                args.data = args.data.map((d) => (Object.assign(Object.assign({}, d), { isTestData: true })));
                            }
                            else if (args.data) {
                                args.data.isTestData = true;
                            }
                        }
                        else if (args.data) {
                            args.data.isTestData = true;
                        }
                    }
                    return original(args);
                };
            }
        }
        this.logger.log(`Test-data auto-tagging installed on ${MODELS_WITH_TEST_DATA_FIELD.size} models`);
    }
    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('Database disconnected');
    }
    async healthCheck() {
        try {
            await this.$queryRaw `SELECT 1`;
            return true;
        }
        catch (_a) {
            return false;
        }
    }
    async cleanDatabase() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('cleanDatabase not allowed in production');
        }
        const tablenames = await this.$queryRaw `
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;
        for (const { tablename } of tablenames) {
            if (tablename !== '_prisma_migrations') {
                await this.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
            }
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map