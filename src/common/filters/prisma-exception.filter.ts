import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
} from '@nestjs/common'
import { Prisma } from 'generated/prisma'
import { Response } from 'express'

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
    catch(
        exception: Prisma.PrismaClientKnownRequestError,
        host: ArgumentsHost
    ) {
        const ctx = host.switchToHttp()
        const response = ctx.getResponse<Response>()
        let status = HttpStatus.INTERNAL_SERVER_ERROR
        let message = 'An internal server error occurred'

        switch (exception.code) {
            case 'P2025':
                status = HttpStatus.NOT_FOUND
                message = 'Resource not found'
                break

            case 'P2002':
                status = HttpStatus.CONFLICT
                message = `A record already exists.`
                break

            default:
                console.error(exception)
                break
        }

        response.status(status).json({
            statusCode: status,
            message: message,
        })
    }
}
