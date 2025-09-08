import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common'
import { Request } from 'express'
import { JwtService } from '@nestjs/jwt'
import { Reflector } from '@nestjs/core'

import { Role, User } from '../../../generated/prisma'
import { ROLES_KEY } from 'src/decorators/roles.decorator'
import { ACCESS_OPTIONS } from '../constants'

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private reflector: Reflector
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request: Request = context.switchToHttp().getRequest()
        const token = this.extractTokenFromHeader(request)

        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()]
        )

        if (!token) {
            throw new UnauthorizedException()
        }
        try {
            const payload: User = await this.jwtService.verifyAsync(
                token,
                ACCESS_OPTIONS
            )

            request['user'] = payload

            if (requiredRoles) {
                return requiredRoles.some((role) =>
                    payload.role?.includes(role)
                )
            }
        } catch {
            throw new UnauthorizedException()
        }
        return true
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(' ') ?? []
        return type === 'Bearer' ? token : undefined
    }
}
