import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './response-interceptor';
import { EventEmitterModule } from '@nestjs/event-emitter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Smart IOT API')
    .setVersion('1.0')
    .build();

  // const { httpAdapter } = app.get(HttpAdapterHost);

  const document = SwaggerModule.createDocument(app, config);

  // app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  // auto-transforms path and query parameters from strings to their
  // respective primitives listed as function arguments
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // used for a unified API response

  // swagger documentation
  SwaggerModule.setup('docs', app, document);

  await app.listen(5000);
}
bootstrap();
