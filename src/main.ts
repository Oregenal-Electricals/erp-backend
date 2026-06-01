import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/audit.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3001;
  const environment = configService.get<string>('environment');
  const frontendUrl = configService.get<string>('app.frontendUrl');

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000', /\.vercel\.app$/],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Swagger (only on non-production)
  if (environment !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('ERP Manufacturing API')
      .setDescription('Smart Manufacturing ERP / MES Platform API')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addServer(`http://localhost:${port}`, 'Local')
      .addServer('https://erp-backend.onrender.com', 'Staging')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
  }

  await app.listen(port);

  logger.log(`Environment: ${environment}`);
  logger.log(`Backend running: http://localhost:${port}`);
  logger.log(`Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap();
