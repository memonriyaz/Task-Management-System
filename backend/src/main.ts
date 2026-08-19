import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  const uploadsDir = join(process.cwd(), 'uploads');
  app.use('/uploads', express.static(uploadsDir));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Kanban Task Management System API')
    .setDescription(
      'Full Stack Technical Assessment - NestJS Backend with RESTful CRUD endpoints for Boards, Columns, Tasks, Subtasks, and Guest Authentication.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication and Guest Sessions')
    .addTag('boards', 'Kanban Board management')
    .addTag('columns', 'Kanban Column management')
    .addTag('tasks', 'Kanban Task and Drag & Drop management')
    .addTag('subtasks', 'Subtasks completion and updates')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Kanban API Docs',
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 Kanban Backend server running on: http://localhost:${port}`);
  logger.log(`📚 Swagger API Documentation available on: http://localhost:${port}/api/docs`);
}

bootstrap();
