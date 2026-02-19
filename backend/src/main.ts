import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api/v1');
  const uploadDir = process.env.UPLOAD_DIR || 'uploads';
  const proposalsDir = join(process.cwd(), uploadDir, 'proposals');
  const avatarsDir = join(process.cwd(), uploadDir, 'avatars');
  if (!existsSync(proposalsDir)) mkdirSync(proposalsDir, { recursive: true });
  if (!existsSync(avatarsDir)) mkdirSync(avatarsDir, { recursive: true });
  app.useStaticAssets(join(process.cwd(), uploadDir), { prefix: '/uploads/' });
  await app.listen(3000);
}
bootstrap();
