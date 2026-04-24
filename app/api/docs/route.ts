import { NextResponse } from 'next/server';

/**
 * OpenAPI/Swagger Documentation Endpoint
 * 
 * GET /api/docs
 * Returns OpenAPI 3.0 specification for the entire API
 */

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'SufiPulse API',
      version: '1.0.0',
      description: 'Complete REST API for SufiPulse - Sufi Music & Poetry Platform',
      contact: {
        name: 'SufiPulse Support',
        email: 'contact@sufipulse.com',
      },
    },
    servers: [
      {
        url: baseUrl,
        description: 'Local Development',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
          description: 'JWT access token in HTTP-only cookie',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            full_name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'writer', 'vocalist', 'producer', 'literary', 'studio', 'user'] },
            is_verified: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['full_name', 'email', 'password'],
          properties: {
            full_name: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            role: { type: 'string', enum: ['writer', 'vocalist', 'producer', 'literary', 'studio'] },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                code: { type: 'string' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
      },
    },
    paths: {
      '/api/auth/login': {
        post: {
          summary: 'Login user',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            '400': { description: 'Validation error' },
            '401': { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/register': {
        post: {
          summary: 'Register new user',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterRequest' },
              },
            },
          },
          responses: {
            '200': { description: 'Registration successful' },
            '400': { description: 'Validation error or email already exists' },
          },
        },
      },
      '/api/auth/logout': {
        post: {
          summary: 'Logout user',
          tags: ['Authentication'],
          security: [{ cookieAuth: [] }],
          responses: {
            '200': { description: 'Logout successful' },
          },
        },
      },
      '/api/auth/refresh': {
        post: {
          summary: 'Refresh access token',
          tags: ['Authentication'],
          responses: {
            '200': { description: 'Token refreshed successfully' },
            '401': { description: 'Invalid refresh token' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          summary: 'Get current user',
          tags: ['Authentication'],
          security: [{ cookieAuth: [] }],
          responses: {
            '200': {
              description: 'User data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            '401': { description: 'Not authenticated' },
          },
        },
      },
      '/api/releases': {
        get: {
          summary: 'List all releases',
          tags: ['Releases'],
          parameters: [
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by status',
            },
          ],
          responses: {
            '200': { description: 'List of releases' },
          },
        },
        post: {
          summary: 'Create new release',
          tags: ['Releases'],
          security: [{ cookieAuth: [] }],
          responses: {
            '200': { description: 'Release created' },
            '400': { description: 'Validation error' },
          },
        },
      },
    },
  };

  return NextResponse.json(openApiSpec, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}
