/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet()); // Para cabeceras seguras
  app.enableCors({ origin: '*' }); // Habilitar CORS según sea necesario
  app.useGlobalPipes(new ValidationPipe()); // Validación global (ver sección 7)
  await app.listen(process.env.PORT || 3000);
}
bootstrap().catch((err) => {
  console.error('Error al iniciar la app:', err);
  process.exit(1);
});
