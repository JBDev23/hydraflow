import 'reflect-metadata';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DomainErrorFilter, FallbackExceptionFilter } from './modules/common/domain-error.filter';

function configureNestApp(app: INestApplication): INestApplication {
  const isProd = process.env.NODE_ENV === 'production';
  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.length === 0) {
        if (isProd) {
          return callback(null, false);
        }
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      // Keep false: clients may send tzOffset / extra fields; whitelist still strips unknowns.
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new FallbackExceptionFilter(), new DomainErrorFilter());

  return app;
}

export async function createNestApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule);
  configureNestApp(app);
  await app.init();
  return app;
}

export async function listenNestApp(app: INestApplication): Promise<void> {
  const port = parseInt(process.env.PORT || '3000', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Nest server running on http://0.0.0.0:${port}`);
}
