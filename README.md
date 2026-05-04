<div align="center">

```
    ___    ____  _____ _   __   ___   _  ___   __   
   / _ |  / __ \/ ____| | / /  / / | | |/ _ \ / /   
  / /_\ \ / /_\ \\___ \| |/ /  / /  | |/ / |  \\ \  
 / _____ \|  __  |____) |   <  / /___| / /\\  \\_\\  \\ \\
/_/   \\_\\_| |  \\_\\_____/|_|\\_\\/_____/|_/   \\_\\____/ \\/
                                                      
```

# 🎮 APEXNOVA ARENA - The Ultimate Gaming & Tournament Platform

[![Fullstack](https://img.shields.io/badge/Fullstack-Developer-blue?style=for-the-badge&logo=rocket)](https://github.com/aky2004/ApexNova-Arena)
[![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react)](./frontend)
[![Backend](https://img.shields.io/badge/Backend-Laravel-FF2D20?style=for-the-badge&logo=laravel)](./backend)
[![Real-time](https://img.shields.io/badge/Real--time-WebSockets-green?style=for-the-badge)](https://github.com/laravel/reverb)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql)](./backend/config/database.php)
[![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge)](https://github.com/aky2004/ApexNova-Arena)

---

### 🌟 Unleash Your Gaming Potential

**ApexNova Arena** is a cutting-edge gaming platform where players compete in tournaments, climb the rankings, and showcase their skills across multiple games. Built with modern fullstack technologies for seamless real-time gameplay.

[🚀 Get Started](#-quick-start) • [📖 Documentation](#-features) • [🤝 Contributing](#-contribute) • [💬 Support](#-support)

---

</div>

## 🎯 Core Features

<div align="center">

### 🎮 **Multiple Games**
```
┌─────────────────┐
│   PLAY GAMES    │
│  Compete across │
│   various game  │
│   categories    │
└─────────────────┘
```
Experience diverse gaming modes tailored for competitive play and casual fun.

### 🏆 **Tournament System**
```
┌─────────────────┐
│   TOURNAMENTS   │
│  Join brackets  │
│  Compete fairly │
│  Win big prizes │
└─────────────────┘
```
Host, join, and manage tournaments with real-time leaderboards and live updates.

### ⭐ **Dynamic Ranking**
```
┌─────────────────┐
│   RANKINGS      │
│  Track your     │
│  progress &     │
│  global stats   │
└─────────────────┘
```
Real-time ranking system tracking performance, win-loss ratios, and skill ratings.

### 👥 **Social Features**
```
┌─────────────────┐
│  CONNECTIONS    │
│  Add friends    │
│  Receive invites│
│  Team up & chat │
└─────────────────┘
```
Friends system, game invitations, and real-time chat for seamless collaboration.

</div>

---

## ⚡ Technology Stack

<div align="center">

### 🎨 Frontend
```
React.js + Vite + TailwindCSS
├─ High-performance SPA
├─ Real-time state management
├─ Responsive UI/UX design
└─ WebSocket integration
```

### 🔧 Backend
```
Laravel 11 + PHP 8.3
├─ RESTful API architecture
├─ JWT authentication
├─ Real-time events (Reverb)
├─ Database migrations & seeders
└─ Broadcasting channels
```

### 🗄️ Database & Services
```
PostgreSQL + Redis
├─ Relational data modeling
├─ Caching layer
├─ Session management
└─ Cloud storage (Cloudinary)
```

### 📡 Real-time Communication
```
WebSockets (Laravel Reverb)
├─ Live game updates
├─ Tournament broadcasts
├─ Instant messaging
└─ Presence tracking
```

</div>

---

## 📊 Feature Highlights

### 🎮 **Games Module**
- Multiple game categories and modes
- Real-time game state synchronization
- Skill-based matchmaking
- Performance analytics and stats tracking

### 🏅 **Tournament Management**
- Create and manage tournaments
- Bracket generation and progression
- Automated score calculation
- Prize pool distribution
- Live tournament feeds

### 📈 **Ranking System**
- Global leaderboards
- Division-based rankings
- Win-loss tracking
- Rating calculations
- Achievement badges
- Historical performance metrics

### 🔐 **User System**
- Secure JWT authentication
- Email verification with OTP
- Player profiles with statistics
- Customizable user preferences

### 💬 **Communication**
- Real-time game chat
- Friend messaging
- Invite notifications
- Tournament announcements

---

## 📁 Project Structure

```
ApexNova-Arena/
├── 📂 frontend/                 # React.js application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── context/            # Global state management
│   │   ├── config/             # API configuration
│   │   └── assets/             # Images, icons, media
│   ├── vite.config.js
│   └── package.json
│
├── 📂 backend/                  # Laravel application
│   ├── app/
│   │   ├── Models/             # Database models
│   │   ├── Http/Controllers/   # API controllers
│   │   ├── Events/             # Broadcasting events
│   │   ├── Mail/               # Email templates
│   │   └── Providers/          # Service providers
│   ├── database/
│   │   ├── migrations/         # Database schemas
│   │   ├── factories/          # Test data factories
│   │   └── seeders/            # Database seeders
│   ├── routes/
│   │   ├── api.php             # API routes
│   │   └── channels.php        # Broadcasting channels
│   ├── config/                 # Configuration files
│   └── composer.json
│
└── .gitignore                   # Unified git ignore
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ & npm
- PHP 8.3+
- Composer
- PostgreSQL
- Redis (optional)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### Environment Configuration

Create `.env` files in both directories with required API keys:
- Database credentials
- JWT secret
- Cloudinary API keys
- Email service configuration

---

## 🎮 How It Works

### 1️⃣ **Register & Build Your Profile**
Sign up, verify your email with OTP, and create your gaming profile with avatar and bio.

### 2️⃣ **Browse Games & Tournaments**
Explore available games and upcoming tournaments with detailed information and prize pools.

### 3️⃣ **Join or Create Tournaments**
Participate in tournaments or create your own with custom rules and formats.

### 4️⃣ **Play & Compete**
Engage in real-time matches with live updates, chat, and performance tracking.

### 5️⃣ **Climb the Rankings**
Earn points, badges, and achievements as you progress in our global ranking system.

### 6️⃣ **Connect & Collaborate**
Add friends, receive invitations, and team up for group tournaments.

---

## 🔧 API Endpoints Overview

### Authentication
```
POST   /api/auth/register       - User registration
POST   /api/auth/login          - User login
POST   /api/auth/verify-otp     - Verify OTP
POST   /api/auth/logout         - User logout
```

### Games
```
GET    /api/games               - List all games
GET    /api/games/{id}          - Game details
POST   /api/games/{id}/play     - Start game session
```

### Tournaments
```
GET    /api/tournaments         - List tournaments
POST   /api/tournaments         - Create tournament
POST   /api/tournaments/{id}/join - Join tournament
GET    /api/tournaments/{id}/brackets - Tournament brackets
```

### Rankings
```
GET    /api/rankings            - Global leaderboard
GET    /api/rankings/{userId}   - User ranking stats
GET    /api/rankings/stats      - Performance analytics
```

### Friends & Social
```
GET    /api/friends             - Friends list
POST   /api/friends/{userId}    - Send friend request
POST   /api/friends/{userId}/accept - Accept request
```

---

## 📊 Database Models

### Core Entities
- **Users** - Player accounts with profiles
- **Games** - Available game definitions
- **GameRooms** - Active game sessions
- **GameScores** - Game statistics
- **Tournaments** - Tournament configurations
- **GameInvites** - Game invitations
- **Friendships** - Friend relationships
- **RoomMessages** - Chat messages
- **Rankings** - Leaderboard data

---

## 🎨 UI/UX Features

- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Support** - Eye-friendly interface options
- **Real-time Notifications** - Instant alerts for invites, messages, rankings
- **Smooth Animations** - Polished transitions and micro-interactions
- **Accessibility** - WCAG compliant for all users
- **Performance Optimized** - Fast load times and smooth gameplay

---

## 🧪 Testing

```bash
# Backend tests
cd backend
php artisan test

# Frontend tests (setup required)
cd frontend
npm run test
```

---

## 📝 Environment Variables

### Backend (.env)
```env
APP_NAME=ApexNova-Arena
APP_ENV=local
DATABASE_URL=postgresql://user:password@localhost/apexnova
JWT_SECRET=your_jwt_secret
REVERB_APP_ID=your_reverb_id
CLOUDINARY_URL=cloudinary://key:secret@cloud
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_WS_URL=ws://localhost:8000
```

---

## 🤝 Contribute

We love contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Guidelines
- Follow PSR-12 for PHP code
- Use ES6+ standards for JavaScript
- Write meaningful commit messages
- Include tests for new features
- Update documentation

---

## 🐛 Known Issues & Roadmap

### Current Phase
- ✅ Core game mechanics
- ✅ Tournament system
- ✅ Real-time features
- 🔄 Mobile app (in development)
- 🔄 Advanced analytics
- ⏳ AI-powered matchmaking
- ⏳ Spectator mode

---

## 📞 Support & Community

- 📧 **Email** - support@apexnova.com
- 💬 **Discord** - [Join Community](https://discord.gg/apexnova)
- 🐛 **Issues** - [GitHub Issues](https://github.com/aky2004/ApexNova-Arena/issues)
- 📚 **Wiki** - [Documentation](https://github.com/aky2004/ApexNova-Arena/wiki)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙌 Acknowledgments

Built with passion by fullstack developers who believe gaming should be competitive, fun, and accessible to everyone.

<div align="center">

### ⭐ If you find this project helpful, please give it a star!

```
    ___    ____  _____ _   __   ___   _  ___   __   
   / _ |  / __ \/ ____| | / /  / / | | |/ _ \ / /   
  / /_\ \ / /_\ \\___ \| |/ /  / /  | |/ / |  \\ \  
 / _____ \|  __  |____) |   <  / /___| / /\\  \\_\\  \\ \\
/_/   \\_\\_| |  \\_\\_____/|_|\\_\\/_____/|_/   \\_\\____/ \\/

      🎮 ApexNova Arena - Where Champions Rise 🏆
```

**Made with ❤️ by the ApexNova Development Team**

[⬆ Back to top](#apexnova-arena---the-ultimate-gaming--tournament-platform)

</div>
