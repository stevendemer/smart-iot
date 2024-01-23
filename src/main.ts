import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './response-interceptor';
import * as session from 'express-session';
import * as passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    session({
      secret: 'secret',
      resave: false,
      saveUninitialized: false,
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  const port = process.env.PORT || 5000;

  const config = new DocumentBuilder()
    .setTitle('Smart IOT API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
}
bootstrap();
