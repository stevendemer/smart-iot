import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DbService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  // async cleanDatabase() {
  //   if (process.env.NODE_ENV === 'production') return;
  //   return Promise.all([this.user.deleteMany({})]);
  // }
}
