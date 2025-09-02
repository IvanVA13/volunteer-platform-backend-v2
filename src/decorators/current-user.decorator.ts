import { ExecutionContext, createParamDecorator } from '@nestjs/common'

export interface IUser {
    id: string
    email?: string
}

export const CurrentUser = createParamDecorator(
    (
        data: keyof IUser | undefined,
        ctx: ExecutionContext
    ): IUser | string | undefined => {
        const request: Record<string, unknown> = ctx.switchToHttp().getRequest()

        if (!request.user) {
            return undefined
        }

        const user = request.user as IUser

        if (data) {
            return user[data]
        }

        return user
    }
)
