import {
    IsEnum,
    IsNotEmpty,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator'
import { HelpCategory } from 'generated/prisma'

export class CreateRequestDto {
    @MinLength(5)
    @MaxLength(100)
    @IsString()
    title: string

    @MinLength(20)
    @MaxLength(1000)
    @IsString()
    description: string

    @IsEnum(HelpCategory)
    category: HelpCategory

    @IsString()
    @IsNotEmpty()
    city: string
}
