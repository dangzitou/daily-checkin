# Contributing to Daily Checkin

Thank you for your interest in contributing to Daily Checkin! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

Please be respectful to all contributors. We follow the standard open-source code of conduct.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/daily-checkin.git
   cd daily-checkin
   ```
3. **Install dependencies**:
   ```bash
   pnpm install
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (for database)

### Local Setup

```bash
# Start database services
docker compose up -d mysql redis

# Copy environment file
cp .env.example .env

# Generate Prisma client
pnpm --filter @daily-checkin/api prisma:generate

# Run database migrations
pnpm --filter @daily-checkin/api prisma:migrate

# Start development servers
pnpm dev
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run API tests only
pnpm --filter @daily-checkin/api test

# Run web tests only
pnpm --filter @daily-checkin/web test

# Run tests with coverage
pnpm test:coverage
```

### Building

```bash
# Build all packages
pnpm build

# Build Docker images
docker compose build
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```
feat(api): add goal tracking endpoint
fix(web): resolve calendar date selection bug
docs: update README installation steps
test(api): add unit tests for checkin service
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**:
   ```bash
   pnpm test
   ```
4. **Update the README** if you're adding new features
5. **Create a Pull Request** with a clear description
6. **Wait for review** and address any feedback

### PR Description Template

```markdown
## Description

Brief description of the changes.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring

## Testing

Describe the tests you ran.

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have added tests that prove my fix/feature works
- [ ] All new and existing tests pass
- [ ] I have updated the documentation accordingly
```

## Reporting Issues

When reporting issues, please include:

1. **Description**: Clear description of the problem
2. **Steps to Reproduce**: Step-by-step instructions
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: OS, Node.js version, browser, etc.
6. **Screenshots**: If applicable

## Development Tips

### Project Structure

```
apps/api     - NestJS backend (REST API)
apps/web     - Vue 3 frontend (SPA)
deploy/      - Deployment configurations
docs/        - Documentation
```

### Key Technologies

- **Backend**: NestJS, Prisma, MySQL, Redis
- **Frontend**: Vue 3, Vite, Pinia, Vue Router
- **Testing**: Vitest
- **Build**: pnpm workspaces, Docker

### Debugging

```bash
# API logs
docker compose logs -f api

# Web dev server
pnpm --filter @daily-checkin/web dev

# Database GUI
pnpm --filter @daily-checkin/api prisma:studio
```

## Questions?

Feel free to open an issue for any questions about contributing.

Thank you for contributing! 🎉
