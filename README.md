<div align="center">

<br/>

```
░█████╗░██████╗░███████╗██╗░░██╗███╗░░██╗░█████╗░██╗░░░██╗░█████╗░
██╔══██╗██╔══██╗██╔════╝╚██╗██╔╝████╗░██║██╔══██╗██║░░░██║██╔══██╗
███████║██████╔╝█████╗░░░╚███╔╝░██╔██╗██║██║░░██║╚██╗░██╔╝███████║
██╔══██║██╔═══╝░██╔══╝░░░██╔██╗░██║╚████║██║░░██║░╚████╔╝░██╔══██║
██║░░██║██║░░░░░███████╗██╔╝╚██╗██║░╚███║╚█████╔╝░░╚██╔╝░░██║░░██║
╚═╝░░╚═╝╚═╝░░░░░╚══════╝╚═╝░░╚═╝╚═╝░░╚══╝░╚════╝░░░░╚═╝░░░╚═╝░░╚═╝

░█████╗░██████╗░███████╗███╗░░██╗░█████╗░
██╔══██╗██╔══██╗██╔════╝████╗░██║██╔══██╗
███████║██████╔╝█████╗░░██╔██╗██║███████║
██╔══██║██╔══██╗██╔══╝░░██║╚████║██╔══██║
██║░░██║██║░░██║███████╗██║░╚███║██║░░██║
╚═╝░░╚═╝╚═╝░░╚═╝╚══════╝╚═╝░░╚══╝╚═╝░░╚═╝
```

<h3>⚡ Where Champions Rise · Built for Competitors · Engineered for Scale ⚡</h3>

<br/>

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](./frontend)
[![Laravel](https://img.shields.io/badge/Laravel_11-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](./backend)
[![PHP](https://img.shields.io/badge/PHP_8.3-777BB4?style=for-the-badge&logo=php&logoColor=white)](./backend)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](./backend)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](./backend)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](./frontend)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](./frontend)
[![WebSockets](https://img.shields.io/badge/WebSockets-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://github.com/laravel/reverb)

<br/>

> **ApexNova Arena** is a full-stack competitive gaming platform with real-time tournament brackets, skill-based matchmaking, live leaderboards, and an in-game social ecosystem — powered by a Laravel + React + WebSocket architecture.

<br/>

[🚀 Quick Start](#-quick-start) &nbsp;·&nbsp; [🏗️ Architecture](#-architecture) &nbsp;·&nbsp; [📡 API Docs](#-api-reference) &nbsp;·&nbsp; [🗺️ Roadmap](#-roadmap) &nbsp;·&nbsp; [🤝 Contributing](#-contributing)

---

</div>

## 📸 Screenshots

> _Frontend UI previews coming soon — first release in progress_

---

## ✨ Feature Overview

| Module | Features |
|---|---|
| 🎮 **Games** | Multi-game support, real-time sync, skill-based matchmaking, session analytics |
| 🏆 **Tournaments** | Bracket generation, automated scoring, prize pool management, live feeds |
| 📊 **Rankings** | Global leaderboards, division tiers, ELO-style rating, achievement system |
| 👥 **Social** | Friend requests, real-time chat, game invitations, presence tracking |
| 🔐 **Auth** | JWT + OTP email verification, role-based access, secure profile management |
| 📡 **Real-time** | WebSocket events via Laravel Reverb — live scores, notifications, messaging |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                            │
│              React 18 + Vite + TailwindCSS + Axios                  │
│         WebSocket Client ←────────────────────────────┐             │
└──────────────────────────────┬──────────────────────── │ ───────────┘
                               │ REST API                │ WS
┌──────────────────────────────▼──────────────────────── │ ───────────┐
│                       BACKEND (Laravel 11)              │             │
│                                                         │             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────▼──────────┐ │
│  │ Controllers │  │  Middleware  │  │   Laravel Reverb (Reverb)   │ │
│  │  (REST API) │  │ JWT + RBAC   │  │   WebSocket Broadcasting    │ │
│  └──────┬──────┘  └──────────────┘  └─────────────────────────────┘ │
│         │                                                             │
│  ┌──────▼──────────────────────────────────────────┐                 │
│  │                   Eloquent ORM                   │                 │
│  └──────┬──────────────────────┬───────────────────┘                 │
└─────────│──────────────────────│─────────────────────────────────────┘
          │                      │
┌─────────▼──────────┐  ┌───────▼──────────┐  ┌──────────────────────┐
│    PostgreSQL DB    │  │  Redis (Cache)   │  │  Cloudinary (Media)  │
│  Primary datastore  │  │  Sessions + Q    │  │  Avatars & Assets    │
└────────────────────┘  └──────────────────┘  └──────────────────────┘
```

---

## ⚡ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | Component-based SPA |
| **Vite** | Next-gen build tooling |
| **TailwindCSS** | Utility-first styling |
| **Axios** | HTTP client with interceptors |
| **Laravel Echo** | WebSocket client integration |

### Backend
| Technology | Purpose |
|---|---|
| **Laravel 11** | MVC framework + REST API |
| **PHP 8.3** | Language runtime |
| **Laravel Sanctum / JWT** | Token-based authentication |
| **Laravel Reverb** | Native WebSocket server |
| **Laravel Mail** | OTP + transactional email |

### Infrastructure
| Technology | Purpose |
|---|---|
| **PostgreSQL** | Primary relational database |
| **Redis** | Caching + queue + sessions |
| **Cloudinary** | Cloud media storage |

---

## 📁 Project Structure

```
ApexNova-Arena/
│
├── 📦 frontend/                    # React + Vite SPA
│   └── src/
│       ├── components/             # Reusable UI components
│       ├── pages/                  # Route-level page components
│       ├── hooks/                  # Custom React hooks
│       ├── context/                # Global state (Context API)
│       ├── config/                 # API base URLs, constants
│       └── assets/                 # Icons, images, fonts
│
├── 🔧 backend/                     # Laravel 11 API
│   └── app/
│       ├── Models/                 # Eloquent models
│       ├── Http/
│       │   ├── Controllers/        # API controllers
│       │   └── Middleware/         # JWT, rate-limiting, RBAC
│       ├── Events/                 # Broadcastable events
│       ├── Mail/                   # Mailable classes
│       └── Providers/              # Service providers
│   └── database/
│       ├── migrations/             # Schema definitions
│       ├── factories/              # Fake data factories
│       └── seeders/                # Database seeders
│   └── routes/
│       ├── api.php                 # REST API routes
│       └── channels.php            # Broadcasting channel definitions
│
└── .gitignore
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ & npm
- **PHP** 8.3+ & Composer
- **PostgreSQL** 14+
- **Redis** (optional, recommended)

---

### 1. Clone the Repository

```bash
git clone https://github.com/aky2004/ApexNova-Arena.git
cd ApexNova-Arena
```

### 2. Backend Setup

```bash
cd backend

# Install PHP dependencies
composer install

# Configure environment
cp .env.example .env
php artisan key:generate

# Set up database
php artisan migrate --seed

# Start the server
php artisan serve

# (Optional) Start WebSocket server
php artisan reverb:start
```

### 3. Frontend Setup

```bash
cd frontend

# Install JS dependencies
npm install

# Start dev server
npm run dev
```

### 4. Environment Variables

**`backend/.env`**
```env
APP_NAME=ApexNova-Arena
APP_ENV=local
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=apexnova
DB_USERNAME=your_username
DB_PASSWORD=your_password

JWT_SECRET=your_jwt_secret_here

REVERB_APP_ID=your_reverb_app_id
REVERB_APP_KEY=your_reverb_app_key
REVERB_APP_SECRET=your_reverb_app_secret

CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name

MAIL_MAILER=smtp
MAIL_HOST=your_mail_host
MAIL_PORT=587
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_password
```

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_HOST=localhost
VITE_WS_PORT=8080
```

---

## 📡 API Reference

### Authentication

```http
POST   /api/auth/register          Register new player
POST   /api/auth/login             Login + receive JWT
POST   /api/auth/verify-otp        Email OTP verification
POST   /api/auth/logout            Invalidate token
```

### Games

```http
GET    /api/games                  List all available games
GET    /api/games/{id}             Get game details
POST   /api/games/{id}/play        Create a game session
```

### Tournaments

```http
GET    /api/tournaments            Browse all tournaments
POST   /api/tournaments            Create a tournament
POST   /api/tournaments/{id}/join  Join a tournament
GET    /api/tournaments/{id}/brackets  View bracket progression
```

### Rankings

```http
GET    /api/rankings               Global leaderboard
GET    /api/rankings/{userId}      Player ranking profile
GET    /api/rankings/stats         Aggregate analytics
```

### Social

```http
GET    /api/friends                List friends
POST   /api/friends/{userId}       Send friend request
PUT    /api/friends/{userId}/accept  Accept request
DELETE /api/friends/{userId}       Remove friend
```

---

## 🗄️ Database Schema (Core Entities)

```
users               → id, username, email, avatar, rating, created_at
games               → id, name, type, max_players, config
game_rooms          → id, game_id, host_id, status, started_at
game_scores         → id, room_id, user_id, score, result
tournaments         → id, name, game_id, host_id, bracket_type, prize_pool, status
tournament_entries  → id, tournament_id, user_id, seed
game_invites        → id, sender_id, receiver_id, room_id, status
friendships         → id, user_id, friend_id, accepted_at
room_messages       → id, room_id, user_id, message, created_at
rankings            → id, user_id, game_id, elo, division, wins, losses
```

---

## 🔄 Real-time Events (WebSockets)

| Event | Channel | Trigger |
|---|---|---|
| `GameUpdated` | `game.{roomId}` | Score change or state update |
| `TournamentBracketUpdated` | `tournament.{id}` | Match result recorded |
| `NewMessage` | `room.{roomId}` | Chat message sent |
| `FriendRequestReceived` | `user.{userId}` | Friend request sent |
| `GameInviteReceived` | `user.{userId}` | Invite dispatched |

---

## 🗺️ Roadmap

```
Phase 1 — Foundation ✅
  [x] Auth system (JWT + OTP)
  [x] Games module
  [x] Tournament system
  [x] Ranking engine
  [x] Real-time WebSockets
  [x] Social features (friends, chat, invites)

Phase 2 — Enhancement 🔄
  [ ] Mobile-responsive UI polish
  [ ] Advanced tournament formats (round-robin, swiss)
  [ ] In-app notifications center
  [ ] Player analytics dashboard

Phase 3 — Scale ⏳
  [ ] AI-powered matchmaking
  [ ] Spectator mode with live stream integration
  [ ] Native mobile app (React Native)
  [ ] Public API + developer SDK
```

---

## 🧪 Testing

```bash
# Backend — PHPUnit
cd backend
php artisan test

# Backend — with coverage
php artisan test --coverage

# Frontend — Vitest
cd frontend
npm run test
```

---


<div align="center">

<br/>

**[Aman Kumar Yadav](https://github.com/aky2004) — Fullstack Developer**

<br/>
</div>
