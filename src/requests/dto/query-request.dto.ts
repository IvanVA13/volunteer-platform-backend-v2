import { IntersectionType, OmitType, PartialType } from '@nestjs/mapped-types'
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator'

import { UpdateRequestStatusDto } from './update-request.dto'
import { Type } from 'class-transformer'
import { CreateRequestDto } from './create-request.dto'
import { SortOrder } from '../types'

class QueryDto {
    @IsOptional()
    @IsString()
    search?: string

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number = 1

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number = 20

    @IsOptional()
    @IsString()
    sortBy?: string

    @IsOptional()
    @IsEnum(SortOrder)
    order?: SortOrder = SortOrder.DESC
}

export class QueryRequestDto extends IntersectionType(
    PartialType(OmitType(CreateRequestDto, ['title', 'description'] as const)),
    UpdateRequestStatusDto,
    QueryDto
) {}
