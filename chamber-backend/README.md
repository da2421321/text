# Chamber Backend

Gin + GORM + MySQL + JWT backend for chamber management.

## Features

- Login with JWT
- Organization CRUD
- Member CRUD
- Activity CRUD
- Fee bill CRUD
- Notice CRUD
- Admin-only protected routes

## Environment

Copy `.env.example` to `.env` and set real secrets before deployment.

Important variables:

- `APP_ENV`: use `development` locally and `production` in deployed environments
- `MYSQL_DSN`: application database connection string
- `JWT_SECRET`: must be strong and at least 32 characters
- `ADMIN_USERNAME` / `ADMIN_PASSWORD`: bootstrap admin account
- `TOKEN_EXPIRES_IN`: JWT lifetime in seconds

## Run Locally

```bash
cp .env.example .env
docker compose up --build
```

The API starts on `http://localhost:8080`.

## Login

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"change-me-admin-password\"}"
```

## API Prefix

- Health: `GET /api/v1/health`
- Login: `POST /api/v1/auth/login`
- Organizations: `/api/v1/organizations`
- Members: `/api/v1/members`
- Activities: `/api/v1/activities`
- Fees: `/api/v1/fees`
- Notices: `/api/v1/notices`

All routes except health and login require:

```text
Authorization: Bearer <token>
```
