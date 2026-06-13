# Daily Checkin 📅

A lightweight daily habit tracking and task management app built with Vue 3 and NestJS.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-red.svg)](https://nestjs.com/)

## ✨ Features

- **Daily Checkin** - Track daily habits with streak counting
- **Task Management** - Support both recurring and one-time tasks
- **Calendar View** - Visual overview of your progress
- **Goal Setting** - Set and track weekly/monthly goals
- **Points System** - Earn points for daily checkins
- **Prize Shop** - Redeem points for prizes (admin configurable)
- **Admin Panel** - Manage prizes and view redemptions
- **Email Reminders** - Optional SMTP notifications
- **Responsive Design** - Works great on mobile (PWA ready)
- **Self-hosted** - Full control over your data

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (for production)

### Local Development

```bash
# Clone the repository
git clone https://github.com/dangzitou/daily-checkin.git
cd daily-checkin

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env

# Generate Prisma client
pnpm --filter @daily-checkin/api prisma:generate

# Run database migrations
pnpm --filter @daily-checkin/api prisma:migrate

# Run tests
pnpm test

# Start development servers
pnpm dev
```

The API will be available at `http://localhost:3000` and the web app at `http://localhost:5173`.

### Production Deployment

```bash
# Copy and edit environment file
cp .env.example .env
# Edit .env with your database credentials and secrets

# Start with Docker Compose
docker compose up -d --build

# Set up admin user (after first user registers)
pnpm --filter @daily-checkin/api ts-node scripts/set-admin.ts <username>
```

Access the app at `http://localhost/`

## 🎯 Points System

### Earning Points

| Action | Points |
|--------|--------|
| Daily checkin | +10 points |
| 7-day streak bonus | +50 points |

### Redeeming Points

Users can redeem points for prizes configured by admins in the prize shop.

## 👑 Admin Features

Admins can:
- Add, edit, and deactivate prizes
- View all redemptions
- Update redemption status (pending → completed → delivered)

To make a user an admin:
```bash
pnpm --filter @daily-checkin/api ts-node scripts/set-admin.ts <username>
```

## 📁 Project Structure

```
daily-checkin/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── prisma/            # Database schema & migrations
│   │   └── src/
│   │       ├── domain/        # Business logic
│   │       └── modules/       # NestJS modules
│   │           ├── auth/      # Authentication
│   │           ├── checkins/  # Checkin records
│   │           ├── goals/     # Goal management
│   │           ├── points/    # Points system
│   │           ├── prizes/    # Prize management
│   │           ├── redemptions/ # Redemption records
│   │           ├── stats/     # Statistics
│   │           └── tasks/     # Task management
│   └── web/                   # Vue 3 frontend
│       └── src/
│           ├── components/    # Vue components
│           ├── views/         # Page views
│           └── stores/        # Pinia stores
├── deploy/                    # Deployment configs
└── docs/                      # Documentation
```

## 🛠 Tech Stack

### Backend
- **Framework**: NestJS 10
- **Database**: MySQL 8 + Prisma ORM
- **Cache**: Redis
- **Language**: TypeScript 5

### Frontend
- **Framework**: Vue 3 + Vite
- **State**: Pinia
- **Router**: Vue Router 4
- **Styling**: CSS (no framework dependency)

### DevOps
- **Container**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitHub Actions

## 📖 API Documentation

The API follows RESTful conventions:

### Authentication
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login (username or ID) |

### Tasks
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET | List user tasks |
| `/api/tasks` | POST | Create new task |
| `/api/tasks/:id` | PUT | Update task |
| `/api/tasks/:id` | DELETE | Delete task |

### Checkins
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/checkins` | POST | Record a checkin |
| `/api/checkins/calendar` | GET | Get calendar data |

### Points
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/points/balance` | GET | Get points balance |
| `/api/points/logs` | GET | Get points history |

### Prizes (Public)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/prizes` | GET | List available prizes |
| `/api/prizes/:id` | GET | Get prize details |

### Prizes (Admin Only)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/prizes` | POST | Create prize |
| `/api/prizes/:id` | PUT | Update prize |
| `/api/prizes/:id` | DELETE | Deactivate prize |

### Redemptions
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/redemptions` | POST | Redeem a prize |
| `/api/redemptions/my` | GET | Get user's redemptions |
| `/api/redemptions/all` | GET | Get all redemptions (admin) |
| `/api/redemptions/:id/status` | PUT | Update status (admin) |

## 🔧 Configuration

Environment variables in `.env`:

```bash
# Database
DATABASE_URL=mysql://user:password@localhost:3306/daily_checkin

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=your-secret-key
COOKIE_SECURE=false  # Set to true for HTTPS

# SMTP (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-user
SMTP_PASS=your-password
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [NestJS](https://nestjs.com/) and [Vue.js](https://vuejs.org/)
- Inspired by habit tracking methodologies
- UI components designed for mobile-first experience

## 📧 Contact

- GitHub: [@dangzitou](https://github.com/dangzitou)
