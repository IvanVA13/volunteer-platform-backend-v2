import { IsEnum, IsNotEmpty } from 'class-validator'

import { RequestStatus } from 'generated/prisma'
import { CreateRequestDto } from './create-request.dto'
import { Transform } from 'class-transformer'
import { ApiProperty, PartialType } from '@nestjs/swagger'

export class UpdateRequestDto extends PartialType(CreateRequestDto) {}

export class UpdateRequestStatusDto {
    @ApiProperty({
        description: 'Request status update',
        enum: RequestStatus,
        enumName: 'Request status',
        example: RequestStatus.ACTIVE,
    })
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toUpperCase() : value
    )
    @IsEnum(RequestStatus, {
        message: `Status should be one of: ${Object.values(RequestStatus).join(', ')}`,
    })
    @IsNotEmpty()
    status: RequestStatus
}
