import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsNumber, IsOptional, Min } from 'class-validator'

export class CreateResponseDto {}

export class QueryResponseDto {
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
}
