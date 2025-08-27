import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { User } from '../generated/prisma';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}
  async getHello(): Promise<User | null> {
    return await this.prisma.user.findFirst();
  }
}
