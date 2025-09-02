import { JwtModule } from '@nestjs/jwt'
import { Module } from '@nestjs/common'

import environment from 'src/environments'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'

@Module({
    imports: [
        JwtModule.register({
            global: true,
            secret: environment.JWT_SECRET,
            signOptions: { expiresIn: '60s' },
        }),
    ],
    controllers: [UsersController],
    providers: [UsersService],
})
export class UsersModule {}
