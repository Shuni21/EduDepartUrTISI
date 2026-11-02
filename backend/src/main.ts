import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import {
    getLocalIpAddresses,
    isAllowedCorsOrigin,
} from './config/network';
import { getSchedulesDir } from './config/storage';

const bootstrap = async () => {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useWebSocketAdapter(new IoAdapter(app));

  app.useStaticAssets(getSchedulesDir(), {
    prefix: '/uploads/schedules/',
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  app.enableCors({
    origin: (
        origin: string | undefined,
        callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (isAllowedCorsOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? '0.0.0.0';

  await app.listen(port, host);

  const localIps = getLocalIpAddresses();

  console.log(`🚀 Application is running on: http://localhost:${port}`);

  for (const ip of localIps) {
    console.log(`📱 Available on network: http://${ip}:${port}`);
  }
};

bootstrap().catch(err => {
  console.error('❌ Error during bootstrap:', err);
  process.exit(1);
});
