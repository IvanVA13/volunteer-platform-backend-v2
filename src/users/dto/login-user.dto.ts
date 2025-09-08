import { IsEmail, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginUserDto {
    @ApiProperty({
        description: 'User email address',
        example: 'user@example.com',
        required: true,
    })
    @IsEmail()
    @IsNotEmpty()
    email: string

    @ApiProperty({
        description: 'User password (must be strong)',
        example: 'MyStr0ng!Pass123',
        required: true,
        minLength: 8,
    })
    @IsNotEmpty()
    password: string
}
