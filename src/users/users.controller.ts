import { isEmpty } from 'lodash'
import * as bcrypt from 'bcrypt'
import { Response, Request } from 'express'
import {
    Controller,
    Get,
    Res,
    Post,
    Body,
    Patch,
    Param,
    BadRequestException,
    NotFoundException,
    Req,
    UseGuards,
    HttpStatus,
} from '@nestjs/common'
import {
    ApiOperation,
    ApiTags,
    ApiResponse,
    ApiBearerAuth,
    ApiCookieAuth,
    ApiParam,
    ApiBody,
} from '@nestjs/swagger'

import { UsersService } from './users.service'
import { AuthGuard } from 'src/users/guard/auth.guard'

import { LoginUserDto } from './dto/login-user.dto'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

import { Role } from '../../generated/prisma'
import { Roles } from 'src/decorators/roles.decorator'
import { CurrentUser, IUser } from 'src/decorators/current-user.decorator'

@ApiTags('Authentication & Users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post('/register')
    @ApiOperation({
        summary: 'Register a new user',
        description:
            'Create a new user account with email and phone number validation',
    })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'User successfully registered',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'User with this email or phone number already exists',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: {
                    type: 'string',
                    example: 'User with this email has been already registered',
                },
                error: { type: 'string', example: 'Bad Request' },
            },
        },
    })
    async create(@Body() data: CreateUserDto) {
        const user = await this.usersService.findOneByEmail(data.email)

        const isUniquePhoneOfUser = await this.usersService.findUserByPhone(
            data.phoneNumber
        )

        if (!isEmpty(isUniquePhoneOfUser)) {
            throw new BadRequestException(
                'User with this phone number has been already registered'
            )
        }

        if (!isEmpty(user)) {
            throw new BadRequestException(
                'User with this email has been already registered'
            )
        }

        return this.usersService.register(data)
    }

    @Post('/login')
    @ApiOperation({
        summary: 'User login',
        description:
            'Authenticate user and receive access token. Refresh token is set as HTTP-only cookie.',
    })
    @ApiBody({ type: LoginUserDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Successfully logged in',
        headers: {
            'Set-Cookie': {
                description: 'Refresh token cookie',
                schema: {
                    type: 'string',
                    example:
                        'refreshToken=token; HttpOnly; Secure; SameSite=Strict; Path=/',
                },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 404 },
                message: {
                    type: 'string',
                    example: "User with this email wasn't found",
                },
                error: { type: 'string', example: 'Not Found' },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid password',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: {
                    type: 'string',
                    example: 'You password is invalid!',
                },
                error: { type: 'string', example: 'Bad Request' },
            },
        },
    })
    async login(
        @Body() data: LoginUserDto,
        @Res({ passthrough: true }) res: Response
    ) {
        const user = await this.usersService.findOneByEmail(data?.email)

        if (isEmpty(user)) {
            throw new NotFoundException("User with this email wasn't found")
        }

        const isValidPassword = await bcrypt.compare(
            data.password,
            user.password
        )

        if (!isValidPassword) {
            throw new BadRequestException('You password is invalid!')
        }

        return await this.usersService.login(user, res)
    }

    @Post('/refreshToken')
    @ApiOperation({
        summary: 'Refresh access token',
        description: 'Use refresh token from cookie to get a new access token',
    })
    @ApiCookieAuth('refreshToken')
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'Tokens successfully refreshed',
        headers: {
            'Set-Cookie': {
                description: 'New refresh token cookie',
                schema: {
                    type: 'string',
                    example:
                        'jwtToken=newToken; HttpOnly; Secure; SameSite=Strict; MaxAge=604800000',
                },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Refresh token not provided',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: { type: 'string', example: 'User is not authorized' },
                error: { type: 'string', example: 'Bad Request' },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid or expired refresh token',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 401 },
                message: {
                    type: 'string',
                    example: 'Invalid or expired refresh token',
                },
                error: { type: 'string', example: 'Unauthorized' },
            },
        },
    })
    async refreshTokens(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response
    ) {
        const refreshToken = req['cookies']['refreshToken'] as string

        if (!refreshToken) {
            throw new BadRequestException('User is not authorized')
        }
        return await this.usersService.refreshTokens(refreshToken, res)
    }

    @Get('/profile')
    @UseGuards(AuthGuard)
    @Roles(Role.USER, Role.ADMIN, Role.VOLUNTEER)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get current user profile',
        description:
            'Retrieve the profile information of the authenticated user',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User profile retrieved successfully',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'User not authenticated',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 401 },
                message: { type: 'string', example: 'Unauthorized' },
                error: { type: 'string', example: 'Unauthorized' },
            },
        },
    })
    findOne(@CurrentUser() user: IUser) {
        return this.usersService.findOne(user.id)
    }

    @Patch(':id')
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Update user profile',
        description: 'Update user information by ID',
    })
    @ApiParam({
        name: 'id',
        description: 'User ID',
        type: String,
        example: '123',
    })
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User updated successfully',
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'User not authenticated',
    })
    update(@Param('id') id: string) {
        return this.usersService.update(+id)
    }

    @Post('/logout')
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Logout user',
        description: 'Clear refresh token and logout the authenticated user',
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: 'User successfully logged out',
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'User not authenticated',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 401 },
                message: { type: 'string', example: 'Unauthorized' },
                error: { type: 'string', example: 'Unauthorized' },
            },
        },
    })
    async logout(
        @Res({ passthrough: true }) res: Response,
        @CurrentUser() user: IUser
    ) {
        await this.usersService.logout(user.id)

        res.clearCookie('refreshToken')

        return { message: 'User is successfully logout' }
    }
}
