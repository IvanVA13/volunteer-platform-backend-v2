import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'

import { Prisma, RequestStatus, Role } from 'generated/prisma'
import { PrismaService } from 'src/prisma.service'

import { DEFAULT_LIMIT, DEFAULT_PAGE } from './constants'
import { CreateRequestDto, QueryRequestDto, UpdateRequestDto } from './dto'
import { RequestOrderBy, SortOrder } from './types'

@Injectable()
export class RequestsService {
    constructor(private readonly prismaService: PrismaService) {}
    async getRequests(query: QueryRequestDto, userId?: string) {
        const {
            page = DEFAULT_PAGE,
            limit = DEFAULT_LIMIT,
            sortBy,
            order = SortOrder.DESC,
            search,
            category,
            city,
            status,
        } = query

        const where: Prisma.RequestWhereInput = {
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),
            ...(category && { category: { equals: category } }),
            ...(city && { city: { equals: city } }),
            ...(status && { status: { equals: status } }),
            ...(userId && { userId: { equals: userId } }),
        }

        const orderBy: RequestOrderBy = []
        if (sortBy) {
            orderBy.push({ [sortBy]: order })
        } else {
            orderBy.push({ createdAt: SortOrder.DESC })
        }

        const take = Number(limit)
        const skip = (page - 1) * take

        const [requests, totalItems] = await this.prismaService.$transaction([
            this.prismaService.request.findMany({
                where,
                orderBy,
                take,
                skip,
            }),

            this.prismaService.request.count({
                where,
            }),
        ])
        const totalPages = Math.ceil(totalItems / take)

        return {
            data: requests,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: take,
            },
        }
    }

    async getRequest(requestId: string) {
        const request = await this.prismaService.request.findUnique({
            where: { id: requestId },
        })
        if (!request) {
            throw new NotFoundException('Request not found')
        }
        return request
    }

    async createRequest(userId: string, data: CreateRequestDto) {
        return await this.prismaService.request.create({
            data: { userId, ...data },
        })
    }

    async updateRequest(
        userId: string,
        requestId: string,
        data: UpdateRequestDto
    ) {
        await this.isAllowedToModifyRequest(userId, requestId)
        return await this.prismaService.request.update({
            where: {
                id: requestId,
            },
            data,
        })
    }

    async updateRequestStatus(
        userId: string,
        requestId: string,
        status: RequestStatus
    ) {
        await this.isAllowedToModifyRequest(userId, requestId)
        return await this.prismaService.request.update({
            where: { id: requestId },
            data: { status },
        })
    }

    async deleteRequest(userId: string, requestId: string) {
        await this.isAllowedToModifyRequest(userId, requestId)
        await this.prismaService.request.delete({
            where: { id: requestId, userId },
        })
        return { message: 'Request deleted successfully' }
    }

    private async isAllowedToModifyRequest(userId: string, requestId: string) {
        const user = await this.prismaService.user.findUnique({
            where: { id: userId },
        })
        const request = await this.getRequest(requestId)
        if (user?.role === Role.USER && userId !== request?.userId) {
            throw new ForbiddenException(
                'You are not allowed to update this request'
            )
        }
    }
}
