import {
    IsArray,
    IsDate,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator'

import { Transform, Type } from 'class-transformer'

import { SortOrder } from '../types'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { HelpCategory, RequestStatus } from 'generated/prisma'

export class QueryRequestDto {
    private static transformToArray(value: string | string[]): string[] {
        if (typeof value === 'string') {
            return [value.toUpperCase()]
        }
        if (Array.isArray(value)) {
            return value.map((v) => v.toUpperCase())
        }
        return value
    }
    @ApiPropertyOptional({
        description: 'search by title or description',
        example: 'search=food',
    })
    @IsOptional()
    @IsString()
    search?: string

    @ApiPropertyOptional({
        description: 'page number for pagination (default is 1)',
        example: 'page=1',
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1

    @ApiPropertyOptional({
        description: 'limit number for pagination (default is 20)',
        example: 'limit=20',
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 20

    @ApiPropertyOptional({
        description: 'sortBy field (e.g., category, city, status)',
        example: 'sortBy=category',
    })
    @IsOptional()
    @IsString()
    sortBy?: string

    @ApiPropertyOptional({
        description: 'sort order (ASC or DESC, default is DESC)',
        enum: SortOrder,
        enumName: 'SortOrder',
        example: SortOrder.DESC,
    })
    @IsOptional()
    @IsEnum(SortOrder, {
        message: `Sort order should be one of: ${Object.values(SortOrder).join(', ')}`,
    })
    order?: SortOrder = SortOrder.DESC

    @ApiPropertyOptional({
        description: 'User city where help is needed',
        example: 'Kyiv',
    })
    @IsString()
    @IsOptional()
    city?: string

    @ApiPropertyOptional({
        description: 'One or few help category',
        isArray: true,
        enum: HelpCategory,
        enumName: 'HelpCategory',
        example: [HelpCategory.FOOD],
    })
    @IsOptional()
    @Transform(({ value }: { value: string | string[] }) =>
        QueryRequestDto.transformToArray(value)
    )
    @IsArray()
    @IsEnum(HelpCategory, { each: true })
    category?: HelpCategory[]

    @ApiPropertyOptional({
        description: 'One or few request status',
        isArray: true,
        enum: RequestStatus,
        enumName: 'RequestStatus',
        example: [RequestStatus.ACTIVE],
    })
    @IsOptional()
    @Transform(({ value }: { value: string | string[] }) =>
        QueryRequestDto.transformToArray(value)
    )
    @IsArray()
    @IsEnum(RequestStatus, { each: true })
    status?: RequestStatus[]

    @ApiPropertyOptional({
        description: 'Start create at date (include). Format: DD-MM-YYYY',
        example: '01-08-2023',
    })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    createdAtFrom?: Date

    @ApiPropertyOptional({
        description: 'End create at date (include). Format: DD-MM-YYYY',
        example: '31-08-2023',
    })
    @IsOptional()
    @IsDate()
    @Transform(({ value }: { value: string | undefined }) => {
        if (!value) {
            return undefined
        }
        const date = new Date(value)
        date.setUTCHours(23, 59, 59, 999)
        return date
    })
    createdAtTo?: Date
}
