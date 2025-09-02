import { Module } from '@nestjs/common'

import { RequestsModule } from './requests/requests.module'
import { DbModule } from './db/db.module'

@Module({
    imports: [RequestsModule, DbModule],
})
export class AppModule {}
