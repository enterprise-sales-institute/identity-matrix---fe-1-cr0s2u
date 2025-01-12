# Identity Matrix Backend Service

[![Build Status](https://github.com/identity-matrix/backend/workflows/CI/badge.svg)]
[![Coverage Status](https://coveralls.io/repos/github/identity-matrix/backend/badge.svg)]
[![Node Version](https://img.shields.io/node/v/identity-matrix)]

## Project Overview

Identity Matrix is a web-based visitor tracking and lead generation platform designed to de-anonymize website traffic for businesses. This repository contains the backend service implementation that powers the core functionality of the platform.

### System Requirements

- Node.js >= 18.0.0
- Docker >= 20.x
- Docker Compose >= 2.x
- PostgreSQL 14.x
- MongoDB 6.x
- Redis 7.x

### Architecture Overview

The backend service follows a microservices architecture pattern with the following key components:

- API Gateway: Request routing and authentication
- Tracking Service: Real-time visitor data collection
- Identity Service: De-anonymization engine
- Integration Service: CRM system connectors
- WebSocket Server: Real-time updates

### Key Features

- Real-time visitor tracking and identification
- CRM integration with major providers
- Team collaboration and access management
- Secure API with JWT authentication
- WebSocket-based real-time updates
- Data enrichment pipeline
- Comprehensive audit logging

### Technology Stack

- Runtime: Node.js 18.x LTS
- Language: TypeScript 4.9.x
- Web Framework: Express.js 4.x
- Database: PostgreSQL 14.x, MongoDB 6.x
- Caching: Redis 7.x
- Message Queue: RabbitMQ 3.x
- Testing: Jest 29.x
- Documentation: OpenAPI 3.0

### Security Considerations

- TLS 1.3 encryption for all communications
- JWT-based authentication with PKCE
- Role-based access control (RBAC)
- Data encryption at rest and in transit
- Rate limiting and DDoS protection
- Regular security audits and penetration testing

## Getting Started

### Prerequisites

```bash
# Install Node.js 18.x LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker and Docker Compose
sudo apt-get install docker.io docker-compose

# Verify installations
node --version
npm --version
docker --version
docker-compose --version
```

### Installation Steps

```bash
# Clone the repository
git clone https://github.com/identity-matrix/backend.git
cd backend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Generate security keys
npm run generate-keys
```

### Environment Configuration

Configure the following environment variables in `.env`:

```bash
# Application
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=identity_matrix
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# MongoDB
MONGO_URI=mongodb://localhost:27017/identity_matrix

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=1h

# Services
TRACKING_SERVICE_URL=http://localhost:3001
IDENTITY_SERVICE_URL=http://localhost:3002
INTEGRATION_SERVICE_URL=http://localhost:3003
```

### Docker Setup

```bash
# Start development environment
docker-compose up -d

# Verify services
docker-compose ps

# View logs
docker-compose logs -f
```

### Database Configuration

```bash
# Run database migrations
npm run migrate:up

# Seed initial data
npm run seed:dev
```

### Initial Setup Verification

```bash
# Run tests
npm run test

# Start development server
npm run dev

# Verify API health
curl http://localhost:3000/api/v1/health
```

## Development

### Local Development Setup

```bash
# Start development server with hot reload
npm run dev

# Watch for file changes
npm run watch

# Run linter
npm run lint

# Run type checking
npm run type-check
```

### Docker Development Environment

```yaml
# docker-compose.yml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - .:/app
    depends_on:
      - postgres
      - mongodb
      - redis

  postgres:
    image: postgres:14
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: identity_matrix
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: development

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"

  redis:
    image: redis:7
    ports:
      - "6379:6379"
```

### Testing Procedures

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test suite
npm test -- src/tests/auth.test.ts

# Run integration tests
npm run test:integration
```

### Code Style Guidelines

- Follow TypeScript best practices
- Use ESLint for code linting
- Implement error handling middleware
- Write comprehensive unit tests
- Document all public APIs
- Use meaningful variable names
- Keep functions small and focused

### Git Workflow

1. Create feature branch from `develop`
2. Implement changes with clear commits
3. Write/update tests
4. Submit pull request
5. Code review and approval
6. Merge to `develop`
7. Deploy to staging
8. Merge to `main` for production

## Project Structure

```
src/
├── api/              # API routes and controllers
├── config/           # Configuration files
├── services/         # Business logic services
├── models/           # Database models
├── middleware/       # Express middleware
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
├── tests/            # Test suites
└── app.ts           # Application entry point
```

## API Documentation

### Authentication Flows

- OAuth 2.0 + PKCE for secure authentication
- JWT tokens for API authorization
- Refresh token rotation
- Session management
- Rate limiting per client

### API Endpoints

Detailed API documentation is available at `/api/v1/docs` when running in development mode.

## Database

### PostgreSQL Schema

- Users and authentication
- Company profiles
- Team management
- Integration configurations
- Audit logs

### MongoDB Collections

- Visitor tracking data
- Activity logs
- Analytics data
- Temporary data storage

### Redis Cache

- Session management
- Rate limiting
- Real-time data
- API response cache

## Testing

### Coverage Requirements

- Minimum 80% code coverage
- Unit tests for all services
- Integration tests for API endpoints
- End-to-end tests for critical flows

## Deployment

### Build Process

```bash
# Create production build
npm run build

# Run production server
npm start
```

### Environment Configuration

- Use environment variables for configuration
- Implement secrets management
- Configure logging levels
- Set up monitoring and alerts

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.