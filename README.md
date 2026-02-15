# NestJS Chat Application

A full-stack real-time chat application built with NestJS, React 19, PostgreSQL, and WebSockets.

## 🚀 Tech Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Authentication**: Passport.js, Google OAuth 2.0, JWT
- **Real-time**: Socket.io
- **Testing**: Jest

### Frontend
- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite
- **UI Library**: Ant Design
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7
- **State Management**: TanStack Query
- **Testing**: Vitest

## 📋 Features

- 🔐 Google OAuth 2.0 Authentication
- 🔑 JWT-based Session Management
- 👥 Role-Based Access Control (FREE, PREMIUM, ADMIN)
- 💬 Real-time Messaging
- 📁 File Sharing
- 🎨 Modern UI with Ant Design + Tailwind
- 📱 Responsive Design

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   # Database Configuration
   DB_HOST=127.0.0.1
   DB_PORT=5433
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   DB_DATABASE=chat_app

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   JWT_REFRESH_EXPIRES_IN=7d

   # Application Configuration
   PORT=3000
   NODE_ENV=development

   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
   ```

4. **Set up PostgreSQL database**
   ```sql
   CREATE DATABASE chat_app;
   ```

5. **Run the application**
   ```bash
   npm run start:dev
   ```

   The backend will be available at `http://localhost:3000`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install required packages** (if not already installed)
   ```bash
   npm install @tailwindcss/postcss @ant-design/icons react-router-dom
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

5. **Run the application**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

### Frontend Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── AuthCallback.tsx    # OAuth callback handler
│   │   └── Dashboard.tsx       # Protected dashboard page
│   ├── App.tsx                 # Login page
│   ├── main.tsx                # App entry with routing
│   └── index.css               # Tailwind CSS imports
├── postcss.config.js           # PostCSS with Tailwind v4
└── tailwind.config.js          # Tailwind configuration
```

## 🗄️ Database Schema

### User Entity
- `id` (UUID, Primary Key)
- `email` (Unique, Required)
- `google_id` (Unique, Nullable)
- `display_name` (Required)
- `avatar_url` (Nullable)
- `role` (Enum: FREE, PREMIUM, ADMIN)
- `subscription_status` (Enum: ACTIVE, INACTIVE, CANCELLED, PAST_DUE)
- `status_message` (Nullable, Max 200 chars)
- `stripe_customer_id` (Nullable)
- `is_banned` (Boolean, Default: false)
- `refresh_token` (Nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## 🔐 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Configure OAuth consent screen
5. Create OAuth 2.0 credentials (Web application)
6. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
7. Copy Client ID and Client Secret to `.env` file

## 📚 API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth login
- `GET /auth/google/callback` - Google OAuth callback
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/profile` - Get current user profile (Protected)
- `POST /auth/logout` - Logout user (Protected)

### Root
- `GET /` - Health check endpoint

## 📅 Development Timeline

### ✅ Sprint 1: System Foundation and Authentication (Feb 2-8, 2026) - COMPLETED

**Status**: All Sprint 1 objectives successfully completed! See [Sprint 1 Complete Documentation](docs/Sprint1-Complete-Documentation.md) for comprehensive details.

**Key Achievements**:
- ✅ Full-stack setup (NestJS + React 19)
- ✅ Google OAuth 2.0 authentication
- ✅ JWT token management with automatic refresh
- ✅ Role-based access control (FREE, PREMIUM, ADMIN)
- ✅ User profile management with avatar upload
- ✅ 90%+ test coverage
- ✅ Comprehensive API documentation

### ✅ Sprint 2: Real-Time Messaging System (Feb 9-15, 2026) - COMPLETED

**Status**: All Sprint 2 objectives successfully completed! See [Sprint 2 Completion Status](docs/sprint2_completion_status.md) for comprehensive details.

**Key Achievements**:
- ✅ WebSocket infrastructure with Socket.io and JWT authentication
- ✅ Real-time messaging (send, receive, edit, delete)
- ✅ Direct and group conversations with participant management
- ✅ Typing indicators and online/offline status tracking
- ✅ Message read receipts (double checkmarks)
- ✅ Full-text message search with filters
- ✅ Unread message count badges
- ✅ Professional UI with animations and loading skeletons
- ✅ 12 new REST API endpoints + 15 WebSocket events
- ✅ Auto-reconnection and error handling

**Next Steps (Sprint 3):**


## 🧪 Testing

### Backend
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend
```bash
# Unit tests
npm run test

# Coverage
npm run test:coverage
```

## 📝 Scripts

### Backend
- `npm run start` - Start production server
- `npm run start:dev` - Start development server with watch mode
- `npm run start:debug` - Start server in debug mode
- `npm run build` - Build for production
- `npm run test` - Run tests

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

- Muhammad Muzammil

