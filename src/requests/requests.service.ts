import { Injectable } from '@nestjs/common'

import { DbService } from 'src/db/db.service'
import {
    CreateRequestDto,
    QueryRequestDto,
    UpdateRequestDto,
    UpdateRequestStatusDto,
} from './dto'
import { DEFAULT_LIMIT, DEFAULT_PAGE } from './constants'
import { RequestOrderBy, SortOrder } from './types'
import { Prisma } from 'generated/prisma'

@Injectable()
export class RequestsService {
    constructor(private readonly dbService: DbService) {}
    async getRequests(query: QueryRequestDto) {
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

        const where: Prisma.RequestWhereInput = {}

        if (search) {
            where.OR = [
                {
                    title: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    description: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
            ]
        }
        if (category) {
            where.category = category
        }
        if (city) {
            where.city = city
        }
        if (status) {
            where.status = status
        }

        const orderBy: RequestOrderBy = []
        if (sortBy) {
            orderBy.push({ [sortBy]: order })
        } else {
            orderBy.push({ createdAt: SortOrder.DESC })
        }

        const take = +limit
        const skip = (page - 1) * take

        const requests = await this.dbService.request.findMany({
            where,
            orderBy,
            take,
            skip,
        })

        const totalItems = await this.dbService.request.count({ where })
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

    async getUserRequests(userId: string) {
        const requests = await this.dbService.request.findMany({
            where: { userId },
        })

        return {
            data: requests,
        }
    }

    async getRequest(requestId: string) {
        return await this.dbService.request.findUnique({
            where: { id: requestId },
        })
    }

    async createRequest(userId: string, data: CreateRequestDto) {
        return await this.dbService.request.create({
            data: { userId, ...data },
        })
    }

    async updateRequest(requestId: string, data: UpdateRequestDto) {
        return await this.dbService.request.update({
            where: { id: requestId },
            data,
        })
    }

    async updateRequestStatus(requestId: string, data: UpdateRequestStatusDto) {
        return await this.dbService.request.update({
            where: { id: requestId },
            data,
        })
    }

    async deleteRequest(requestId: string) {
        return await this.dbService.request.delete({
            where: { id: requestId },
        })
    }
}
