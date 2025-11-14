import type { OpenAPIV3 } from 'openapi-types';

const userSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    role: { type: 'string', enum: ['admin', 'manager', 'staff'] },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time', nullable: true },
  },
};

const tokenSchema: OpenAPIV3.SchemaObject = {
  type: 'object',
  properties: {
    accessToken: { type: 'string', description: 'JWT access token' },
    refreshToken: { type: 'string', description: 'JWT refresh token' },
  },
};

export const openApiDocument: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'Inventory API - Authentication',
    version: '1.0.0',
    description:
      'Authentication and authorization module for the inventory management system. Includes JWT access and refresh token flows and role-based access control.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local development' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token obtained from the login endpoint',
      },
      refreshToken: {
        type: 'apiKey',
        in: 'header',
        name: 'x-refresh-token',
        description: 'Refresh token value issued alongside the access token. Send in the request body or header when refreshing.',
      },
    },
    schemas: {
      User: userSchema,
      AuthTokens: tokenSchema,
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          tokens: { $ref: '#/components/schemas/AuthTokens' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register user (bootstrap + admin-managed)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                  role: { type: 'string', enum: ['admin', 'manager', 'staff'] },
                },
                required: ['email', 'password', 'name'],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: { description: 'Validation error' },
          409: { description: 'Email already registered' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate user and issue tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token using a refresh token',
        security: [{ refreshToken: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string' },
                },
                required: ['refreshToken'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'New token pair issued',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AuthResponse' },
              },
            },
          },
          400: { description: 'Missing refresh token' },
          401: { description: 'Invalid refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Revoke the current refresh token',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          204: { description: 'Refresh token revoked' },
          401: { description: 'Authentication required' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Return the authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Authenticated user data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Authentication required' },
        },
      },
    },
    '/secure/reports/daily': {
      get: {
        tags: ['Protected'],
        summary: 'Sample RBAC-protected route for admin/manager roles',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Report payload',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    generatedAt: { type: 'string', format: 'date-time' },
                    requestedBy: { $ref: '#/components/schemas/User' },
                    totals: {
                      type: 'object',
                      additionalProperties: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Authentication required' },
          403: { description: 'Forbidden - role mismatch' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'Authentication', description: 'Authentication and token management endpoints' },
    { name: 'Protected', description: 'Endpoints secured with RBAC guards' },
  ],
};
