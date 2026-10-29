# Learning Management System (LMS)

A NestJS REST API for course management, lesson delivery, quizzes and progress tracking, with Redis caching and RabbitMQ for background work.

## Features

- **Users and roles**: Student, Teacher and Admin with JWT authentication
- **Courses**: create, enroll, unenroll, with role-based access control
- **Lessons**: structured content per course
- **Quizzes**: multiple-choice quizzes with submission
- **Progress**: lesson completion and per-course progress
- **Email**: verification and notifications via Handlebars templates
- **Infrastructure**: Redis cache, RabbitMQ queue, Helmet, rate limiting, CORS
- **Docker Compose** for PostgreSQL, Redis and RabbitMQ

## Tech stack

NestJS, TypeScript, PostgreSQL, TypeORM, Redis, RabbitMQ, Passport/JWT, class-validator, Nodemailer + Handlebars, Jest, ESLint + Prettier.

## Getting started

Prerequisites: Node.js 18+, Docker.

```bash
git clone https://github.com/a-3isa/lms-1
cd lms-1
npm install
docker-compose up -d     # PostgreSQL, Redis, RabbitMQ
```

Create `.env`:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=lms_db

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=change-me

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password

RABBITMQ_URL=amqp://localhost:5672

PORT=3000
NODE_ENV=development
```

Make sure the PostgreSQL values match those in `docker-compose.yml`.

```bash
npm run start:dev                      # development
npm run build && npm run start:prod    # production
```

## API overview

- **Auth**: `POST /auth/register`, `/auth/login`, `/auth/verify-email`, `/auth/forgot-password`
- **Courses**: `GET|POST /courses`, `GET|PATCH|DELETE /courses/:id`, `POST /courses/:id/enroll`, `/unenroll`
- **Lessons**: `/courses/:courseId/lessons` and `/:id` (create/update/delete: course owner only)
- **Quizzes**: `/courses/:courseId/quizzes`, `/:id`, `POST /:id/submit`
- **Progress**: `POST|DELETE /progress/lessons/:lessonId/complete`, `GET /progress/courses/:courseId`
- **Profile**: `GET|PATCH /user/profile`

## Structure

```
src/
  auth/  courses/  lessons/  quizzes/  progress/  user/   feature modules
  rabbitmq/                                              queue module
  config/                                                configuration
```

## Testing

```bash
npm run test
npm run test:e2e
npm run test:cov
```

## License

UNLICENSED.
