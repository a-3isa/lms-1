# LMS API

A NestJS REST API for a learning management system: students, teachers and admins; courses with lessons and quizzes; automatic quiz grading; per-course progress; and email verification sent through a RabbitMQ queue.

## Overview

Teachers create courses and add lessons and multiple-choice quizzes to them. Students enrol, mark lessons complete and submit quizzes; the API grades each submission and records it. A course's progress view combines completed lessons and quiz results. New accounts get a verification email, and only verified accounts can log in.

## Features

- **Accounts:** registration with email verification, login with bcrypt-hashed passwords and 7-day JWTs, and three roles: student, teacher and admin. Every route except register, login and verify needs a token.
- **Courses:** paginated listing; teachers and admins create courses; only the course's teacher or an admin can change or delete it; students enrol and unenrol.
- **Lessons and quizzes:** nested under a course and managed by its teacher. Quizzes have questions with options; students never see which option is correct.
- **Grading and progress:** `POST /courses/:courseId/quizzes/:id/submit` scores the answers and records the submission; students mark lessons complete; `GET /progress/courses/:courseId` reports both.
- **Email:** registration publishes a message to a RabbitMQ topic exchange; a subscriber renders a Handlebars template and sends it over SMTP.
- **Protection:** Helmet headers, a CORS allow-list, a global rate limit of 100 requests a minute, validation that rejects unknown fields, and password hashes stripped from every response.

## Architecture

```mermaid
flowchart LR
    client[Client] -->|JWT| api
    subgraph api[NestJS API]
        direction TB
        guards[Rate limit, JWT guard,<br/>role and course-owner guards] --> modules[Auth, users, courses,<br/>lessons, quizzes, progress]
    end
    api -->|TypeORM| pg[(PostgreSQL)]
    api -->|publish| mq[[RabbitMQ<br/>email_exchange]]
    mq -->|email_queue| mailer[Email subscriber] -->|SMTP| smtp[Mail server]
```

## Tech stack

NestJS 11, TypeScript, PostgreSQL with TypeORM, Passport JWT, bcrypt, class-validator, `@nestjs/throttler`, Helmet, RabbitMQ (`@golevelup/nestjs-rabbitmq`), Nodemailer with Handlebars templates (`@nestjs-modules/mailer`), cache-manager, Jest, ESLint and Prettier.

## Getting started

You need Node.js 20 or later (`.nvmrc` pins 22), PostgreSQL and RabbitMQ, plus an SMTP account to send verification emails.

```bash
git clone https://github.com/a-3isa/lms-1
cd lms-1
npm ci
cp .env.example .env                  # then fill in the values
```

The app reads `.env`, or `.env.production` when `NODE_ENV=production`.

| Variable | Required | Purpose |
|---|---|---|
| `PORT` | no (3000) | HTTP port |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | yes | PostgreSQL connection. TypeORM creates and updates the tables on start (`synchronize: true`). |
| `JWT_SECRET` | yes | Signs login and verification tokens; the app will not start without it |
| `RABBITMQ_URL` | yes | e.g. `amqp://guest:guest@localhost:5672` |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS` | for emails | SMTP server for verification emails |
| `REDIS_HOST`, `REDIS_PORT` | no | Intended cache store; currently ignored (see known issues) |

`docker-compose.yml` starts PostgreSQL 15, RabbitMQ (management UI on 15672) and Redis, reading `POSTGRES_*` from `.env`. Then run the API on the host:

```bash
docker compose up -d
npm run start:dev                     # watch mode, http://localhost:3000
```

For a production build: `npm run build`, then `npm run start:prod`.

**Roles.** Registration always creates a student. Promote teachers and the first admin in the database; after that, admins can create admins with `POST /auth/adminRegister`.

```sql
UPDATE users SET role = 'admin', verified = true WHERE email = 'you@example.com';
```

## Docker

The `Dockerfile` builds the API image (`docker build -t lms .`). The `app` service in `docker-compose.yml` is commented out, so compose runs only the backing services.

## API

All routes except register, login and verify need `Authorization: Bearer <token>`.

| Area | Route | Who |
|---|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` | Anyone |
| | `GET /auth/verify?token=` (link in the verification email) | See known issues |
| | `POST /auth/adminRegister` | Admin |
| Users | `GET /user/me`, `PATCH /user` (own profile and password) | Signed in |
| | `GET /user`, `GET /user/:id`, `DELETE /user/:id` | Admin |
| Courses | `GET /courses?page=&limit=`, `GET /courses/:id`, `POST /courses/:id/enroll`, `POST /courses/:id/unenroll` | Signed in |
| | `POST /courses` | Teacher, admin |
| | `PATCH /courses/:id`, `DELETE /courses/:id` | Course teacher, admin |
| Lessons | `GET /courses/:courseId/lessons[/:id]` | Signed in |
| | `POST`, `PATCH`, `DELETE /courses/:courseId/lessons[/:id]` | Course teacher, admin |
| Quizzes | `GET /courses/:courseId/quizzes[/:id]`, `POST /courses/:courseId/quizzes/:id/submit` | Signed in |
| | `POST`, `PATCH`, `DELETE /courses/:courseId/quizzes[/:id]` | Course teacher, admin |
| Progress | `POST`, `DELETE /progress/lessons/:lessonId/complete`, `GET /progress/courses/:courseId` | Signed in |

## Project structure

```
src/
  auth/        register, login, verification, JWT strategy and guard, role guard
  user/        profile and admin user management
  courses/     courses and enrolment
  lessons/     lessons and the course-owner guard
  quizzes/     quizzes, questions, options, grading
  progress/    lesson completion and quiz submissions
  rabbitmq/    queue publisher
templates/     Handlebars email templates
docker/        images for the compose services
```

## Testing and checks

```bash
npm test               # unit tests (Jest)
npm run lint           # ESLint, no fixes applied
npm run format:check   # Prettier
npm run build
```

The unit tests cover token validation, email verification, duplicate usernames, the role guard and the course-owner guard. `test/app.e2e-spec.ts` is still the NestJS starter test (it expects `GET /` to return "Hello World!", a route this app does not have), so `npm run test:e2e` does not pass. CI runs lint, format check, build and unit tests, and builds the Docker image, on every pull request and on pushes to `master`.

## Security notes

- Passwords are hashed with bcrypt and never returned. Login gives the same answer for an unknown user, a wrong password and an unverified account.
- Only tokens that name a user authenticate; verification tokens cannot be used as login tokens. Usernames are kept unique because they identify accounts.
- Course, lesson and quiz changes need the course's teacher or an admin; creating admins needs an admin.
- Request bodies are validated with whitelisting and unknown fields are rejected.
- Login and every other route share a rate limit of 100 requests a minute per client.
- Secrets come from the environment; `.env*` files other than `.env.example` are git-ignored. See [SECURITY.md](SECURITY.md) to report a vulnerability.

## Known issues and roadmap

These are bugs in the current code, recorded here rather than hidden:

- **Email verification does not complete.** The verification link is a `GET`, but the JWT guard only lets `POST /auth/verify` through without a token. Also, the global rate-limit guard runs on the RabbitMQ consumer and throws, so the verification email is never sent. Until both are fixed, verify accounts in the database (see Roles above).
- **`GET /user/me` returns 500**: it loads a `cart` relation that this app does not have.
- **Course listings include every enrolled student's username and email**, visible to any signed-in user.
- **The cache is in memory, not in Redis**: `cache-manager-redis-store` is not compatible with cache-manager 7, so the Redis settings are ignored.
- The Swagger decorators are in place, but no Swagger UI is mounted.
- Planned: migrations instead of `synchronize`, real end-to-end tests, and upgrades to nodemailer 10 and bcrypt 6.

## License and author

UNLICENSED: the source is public for portfolio review, and no licence is granted to reuse it. Built by Ahmed Ibrahim Hussien ([a-3isa](https://github.com/a-3isa)).
