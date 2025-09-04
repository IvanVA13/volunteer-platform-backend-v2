import { Body, ValidationPipe } from '@nestjs/common'

const strictValidationPipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
})

export const StrictBody = () => Body(strictValidationPipe)
