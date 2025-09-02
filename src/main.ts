import * as cookieParser from 'cookie-parser'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'
import environment from 'src/environments'

async function bootstrap() {
    const app = await NestFactory.create(AppModule)

    const config = new DocumentBuilder()
        .setTitle('Razom swagger API')
        .setDescription('The razom app API description')
        .setVersion('1.0')
        .build()
    const documentFactory = () => SwaggerModule.createDocument(app, config)
    app.useGlobalPipes(
        new ValidationPipe({
            transform: true,
        })
    )
    app.use(cookieParser())
    SwaggerModule.setup('api', app, documentFactory)

    await app.listen(environment.PORT)
}

bootstrap()
