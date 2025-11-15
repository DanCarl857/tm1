import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { seedAdmin } from './seed-admin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.init();

  const config = new DocumentBuilder()
    .setTitle('TM API Documentation')
    .setDescription('Task manager API docs')
    .setVersion('1.0')
    // .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;

  await seedAdmin(app);
  await app.listen(port);
  
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
