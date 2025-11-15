import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { seedAdmin } from './seed-admin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  const globalPrefix = 'api';
  // Set global prefix before creating Swagger so the docs path aligns with prefixed routes
  app.setGlobalPrefix(globalPrefix);

  const config = new DocumentBuilder()
    .setTitle('TM API Documentation')
    .setDescription('Task manager API docs')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    }, 'Authorization')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // Expose swagger UI at /api/docs and enable persisting the Authorization token in UI
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
  const port = process.env.PORT || 3000;

  await seedAdmin(app);
  await app.listen(port);
  
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
