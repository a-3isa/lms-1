# Learning Management System (LMS)

A comprehensive Learning Management System built with NestJS, featuring course management, lesson delivery, quiz assessments, and progress tracking.

## Features

- **User Management**: Role-based authentication (Student, Teacher, Admin) with JWT tokens
- **Course Management**: Create, enroll, and manage courses with role-based access control
- **Lesson Delivery**: Organize and deliver course content through structured lessons
- **Assessment System**: Create and manage quizzes with multiple-choice questions
- **Progress Tracking**: Monitor student progress through lessons and quiz submissions
- **Email Notifications**: Automated email verification and notifications using Handlebars templates
- **Caching**: Redis-based caching for improved performance
- **Message Queue**: RabbitMQ integration for asynchronous processing
- **Security**: Helmet for security headers, rate limiting, and CORS configuration
- **Database**: PostgreSQL with TypeORM for data persistence
- **Docker Support**: Containerized deployment with Docker Compose

## Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Authentication**: JWT with Passport
- **Validation**: class-validator and class-transformer
- **Email**: Nodemailer with Handlebars templates
- **Testing**: Jest
- **Linting**: ESLint with Prettier

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_db_password
POSTGRES_DB=lms_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret

# Email
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Application
PORT=3000
NODE_ENV=development
```

## Docker Setup

The application includes Docker support for easy deployment:

```bash
# Start all services (PostgreSQL, Redis, RabbitMQ)
$ docker-compose up -d

# View logs
$ docker-compose logs -f

# Stop services
$ docker-compose down
```

## Installation & Running

```bash
# Install dependencies
$ npm install

# Run in development mode (with hot reload)
$ npm run start:dev

# Run in production mode
$ npm run start:prod

# Build the application
$ npm run build
```

## Testing

```bash
# Run unit tests
$ npm run test

# Run e2e tests
$ npm run test:e2e

# Run tests with coverage
$ npm run test:cov

# Run tests in watch mode
$ npm run test:watch
```

## API Endpoints

The LMS API provides the following main endpoints:

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/verify-email` - Email verification
- `POST /auth/forgot-password` - Password reset request

### Courses

- `GET /courses` - Get all courses (paginated)
- `POST /courses` - Create course (Teachers/Admins only)
- `GET /courses/:id` - Get course details
- `PATCH /courses/:id` - Update course
- `DELETE /courses/:id` - Delete course
- `POST /courses/:id/enroll` - Enroll in course
- `POST /courses/:id/unenroll` - Unenroll from course

### Lessons

- `GET /courses/:courseId/lessons` - Get course lessons
- `POST /courses/:courseId/lessons` - Create lesson (Course owner only)
- `GET /courses/:courseId/lessons/:id` - Get lesson details
- `PATCH /courses/:courseId/lessons/:id` - Update lesson
- `DELETE /courses/:courseId/lessons/:id` - Delete lesson

### Quizzes

- `GET /courses/:courseId/quizzes` - Get course quizzes
- `POST /courses/:courseId/quizzes` - Create quiz (Course owner only)
- `GET /courses/:courseId/quizzes/:id` - Get quiz details
- `PATCH /courses/:courseId/quizzes/:id` - Update quiz
- `DELETE /courses/:courseId/quizzes/:id` - Delete quiz
- `POST /courses/:courseId/quizzes/:id/submit` - Submit quiz answers

### Progress

- `POST /progress/lessons/:lessonId/complete` - Mark lesson complete
- `DELETE /progress/lessons/:lessonId/complete` - Mark lesson incomplete
- `GET /progress/courses/:courseId` - Get course progress

### User Management

- `GET /user/profile` - Get user profile
- `PATCH /user/profile` - Update user profile

## Project Structure

```
src/
├── app.module.ts                 # Main application module
├── main.ts                       # Application entry point
├── auth/                         # Authentication module
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── auth.service.ts
│   ├── dto/
│   ├── entities/
│   ├── guards/
│   └── strategies/
├── courses/                      # Course management module
│   ├── courses.controller.ts
│   ├── courses.module.ts
│   ├── courses.service.ts
│   ├── dto/
│   └── entities/
├── lessons/                      # Lesson management module
│   ├── lessons.controller.ts
│   ├── lessons.module.ts
│   ├── lessons.service.ts
│   ├── dto/
│   └── entities/
├── quizzes/                      # Quiz management module
│   ├── quizzes.controller.ts
│   ├── quizzes.module.ts
│   ├── quizzes.service.ts
│   ├── dto/
│   └── entities/
├── progress/                     # Progress tracking module
│   ├── progress.controller.ts
│   ├── progress.module.ts
│   ├── progress.service.ts
│   ├── dto/
│   └── entities/
├── user/                         # User management module
│   ├── user.controller.ts
│   ├── user.module.ts
│   ├── user.service.ts
│   ├── dto/
│   └── entities/
├── rabbitmq/                     # Message queue module
└── config/                       # Configuration files
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
