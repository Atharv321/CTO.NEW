import { Injectable } from '@nestjs/common';
import { CreateUserDto, UpdateUserDto, UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  private users: UserDto[] = [
    {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      email: 'user@example.com',
      name: 'Regular User',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  create(createUserDto: CreateUserDto): UserDto {
    const user: UserDto = {
      id: Date.now().toString(),
      ...createUserDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  findAll(): UserDto[] {
    return this.users;
  }

  findOne(id: string): UserDto | null {
    return this.users.find(user => user.id === id) || null;
  }

  update(id: string, updateUserDto: UpdateUserDto): UserDto | null {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return null;
    }

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updateUserDto,
      updatedAt: new Date(),
    };

    return this.users[userIndex];
  }

  remove(id: string): boolean {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return false;
    }

    this.users.splice(userIndex, 1);
    return true;
  }
}