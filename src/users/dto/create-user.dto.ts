import { Role } from '../../../generated/prisma'
import {
    IsStrongPassword,
    IsEmail,
    IsPhoneNumber,
    IsNotEmpty,
    IsEnum,
} from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class CreateUserDto {
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
        required: true,
    })
    @IsEmail()
    @IsNotEmpty()
    email: string

    @ApiProperty({
        description: 'User full name',
        example: 'John Doe',
        required: true,
    })
    @IsNotEmpty()
    name: string

    @ApiProperty({
        description: 'User password (must be strong)',
        example: 'MyStr0ng!Pass123',
        required: true,
        minLength: 8,
    })
    @IsStrongPassword()
    @IsNotEmpty()
    password: string

    @ApiProperty({
        description: 'User phone number',
        example: '+1234567890',
        required: true,
    })
    @IsPhoneNumber()
    @IsNotEmpty()
    phoneNumber: string

    @ApiProperty({
        description: 'User role in the system',
        enum: Role,
        enumName: 'Role',
        example: Role.USER,
        required: true,
    })
    @IsEnum(Role, {
        message: `Role should be ${Role.USER} or ${Role.ADMIN} or ${Role.VOLUNTEER}`,
    })
    @IsNotEmpty()
    role: Role

    @ApiProperty({
        description: 'User city of residence',
        example: 'New York',
        required: true,
    })
    @IsNotEmpty()
    city: string
}
