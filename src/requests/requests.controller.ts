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
    QueryResponseDto,
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
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('requests')
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) {}

    @Get()
    @ApiOperation({
        summary: 'Get all requests',
        description:
            'Get a list of all requests with optional filtering, pagination, and sorting. Includes response information showing if request has been accepted by a volunteer.',
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
        description:
            'Get a list of all user requests with response information',
    })
    @ApiResponse(setOkResponse('User requests successfully retrieved'))
    @ApiResponse(UnauthorizedResponse)
    async getUserRequests(
        @CurrentUser() user: IUser,
        @SoftQuery() query: QueryRequestDto
    ) {
        return await this.requestsService.getRequests(query, user.id)
    }

    @Get('responses/my')
    @ApiOperation({
        summary: 'Get volunteer responses',
        description:
            'Get a list of all requests the current volunteer has accepted',
    })
    @ApiResponse(setOkResponse('Volunteer responses successfully retrieved'))
    @ApiResponse(UnauthorizedResponse)
    @Roles(Role.VOLUNTEER, Role.ADMIN)
    async getVolunteerResponses(
        @CurrentUser() user: IUser,
        @SoftQuery() query: QueryResponseDto
    ) {
        return await this.requestsService.getVolunteerResponses(user.id, query)
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get request by id',
        description:
            'Get one request by its id with volunteer response information',
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
        return await this.requestsService.getRequestWithResponses(requestId)
    }

    @Get(':id/responses')
    @ApiOperation({
        summary: 'Get request responses',
        description:
            'Get volunteer response for a specific request (only one volunteer per request)',
    })
    @ApiParam(ResponseParamId)
    @ApiResponse(setOkResponse('Request responses successfully retrieved'))
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
    @ApiResponse(UnauthorizedResponse)
    async getRequestResponses(
        @Param('id', ParseUUIDPipe) requestId: string,
        @SoftQuery() query: QueryResponseDto
    ) {
        return await this.requestsService.getRequestResponses(requestId, query)
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

    @Post(':id/respond')
    @ApiOperation({
        summary: 'Accept a request',
        description:
            'Volunteer accepts a help request. Only one volunteer can accept per request. Request status will change to IN_PROGRESS.',
    })
    @ApiParam(ResponseParamId)
    @ApiResponse({
        status: HttpStatus.CREATED,
        description: 'Request successfully accepted',
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description:
            'Request already accepted, invalid request, or cannot accept own request',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 400 },
                message: {
                    type: 'string',
                    example:
                        'This request has already been accepted by another volunteer',
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
    @ApiResponse(UnauthorizedResponse)
    @Roles(Role.VOLUNTEER, Role.ADMIN)
    async respondToRequest(
        @Param('id', ParseUUIDPipe) requestId: string,
        @CurrentUser() user: IUser
    ) {
        return await this.requestsService.createResponse(requestId, user.id)
    }

    @Delete(':id/respond')
    @ApiOperation({
        summary: 'Withdraw acceptance',
        description:
            'Volunteer withdraws their acceptance of a request. Request status returns to ACTIVE and becomes available for other volunteers.',
    })
    @ApiParam(ResponseParamId)
    @ApiResponse(setOkResponse('Response successfully withdrawn'))
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
        description: 'Request or response not found',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 404 },
                message: {
                    type: 'string',
                    example: 'You have not responded to this request',
                },
                error: { type: 'string', example: 'Not Found' },
            },
        },
    })
    @ApiResponse(UnauthorizedResponse)
    @Roles(Role.VOLUNTEER, Role.ADMIN)
    async withdrawResponse(
        @Param('id', ParseUUIDPipe) requestId: string,
        @CurrentUser() user: IUser
    ) {
        return await this.requestsService.deleteResponse(requestId, user.id)
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
    @ApiResponse(setOkResponse('Request status updated successfully'))
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
        description: 'Invalid status value',
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
        status: HttpStatus.FORBIDDEN,
        description: 'Cannot delete request',
        schema: {
            type: 'object',
            properties: {
                statusCode: { type: 'number', example: 403 },
                message: {
                    type: 'string',
                    example: 'You are not allowed to update this request',
                },
                error: { type: 'string', example: 'Forbidden' },
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
