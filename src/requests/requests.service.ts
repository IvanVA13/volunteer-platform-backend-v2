import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common'

import { Prisma, RequestStatus, Role } from 'generated/prisma'
import { PrismaService } from 'src/prisma.service'

import { DEFAULT_LIMIT, DEFAULT_PAGE } from './constants'
import {
    CreateRequestDto,
    QueryRequestDto,
    UpdateRequestDto,
    QueryResponseDto,
} from './dto'
import { RequestOrderBy, SortOrder } from './types'

@Injectable()
export class RequestsService {
    constructor(private readonly prismaService: PrismaService) {}

    // Enhanced getRequests with response information
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
            createdAtFrom,
            createdAtTo,
        } = query

        const where: Prisma.RequestWhereInput = {
            ...(search && {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ],
            }),

            ...{ category: { in: category } },
            ...{ city: { equals: city } },
            ...{ status: { in: status } },
            ...{ userId: { equals: userId } },
            ...{
                createdAt: { gte: createdAtFrom, lte: createdAtTo },
            },
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
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                    responses: {
                        include: {
                            volunteer: {
                                select: {
                                    id: true,
                                    name: true,
                                    phone: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            responses: true,
                        },
                    },
                },
                orderBy,
                take,
                skip,
            }),

            this.prismaService.request.count({
                where,
            }),
        ])

        const totalPages = Math.ceil(totalItems / take)

        // Transform data to include response status and volunteer info
        const transformedRequests = requests.map((request) => ({
            ...request,
            hasResponse: request._count.responses > 0,
            volunteer:
                request.responses.length > 0
                    ? {
                          id: request.responses[0].volunteer.id,
                          name: request.responses[0].volunteer.name,
                          phone: request.responses[0].volunteer.phone,
                          respondedAt: request.responses[0].createdAt,
                      }
                    : null,
            // Clean up response to avoid exposing internal structure
            _count: undefined,
            responses: undefined,
        }))

        return {
            data: transformedRequests,
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

    // Enhanced getRequest with response information
    async getRequestWithResponses(requestId: string) {
        const request = await this.prismaService.request.findUnique({
            where: { id: requestId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                responses: {
                    include: {
                        volunteer: {
                            select: {
                                id: true,
                                name: true,
                                phone: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                _count: {
                    select: {
                        responses: true,
                    },
                },
            },
        })

        if (!request) {
            throw new NotFoundException('Request not found')
        }

        return {
            ...request,
            responseCount: request._count.responses,
            volunteers: request.responses.map((response) => ({
                id: response.volunteer.id,
                name: response.volunteer.name,
                phone: response.volunteer.phone,
                email: response.volunteer.email,
                respondedAt: response.createdAt,
            })),
            _count: undefined,
            responses: undefined,
        }
    }

    // Get all volunteer responses for a specific request
    async getRequestResponses(requestId: string, query: QueryResponseDto) {
        const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = query

        // Verify request exists
        await this.getRequest(requestId)

        const take = Number(limit)
        const skip = (page - 1) * take

        const [responses, totalItems] = await this.prismaService.$transaction([
            this.prismaService.response.findMany({
                where: { requestId },
                include: {
                    volunteer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            email: true,
                            city: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'asc',
                },
                take,
                skip,
            }),
            this.prismaService.response.count({
                where: { requestId },
            }),
        ])

        const totalPages = Math.ceil(totalItems / take)

        return {
            data: responses,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: take,
            },
        }
    }

    // Get all requests a volunteer has responded to
    async getVolunteerResponses(volunteerId: string, query: QueryResponseDto) {
        const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = query

        const take = Number(limit)
        const skip = (page - 1) * take

        const [responses, totalItems] = await this.prismaService.$transaction([
            this.prismaService.response.findMany({
                where: { volunteerId },
                include: {
                    request: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    phone: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take,
                skip,
            }),
            this.prismaService.response.count({
                where: { volunteerId },
            }),
        ])

        const totalPages = Math.ceil(totalItems / take)

        return {
            data: responses,
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: take,
            },
        }
    }

    // Create a volunteer response (accept request)
    async createResponse(requestId: string, volunteerId: string) {
        // Check if request exists and get current responses
        const request = await this.prismaService.request.findUnique({
            where: { id: requestId },
            include: { responses: true },
        })

        if (!request) {
            throw new NotFoundException('Request not found')
        }

        // Business logic validations
        if (request.status !== RequestStatus.ACTIVE) {
            throw new BadRequestException(
                'This request is no longer available for responses'
            )
        }

        if (request.userId === volunteerId) {
            throw new BadRequestException(
                'You cannot respond to your own request'
            )
        }

        // Check if ANY volunteer has already responded (one volunteer per request rule)
        if (request.responses.length > 0) {
            throw new BadRequestException(
                'This request has already been accepted by another volunteer'
            )
        }

        // Create response and update request status in a transaction
        return await this.prismaService.$transaction(async (tx) => {
            const response = await tx.response.create({
                data: {
                    requestId,
                    volunteerId,
                },
                include: {
                    request: {
                        select: {
                            id: true,
                            title: true,
                            status: true,
                        },
                    },
                    volunteer: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                        },
                    },
                },
            })

            // Update request status to IN_PROGRESS since volunteer accepted
            await tx.request.update({
                where: { id: requestId },
                data: { status: RequestStatus.IN_PROGRESS },
            })

            return {
                ...response,
                message: 'Successfully accepted the request',
            }
        })
    }

    // Delete/withdraw a volunteer response
    async deleteResponse(requestId: string, volunteerId: string) {
        // Check if response exists
        const response = await this.prismaService.response.findUnique({
            where: {
                requestId_volunteerId: {
                    requestId,
                    volunteerId,
                },
            },
            include: {
                request: true,
            },
        })

        if (!response) {
            throw new NotFoundException(
                'You have not responded to this request'
            )
        }

        // Delete response and revert request status back to ACTIVE
        return await this.prismaService.$transaction(async (tx) => {
            await tx.response.delete({
                where: {
                    requestId_volunteerId: {
                        requestId,
                        volunteerId,
                    },
                },
            })

            // Since only one volunteer can respond, withdrawing always makes request available again
            await tx.request.update({
                where: { id: requestId },
                data: { status: RequestStatus.ACTIVE },
            })

            return {
                message:
                    'Response withdrawn successfully. Request is now available for other volunteers.',
            }
        })
    }

    // Existing methods remain the same
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
