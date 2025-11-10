/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // app.use(helmet());   
   app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
    exceptionFactory: (errors) => {
      const messages = errors.map(error => {
        const constraints = error.constraints;
        return Object.values(constraints || {}).join(', ');
      });
      return new ValidationPipe().createExceptionFactory()(errors);
    },
  }));

  app.enableCors({
    origin: [
      'http://localhost:4321',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://app.juveconfe.com',
      'https://app.juveconfe.com',
      'http://www.app.juveconfe.com',
      'https://www.app.juveconfe.com',
      'http://juveconfe.com',
      'https://juveconfe.com',
      'http://www.juveconfe.com',
      'https://www.juveconfe.com'
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: '*',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });
  const config = new DocumentBuilder()
    .setTitle('JuveConf')
    .setDescription('API para Juventud en Conferencia')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(process.env.PORT || 3072);
  console.log(`Server running on port ${process.env.PORT || 3072}`);
}
bootstrap().catch(err => {
  console.error('Bootstrap error:', err);
  process.exit(1);
});
