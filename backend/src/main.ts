import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

function resolveDrawioRoot() {
  if (process.env.DRAWIO_ROOT) {
    return process.env.DRAWIO_ROOT;
  }

  const cwd = process.cwd();
  const candidates = [
    join(cwd, 'src', 'main', 'webapp'),
    join(cwd, '..', 'src', 'main', 'webapp'),
    join(cwd, '..', 'drawio', 'src', 'main', 'webapp'),
  ];

  for (const webappPath of candidates) {
    if (existsSync(webappPath)) {
      return webappPath.replace(/[\\/]src[\\/]main[\\/]webapp$/, '');
    }
  }

  return join(cwd, '..');
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: false,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  const drawioRoot = resolveDrawioRoot();
  app.useStaticAssets(drawioRoot, { index: false });

  const port = Number(process.env.PORT || 8001);
  await app.listen(port);
  console.log(`Diagram backend listening on http://localhost:${port}/api`);
  console.log(
    `Drawio frontend served from http://localhost:${port}/src/main/webapp/index.html?dev=1&p=electricalSymbols`,
  );
}

bootstrap();
