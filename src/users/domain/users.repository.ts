import { Role, User } from '@prisma/client';

export type CreateUserData = {
  email: string;
  passwordHash: string;
  role?: Role;
};

export interface UsersRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
}

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');