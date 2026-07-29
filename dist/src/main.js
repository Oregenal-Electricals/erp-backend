"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const audit_interceptor_1 = require("./common/interceptors/audit.interceptor");
async function bootstrap() {
    const compression = require('compression');
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('port') || 3001;
    const environment = configService.get('environment');
    const frontendUrl = configService.get('app.frontendUrl');
    app.use((0, helmet_1.default)());
    app.use(compression());
    app.enableCors({
        origin: [frontendUrl, 'http://localhost:3000', /\.vercel\.app$/],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new audit_interceptor_1.LoggingInterceptor());
    if (environment !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('ERP Manufacturing API')
            .setDescription('Smart Manufacturing ERP / MES Platform API')
            .setVersion('1.0.0')
            .addBearerAuth()
            .addServer(`http://localhost:${port}`, 'Local')
            .addServer('https://erp-backend-ry5v.onrender.com', 'Staging')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document, {
            swaggerOptions: { persistAuthorization: true },
        });
        logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
    }
    await app.listen(port);
    logger.log(`Environment: ${environment}`);
    logger.log(`Backend running: http://localhost:${port}`);
    logger.log(`Health check: http://localhost:${port}/api/v1/health`);
}
bootstrap();
//# sourceMappingURL=main.js.map