import { PartialType } from '@nestjs/mapped-types'
import { IsEnum, IsOptional } from 'class-validator'

import { Status } from 'generated/prisma'
import { CreateRequestDto } from './create-request.dto'

export class UpdateRequestDto extends PartialType(CreateRequestDto) {}

export class UpdateRequestStatusDto {
    @IsEnum(Status)
    @IsOptional()
    status?: Status
}
