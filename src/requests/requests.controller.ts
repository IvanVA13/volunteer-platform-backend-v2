import {
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common'

import { Role } from 'generated/prisma'
import { RequestsService } from './requests.service'

import {
    CreateRequestDto,
    QueryRequestDto,
    UpdateRequestDto,
    UpdateRequestStatusDto,
} from './dto'

import { SoftQuery, StrictBody } from 'src/common/pipes'
import { AuthGuard } from 'src/users/guard/auth.guard'
import { Roles } from 'src/decorators/roles.decorator'
import { CurrentUser, IUser } from 'src/decorators/current-user.decorator'
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger'

const UnauthorizedResponse = {
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
}

const ResponseParamId = {
    name: 'id',
    description: 'Request ID',
    type: String,
    example: 'ac0bec93-0dbb-46ba-b039-1d51214aa022',
}

const setOkResponse = (description: string) => ({
    status: HttpStatus.OK,
    description,
})

@ApiTags('Requests from users')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
@Controller('requests')
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) {}

    @Get()
    @ApiOperation({
        summary: 'Get all requests',
        description:
            'Get a list of all requests with optional filtering, pagination, and sorting',
    })
    @ApiResponse(setOkResponse('Requests successfully retrieved'))
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid query data',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: {
                    type: 'string',
                    example:
                        'category must be one of the following values: medical, food, transport, clothing, shelter, other',
                },
                error: { type: 'string', example: 'Bad Request' },
            },
        },
    })
    @ApiResponse(UnauthorizedResponse)
    async getRequests(@SoftQuery() query: QueryRequestDto) {
        return await this.requestsService.getRequests(query)
    }

    @Get('my')
    @ApiOperation({
        summary: 'Get user requests',
        description: 'Get a list of all user requests',
    })
    @ApiResponse(setOkResponse('Requests successfully retrieved'))
    @ApiResponse(UnauthorizedResponse)
    async getUserRequests(
        @CurrentUser() user: IUser,
        @SoftQuery() query: QueryRequestDto
    ) {
        return await this.requestsService.getRequests(query, user.id)
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get request by id',
        description: 'Get one request by its id',
    })
    @ApiParam(ResponseParamId)
    @ApiResponse(setOkResponse('Request by id successfully retrieved'))
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid request id format',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: {
                    type: 'string',
                    example: 'Request id must be a UUID',
                },
                error: { type: 'string', example: 'Bad Request' },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Request not found',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 404 },
                message: {
                    type: 'string',
                    example: 'Request not found',
                },
                error: { type: 'string', example: 'Not Found' },
            },
        },
    })
    async getRequest(@Param('id', ParseUUIDPipe) requestId: string) {
        return await this.requestsService.getRequest(requestId)
    }

    @Post()
    @ApiOperation({
        summary: 'Create a new request',
        description:
            'Create a new request from a user to the volunteer platform',
    })
    @ApiBody({ type: CreateRequestDto })
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Request successfully created',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Missing required fields or invalid data',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: {
                    type: 'string',
                    example: 'Title|Description|Category|City is required',
                },
                error: { type: 'string', example: 'Bad Request' },
            },
        },
    })
    @ApiResponse(UnauthorizedResponse)
    @Roles(Role.USER)
    async createRequest(
        @StrictBody() data: CreateRequestDto,
        @CurrentUser() user: IUser
    ) {
        return await this.requestsService.createRequest(user.id, data)
    }

    @Patch(':id')
    @ApiOperation({
        summary: 'Edit request',
        description:
            'Edit an existing request. You can update any field except the status.',
    })
    @ApiParam(ResponseParamId)
    @ApiBody({ type: UpdateRequestDto })
    @ApiResponse(setOkResponse('Request updated successfully'))
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid request id format',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: {
                    type: 'string',
                    example: 'Request id must be a UUID',
                },
                error: { type: 'string', example: 'Bad Request' },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid request fields or data',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: {
                    type: 'string',
                    example:
                        'category must be one of the following values: medical, food, transport, clothing, shelter, other',
                },
                error: { type: 'string', example: 'Bad Request' },
            },
        },
    })
    @ApiResponse(UnauthorizedResponse)
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'User not found',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 404 },
                message: {
                    type: 'string',
                    example: 'Request not found',
                },
                error: { type: 'string', example: 'Not Found' },
            },
        },
    })
    @Roles(Role.USER, Role.ADMIN)
    async updateRequest(
        @StrictBody() data: UpdateRequestDto,
        @CurrentUser() user: IUser,
        @Param('id', ParseUUIDPipe) requestId: string
    ) {
        return await this.requestsService.updateRequest(
            user.id,
            requestId,
            data
        )
    }

    @Patch(':id/status')
    @ApiOperation({
        summary: 'Edit request status',
        description:
            'Edit status of an existing request. Only the status field can be updated.',
    })
    @ApiParam(ResponseParamId)
    @ApiBody({ type: UpdateRequestStatusDto })
    @ApiResponse(setOkResponse('Request updated successfully'))
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid request id format',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: {
                    type: 'string',
                    example: 'Request id must be a UUID',
                },
                error: { type: 'string', example: 'Bad Request' },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid data',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: {
                    type: 'string',
                    example:
                        'status must be one of the following values: active, in_progress, completed, cancelled',
                },
                error: { type: 'string', example: 'Bad Request' },
            },
        },
    })
    @ApiResponse(UnauthorizedResponse)
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Request not found',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 404 },
                message: {
                    type: 'string',
                    example: 'Request not found',
                },
                error: { type: 'string', example: 'Not Found' },
            },
        },
    })
    @Roles(Role.USER, Role.ADMIN)
    async updateRequestStatus(
        @StrictBody() data: UpdateRequestStatusDto,
        @CurrentUser() user: IUser,
        @Param('id', ParseUUIDPipe) requestId: string
    ) {
        return await this.requestsService.updateRequestStatus(
            user.id,
            requestId,
            data.status
        )
    }

    @Delete(':id')
    @ApiOperation({
        summary: 'Delete user request',
        description:
            'Delete an existing request. A user can only delete their own requests.',
    })
    @ApiParam(ResponseParamId)
    @ApiResponse(setOkResponse('Request deleted successfully'))
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid request id format',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: {
                    type: 'string',
                    example: 'Request id must be a UUID',
                },
                error: { type: 'string', example: 'Bad Request' },
            },
        },
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Invalid data',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: {
                    type: 'string',
                    example:
                        'status must be one of the following values: pending, in_progress, completed, cancelled',
                },
                error: { type: 'string', example: 'Bad Request' },
            },
        },
    })
    @ApiResponse(UnauthorizedResponse)
    @ApiResponse({
        status: HttpStatus.NOT_FOUND,
        description: 'Request not found',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 404 },
                message: {
                    type: 'string',
                    example: 'Request not found',
                },
                error: { type: 'string', example: 'Not Found' },
            },
        },
    })
    @Roles(Role.USER, Role.ADMIN)
    async deleteRequest(
        @CurrentUser() user: IUser,
        @Param('id', ParseUUIDPipe) requestId: string
    ) {
        return await this.requestsService.deleteRequest(user.id, requestId)
    }
}
