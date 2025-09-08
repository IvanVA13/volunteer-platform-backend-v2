import { ApiProperty } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import {
    IsEnum,
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator'
import { HelpCategory } from 'generated/prisma'

export class CreateRequestDto {
    @ApiProperty({
        description: 'Request title',
        example: 'Need food supplies',
        required: true,
        minLength: 5,
        maxLength: 100,
    })
    @MinLength(5)
    @MaxLength(100)
    @IsString()
    title: string

    @ApiProperty({
        description: 'Request description',
        example: 'Details about the food supplies needed',
        required: true,
        minLength: 20,
        maxLength: 1000,
    })
    @MinLength(20)
    @MaxLength(1000)
    @IsString()
    description: string

    @ApiProperty({
        description: 'Help category',
        enum: HelpCategory,
        enumName: 'Help category',
        example: HelpCategory.FOOD,
    })
    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.toUpperCase() : value
    )
    @IsEnum(HelpCategory, {
        message: `Category should be one of: ${Object.values(HelpCategory).join(', ')}`,
    })
    @IsNotEmpty()
    category: HelpCategory

    @ApiProperty({
        description: 'User city where help is needed',
        example: 'Kyiv',
    })
    @IsString()
    @IsNotEmpty()
    city: string
}
