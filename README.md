# Aether

<p align="center">
  <strong>A real-time chat platform built for scale, designed for calm.</strong>
</p>

<p align="center">
  <em>"Silent at rest. Alive on touch."</em>
</p>

---

## Overview

**Aether** is a production-grade, horizontally scalable real-time chat application. It is engineered to handle **10,000+ concurrent WebSocket connections** while maintaining a premium, distraction-free user experience.

The UI follows the **Obsidian Chrome** design system — a monochrome, performance-first aesthetic that prioritizes restraint over visual noise.

---

## Table of Contents

- [Features](#features)
- [Design System: Obsidian Chrome](#design-system-obsidian-chrome)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Local Development](#local-development)
- [API Reference](#api-reference)
- [Performance](#performance)
- [Security](#security)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Messaging
| Feature | Description |
|---------|-------------|
| **Real-Time Messaging** | Sub-100ms delivery via Socket.io + Redis Pub/Sub |
| **Message Receipts** | Sent → Delivered → Read status indicators |
| **Offline Support** | Messages queued and delivered on reconnection |
| **Typing Indicators** | Debounced "User is typing..." with auto-stop |

### Rich Media
| Feature | Description |
|---------|-------------|
| **Orbit Search** | Integrated music search (Spotify → YouTube audio) |
| **Voice Messages** | High-fidelity audio recording with waveform visualization |
| **Polls** | Real-time collaborative voting |
| **GIFs** | Giphy integration |
| **Location Sharing** | OpenStreetMap-based location picker |
| **File Uploads** | Images, videos, and documents |

### Advanced Engineering
| Feature | Description |
|---------|-------------|
| **Horizontal Scaling** | Multiple server instances synchronized via Redis Adapter |
| **Optimistic UI** | Messages appear instantly before server confirmation |
| **Cursor Pagination** | Infinite scroll with stable message ordering |
| **Thundering Herd Protection** | Exponential backoff + jitter for mass reconnections |
| **Graceful Shutdown** | Clean connection draining on deployment |

---

## Design System: Obsidian Chrome

Aether's UI follows the **Obsidian Chrome** design philosophy, which emphasizes:

### Core Principles

1.  **Monochrome Void**
    -   Pure black and gray palette (`mono-*` tokens).
    -   No accent colors except for semantic purposes (Red = Destructive, Green = Online).
    -   The interface disappears so conversations stand out.

2.  **Physical Interactions**
    -   Buttons (`ChromeButton`) feel heavy and deliberate.
    -   No bounce, no glow abuse. Interactions use subtle shadows and opacity shifts.
    -   State changes are driven by user action, not time.

3.  **Zero-Cost Idle**
    -   Near-zero GPU usage when the user is not interacting.
    -   No infinite animations (`animate-pulse`, `repeat: Infinity`).
    -   Canvas/particle effects halt completely after 3 seconds of inactivity.

### Component Library

| Component | Purpose |
|-----------|---------|
| `ChromeButton` | Primary button with metallic rim and pressure-like active state |
| `GlassPanel` | Container with subtle borders and shadow |
| `Modal` | Focus-trapped dialog with smooth scale transition |
| `Toast` | Non-blocking notifications |
| `CosmicLogo` | Brand logo with hover-triggered distortion effect |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           NGINX                                 │
│                     (Load Balancer + Sticky Sessions)           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  Backend #1   │       │  Backend #2   │       │  Backend #N   │
│  (Socket.io)  │◄─────►│  (Socket.io)  │◄─────►│  (Socket.io)  │
└───────┬───────┘       └───────┬───────┘       └───────┬───────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │ Redis Pub/Sub
                                ▼
                        ┌───────────────┐
                        │     Redis     │
                        │ (Session/Pub) │
                        └───────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │  PostgreSQL   │
                        │  (Messages)   │
                        └───────────────┘
```

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Node.js, Express, Socket.io, TypeScript |
| **Database** | PostgreSQL (write-optimized schema) |
| **Cache/Broker** | Redis (Cluster-ready) |
| **Load Balancer** | NGINX (sticky sessions for WebSocket) |
| **Orchestration** | Docker Compose |

---

## Project Structure

```
aether/
├── backend/
│   ├── src/
│   │   ├── config/           # Database & Redis setup
│   │   ├── middleware/       # Auth, rate limiting
│   │   ├── repositories/     # Data access layer
│   │   ├── routes/           # REST API endpoints
│   │   ├── socket/           # WebSocket handlers
│   │   └── index.ts          # Server entrypoint
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # UI components (Obsidian Chrome)
│   │   ├── pages/            # Login, Register, Home
│   │   ├── services/         # Socket client, API calls
│   │   ├── styles/           # Design tokens, global CSS
│   │   └── App.tsx
│   ├── Dockerfile
│   └── package.json
│
├── database/
│   └── schema.sql            # PostgreSQL schema
│
├── nginx/
│   └── nginx.conf            # Load balancer config
│
├── docker-compose.yml
├── ARCHITECTURE.md
└── README.md
```

---

## Getting Started

### Prerequisites

-   Docker & Docker Compose
-   Node.js 18+ (for local development)

### Run with Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/mahinigam/chat-platform.git
cd chat-platform

# Copy environment file
cp backend/.env.example backend/.env

# Start all services (scale backend to 4 instances)
docker-compose up -d --scale backend=4

# Access
# Frontend: http://localhost
# Backend:  http://localhost:3000
```

### Stop Services

```bash
docker-compose down       # Stop
docker-compose down -v    # Stop and remove volumes
```

---

## Local Development

### Backend

```bash
cd backend
npm install
npm run dev   # Runs on port 3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # Runs on port 5173
```

### Database

```bash
psql -h localhost -U postgres -d chat_platform
\i database/schema.sql
```

---

## API Reference

### WebSocket Events

| Direction | Event | Description |
|-----------|-------|-------------|
| **Client → Server** | `message:send` | Send a new message |
| | `message:delivered` | Mark as delivered |
| | `message:read` | Mark as read |
| | `typing:start` | User started typing |
| | `typing:stop` | User stopped typing |
| **Server → Client** | `message:new` | New message received |
| | `message:status` | Status update |
| | `typing:start` | Someone is typing |
| | `presence:change` | Online/offline status |

### REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login |
| `GET` | `/api/rooms` | Get user's rooms |
| `POST` | `/api/rooms` | Create new room |
| `GET` | `/api/messages/room/:id` | Get messages (cursor pagination) |

---

## Performance

### Scalability Targets

| Metric | Single Instance | 4 Instances |
|--------|-----------------|-------------|
| Concurrent Connections | ~2,500 | **10,000+** |
| Messages/Second | ~1,000 | ~4,000 |
| RAM | ~512MB | ~2GB |
| CPU | 2 cores @ 60% | 8 cores |

### Frontend Performance

| Metric | Target |
|--------|--------|
| Idle GPU Usage | < 5% |
| Time to Interactive | < 2s |
| Lighthouse Score | 90+ |

---

## Security

-   **Authentication**: JWT (access + refresh tokens)
-   **Rate Limiting**: Per-IP and per-user limits
-   **Input Validation**: Joi schemas
-   **SQL Injection**: Parameterized queries only
-   **Headers**: Helmet.js security headers
-   **CORS**: Strict origin whitelist

---

## Deployment

### Production Checklist

- [ ] Generate new `JWT_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Configure PostgreSQL backups
- [ ] Enable Redis persistence (AOF + RDB)
- [ ] Set up SSL/TLS via NGINX
- [ ] Configure monitoring (Prometheus + Grafana)
- [ ] Set up log aggregation

### Cloud Platforms

| AWS | GCP |
|-----|-----|
| ECS for containers | GKE for Kubernetes |
| RDS for PostgreSQL | Cloud SQL |
| ElastiCache for Redis | Memorystore |
| ALB for load balancing | Cloud Load Balancing |

---

## Contributing

1.  Fork the repository
2.  Create a feature branch (`git checkout -b feature/amazing-feature`)
3.  Commit your changes
4.  Push to the branch
5.  Open a Pull Request

---

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

<p align="center">
  <strong>Built for performance. Designed for peace.</strong>
</p>
