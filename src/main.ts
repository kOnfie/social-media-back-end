import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      // не пропускає дані яких немає у DTO при запиті
      whitelist: true,
      // кидає 400 помилку якщо є дані яких немає у DTO при запиті
      forbidNonWhitelisted: true,
      // перетворює об'єкт з plain JSON-object одразу на інстанс класу DTO
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  const NODE_ENV = configService.get<string>('NODE_ENV');
  if (NODE_ENV === 'dev') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Social Media Backend')
      .setDescription('REST API for Social Media')
      .setVersion('1.0')
      .build();

    const documentFactory = () =>
      SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, documentFactory);
  }

  const PORT = configService.get<string>('PORT') ?? 3004;

  await app.listen(PORT, () => {
    console.log(`
      =====================================
        
        Server are working on port ${PORT} | Environment: ${NODE_ENV}
        ${NODE_ENV === 'dev' && `Swagger docs: http://localhost:${PORT}/api/docs`}

      =====================================
    `);
  });
}

bootstrap();
