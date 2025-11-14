import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'password123', description: 'User password' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'user@example.com', description: 'User email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'newpassword123', description: 'User password' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}

export class UserDto {
  @ApiProperty({ example: '1', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  email: string;

  @ApiPropertyOptional({ example: 'John Doe', description: 'User full name' })
  name?: string;

  @ApiProperty({ example: '2023-11-14T10:30:00.000Z', description: 'User creation date' })
  createdAt: Date;

  @ApiProperty({ example: '2023-11-14T10:30:00.000Z', description: 'User last update date' })
  updatedAt: Date;
}