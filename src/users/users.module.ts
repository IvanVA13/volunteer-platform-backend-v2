import { JwtModule } from '@nestjs/jwt'
import { Module } from '@nestjs/common'

import { UsersService } from './users.service'
import { UsersController } from './users.controller'

@Module({
    imports: [
        JwtModule.register({
            global: true,
        }),
    ],
    controllers: [UsersController],
    providers: [UsersService],
})
export class UsersModule {}
