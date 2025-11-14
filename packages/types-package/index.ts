// User and authentication types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  createdAt: Date
  updatedAt: Date
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  USER = 'user'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

// Authentication types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: UserRole
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface JwtPayload {
  sub: string // user id
  email: string
  role: UserRole
  iat: number
  exp: number
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Common entity types
export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

// Environment configuration types
export interface DatabaseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
}

export interface JwtConfig {
  secret: string
  refreshSecret: string
  accessExpiresIn: string
  refreshExpiresIn: string
}

export interface AppConfig {
  port: number
  nodeEnv: string
  database: DatabaseConfig
  jwt: JwtConfig
}