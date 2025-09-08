import { Query, ValidationPipe } from '@nestjs/common'

export const SoftQuery = () =>
    Query(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: false,
            transform: true,
        })
    )
