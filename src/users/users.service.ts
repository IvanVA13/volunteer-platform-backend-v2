import * as bcrypt from 'bcrypt'
import { Response } from 'express'
import { JwtService } from '@nestjs/jwt'
import {
    Injectable,
    UnauthorizedException,
    NotFoundException,
} from '@nestjs/common'

import { User } from '../../generated/prisma'
import { PrismaService } from 'src/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { isEmpty } from 'lodash'
import environment from 'src/environments'
import { ACCESS_OPTIONS, REFRESH_OPTIONS } from './constants'
import { JwtOptions, JwtPayload } from './types'

@Injectable()
export class UsersService {
    constructor(
        private readonly prisma: PrismaService,
        private jwtService: JwtService
    ) {}

    async register({
        city,
        role,
        name,
        email,
        password,
        phoneNumber,
    }: CreateUserDto) {
        const salt = await bcrypt.genSalt(Number(environment.SALT_PASSWORD))

        const passwordHash: string = bcrypt.hashSync(password, salt)

        return this.prisma.user.create({
            data: {
                city,
                role,
                name,
                email,
                password: passwordHash,
                phone: phoneNumber,
            },
        })
    }

    async login(user: User, res: Response) {
        const payload = { id: user.id, role: user.role }

        const accessToken = this.signToken(payload, ACCESS_OPTIONS)
        const refreshToken = this.signToken(payload, REFRESH_OPTIONS)

        const hashedToken = this.hashToken(refreshToken)

        await this.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: hashedToken },
        })

        this.setRefreshTokenCookie(res, refreshToken)

        return { access_token: accessToken }
    }

    async refreshTokens(refreshToken: string, res: Response) {
        try {
            const payload: User = this.jwtService.verify(
                refreshToken,
                REFRESH_OPTIONS
            )

            const user = await this.prisma.user.findUnique({
                where: {
                    id: payload.id,
                },
            })

            if (isEmpty(user)) {
                throw new NotFoundException("User wasn't fount with this token")
            }

            if (!user.refreshToken) {
                throw new UnauthorizedException('Invalid refresh token')
            }

            const isRefreshTokenValid = await bcrypt.compare(
                refreshToken,
                user.refreshToken
            )

            if (!isRefreshTokenValid) {
                throw new UnauthorizedException('Invalid refresh token')
            }

            if (!user) {
                throw new UnauthorizedException('Invalid refresh token')
            }

            const newPayload = { id: user.id, role: user.role }

            const newAccessToken = this.signToken(newPayload, ACCESS_OPTIONS)
            const newRefreshToken = this.signToken(newPayload, REFRESH_OPTIONS)

            const newHashedRefreshToken = this.hashToken(newRefreshToken)

            await this.prisma.user.update({
                where: { id: user.id },
                data: { refreshToken: newHashedRefreshToken },
            })
            this.setRefreshTokenCookie(res, newRefreshToken)

            return { access_token: newAccessToken }
        } catch (err) {
            console.error(err)
            throw new UnauthorizedException('Invalid or expired refresh token')
        }
    }

    findOneByEmail(email: string) {
        return this.prisma.user.findUnique({ where: { email } })
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({ where: { id } })
        if (!user) {
            return null
        }
        return this.exclude(user, ['password', 'refreshToken'])
    }

    findUserByPhone(phone: string) {
        return this.prisma.user.findUnique({ where: { phone } })
    }

    update(id: number) {
        return `This action updates a #${id} user`
    }

    logout(id: string) {
        return this.prisma.user.update({
            where: { id },
            data: { refreshToken: '' },
        })
    }

    private exclude<User, Key extends keyof User>(
        user: User,
        keys: Key[]
    ): Omit<User, Key> {
        for (const key of keys) {
            delete user[key]
        }
        return user
    }

    private hashToken(token: string) {
        return bcrypt.hashSync(token, Number(environment.SALT_PASSWORD))
    }

    private signToken(payload: JwtPayload, options: JwtOptions) {
        return this.jwtService.sign(payload, options)
    }

    private setRefreshTokenCookie(res: Response, token: string) {
        res.cookie('refreshToken', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
        })
    }
}
