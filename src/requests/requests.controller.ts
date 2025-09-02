import {
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
} from '@nestjs/common'
import { RequestsService } from './requests.service'
import {
    CreateRequestDto,
    QueryRequestDto,
    UpdateRequestDto,
    UpdateRequestStatusDto,
} from './dto'
import { SoftQuery, StrictBody } from 'src/common/pipes'

@Controller('requests')
export class RequestsController {
    constructor(private readonly requestsService: RequestsService) {}
    @Get()
    async getRequests(@SoftQuery() query: QueryRequestDto) {
        return await this.requestsService.getRequests(query)
    }

    @Get('my')
    async getUserRequests() {
        // TODO: get user id from auth token, remove from query
        // const userId = query.id
        const userId = '6ec9aa6a-936f-488d-ae45-94f23cc4b8b9'
        return await this.requestsService.getUserRequests(userId)
    }

    @Get(':id')
    async getRequest(@Param('id', ParseUUIDPipe) requestId: string) {
        return await this.requestsService.getRequest(requestId)
    }

    @Post()
    async createRequest(
        @StrictBody() data: CreateRequestDto,
        @Query('id', new ParseUUIDPipe()) id: string
    ) {
        // TODO: get user id from auth token, remove from query
        const userId = id
        return await this.requestsService.createRequest(userId, data)
    }

    @Patch(':id')
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
    async deleteRequest(@Param('id', ParseUUIDPipe) requestId: string) {
        return await this.requestsService.deleteRequest(requestId)
    }
}
