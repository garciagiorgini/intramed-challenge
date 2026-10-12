import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY } from '../domain/users.repository';
import type { UsersRepository } from '../domain/users.repository';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepository,
  ) {}

  findByEmail(email: string) {
    return this.usersRepository.findByEmail(email);
  }
}