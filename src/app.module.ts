import { Module, Global } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { UsersModule } from './users/users.module'
import { RequestsModule } from './requests/requests.module'

@Global()
@Module({
    imports: [UsersModule, RequestsModule],
    controllers: [],
    providers: [PrismaService],
    exports: [PrismaService],
})
export class AppModule {}
