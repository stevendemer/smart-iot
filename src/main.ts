import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { HttpService } from '@nestjs/axios';
import { InternalServerErrorException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpService = new HttpService();

  const config = new DocumentBuilder()
    .setTitle('Smart IOT API')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  app.useGlobalFilters(new HttpExceptionFilter());

  httpService.axiosRef.interceptors.request.use(
    (response) => {
      console.log('Inside the response cb', response);
      return response;
    },
    (error) => {
      console.log('Internal server error exception ', error);
      throw new InternalServerErrorException();
    },
  );

  SwaggerModule.setup('docs', app, document);

  await app.listen(5000);
}
bootstrap();
