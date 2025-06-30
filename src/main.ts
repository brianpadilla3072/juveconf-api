/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  
  // app.use(helmet());   
   app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
      transformOptions: { enableImplicitConversion: true },

  }));

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
    exposedHeaders: '*',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204
  });
  const config = new DocumentBuilder()
    .setTitle('Consagrados a Jesus')
    .setDescription('API consagrados a jesus')
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
