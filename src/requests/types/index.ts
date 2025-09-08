import { Prisma } from 'generated/prisma'

export enum SortOrder {
    ASC = 'asc',
    DESC = 'desc',
}

export type RequestOrderBy = Pick<
    Prisma.RequestOrderByWithRelationInput,
    'category' | 'city' | 'createdAt' | 'status' | 'title'
>[]
