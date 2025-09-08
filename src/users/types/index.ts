import { Role } from 'generated/prisma'

export type JwtPayload = {
    id: string
    role: Role
}

export type JwtOptions = {
    expiresIn: string
    secret?: string
}
