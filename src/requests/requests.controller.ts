import {
    Controller,
    Delete,
    Get,
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

@UseGuards(AuthGuard)
@Controller('requests')
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) {}
    @Get()
    async getRequests(@SoftQuery() query: QueryRequestDto) {
        return await this.requestsService.getRequests(query)
    }

    @Get('my')
    async getUserRequests(@CurrentUser() user: IUser) {
        return await this.requestsService.getUserRequests(user.id)
    }

    @Get(':id')
    async getRequest(@Param('id', ParseUUIDPipe) requestId: string) {
        return await this.requestsService.getRequest(requestId)
    }

    @Post()
    async createRequest(
        @StrictBody() data: CreateRequestDto,
        @CurrentUser() user: IUser
    ) {
        return await this.requestsService.createRequest(user.id, data)
    }

    @Patch(':id')
    @Roles(Role.USER)
    async updateRequest(
        @StrictBody() data: UpdateRequestDto,
        @Param('id', ParseUUIDPipe) requestId: string
    ) {
        return await this.requestsService.updateRequest(requestId, data)
    }

    @Patch(':id/status')
    async updateRequestStatus(
        @StrictBody() data: UpdateRequestStatusDto,
        @Param('id', ParseUUIDPipe) requestId: string
    ) {
        return await this.requestsService.updateRequestStatus(requestId, data)
    }

    @Delete(':id')
    @Roles(Role.USER, Role.ADMIN)
    async deleteRequest(@Param('id', ParseUUIDPipe) requestId: string) {
        return await this.requestsService.deleteRequest(requestId)
    }
}
