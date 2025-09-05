import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'

import { UpdateRequestStatusDto } from './update-request.dto'
import { Type } from 'class-transformer'
import { CreateRequestDto } from './create-request.dto'
import { SortOrder } from '../types'
import {
    ApiPropertyOptional,
    PartialType,
    IntersectionType,
    OmitType,
} from '@nestjs/swagger'

class QueryDto {
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
}

export class QueryRequestDto extends IntersectionType(
    PartialType(OmitType(CreateRequestDto, ['title', 'description'] as const)),
    PartialType(UpdateRequestStatusDto),
    QueryDto
) {}
