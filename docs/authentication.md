# Authentication, Tokens, and RBAC

This document outlines how authentication works in the API service, how long tokens live, and the environment secrets you must configure in each environment.

## Token Lifecycle

The API issues a *token pair* whenever a user successfully authenticates:

- **Access token** – A short-lived JWT signed with `JWT_ACCESS_SECRET`. It includes the user ID, email, display name, and role. The default lifetime is defined by `JWT_ACCESS_EXPIRES_IN` (15 minutes by default).
- **Refresh token** – A longer-lived JWT signed with `JWT_REFRESH_SECRET`. It is stored server-side in an in-memory store and is required to obtain new access tokens after the current access token expires. The default lifetime is controlled by `JWT_REFRESH_EXPIRES_IN` (7 days by default).

The refresh flow performs *token rotation*:

1. The client submits the refresh token to `POST /auth/refresh`.
2. The server validates that the token is still active in the refresh token store and verifies the JWT signature.
3. The old refresh token is revoked.
4. A new access/refresh pair is returned and must replace the previous tokens on the client.

Any attempt to reuse a revoked refresh token fails, which protects against token replay attacks. Calling `POST /auth/logout` explicitly revokes the refresh token presented in the request body.

## User Bootstrapping & RBAC

- The very first call to `POST /auth/register` (when no users exist) bootstraps the system by creating an administrator account without requiring authentication.
- Once at least one user exists, creating additional accounts requires an authenticated administrator. Non-admin users attempting to register further accounts receive a `403` response.
- Role-based guards enforce access:
  - `admin` – Full access, can manage users.
  - `manager` – Access to managerial endpoints such as `/secure/reports/daily`.
  - `staff` – Access to staff-level endpoints (add additional routes as needed).

The `/secure/*` sample routes demonstrate how the guards behave.

## Required Environment Secrets

Set the following environment variables for each deployed environment. Defaults exist for local development but **must** be overridden in production environments.

| Variable | Purpose | Example |
|----------|---------|---------|
| `JWT_ACCESS_SECRET` | Secret key used to sign access tokens. | `super-secure-access-secret` |
| `JWT_REFRESH_SECRET` | Secret key used to sign refresh tokens. | `super-secure-refresh-secret` |
| `JWT_ACCESS_EXPIRES_IN` | Human readable access token TTL. | `15m`, `30m` |
| `JWT_REFRESH_EXPIRES_IN` | Human readable refresh token TTL. | `7d`, `30d` |

### Recommendations

- Use unique secrets per environment and rotate them regularly.
- Store secrets in your secret manager (e.g., AWS Secrets Manager, Vault, Kubernetes Secrets) rather than in source control.
- Monitor refresh token store usage if you replace the in-memory implementation with a persistent store (Redis, database, etc.).
- Consider enforcing password strength on the client **and** server when integrating with a production datastore.

## Swagger / OpenAPI

The documentation exposed at `/docs` reflects the authentication flows and security schemes:

- `bearerAuth` – Standard HTTP Bearer scheme for access tokens.
- `refreshToken` – Documents the refresh token usage when calling `POST /auth/refresh`.

Whenever routes or scopes change, update `apps/api/src/docs/openapi.ts` accordingly to keep the documentation in sync.
