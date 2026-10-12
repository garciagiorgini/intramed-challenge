import { Module } from '@nestjs/common';
import { UsersService } from './application/users.service';
import { PrismaUsersRepository } from './infrastructure/prisma-users.repository';
import { USERS_REPOSITORY } from './domain/users.repository';

@Module({
  providers: [UsersService ,PrismaUsersRepository,{
    provide: USERS_REPOSITORY,
    useExisting: PrismaUsersRepository,
  }],
  exports: [UsersService, USERS_REPOSITORY],
})
export class UsersModule {}
