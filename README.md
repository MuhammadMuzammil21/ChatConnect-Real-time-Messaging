# ChatConnect — Real-Time Messaging Platform

A full-stack real-time chat application built with NestJS, React, PostgreSQL, and WebSockets. Features Google OAuth authentication, role-based access control, file sharing, and a modern dark UI.

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | NestJS (TypeScript) |
| Database | PostgreSQL + TypeORM |
| Auth | Passport.js, Google OAuth 2.0, JWT |
| Real-time | Socket.io |
| Payments | Stripe |
| Testing | Jest |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 (TypeScript) |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui, Ant Design |
| Animations | Framer Motion |
| Icons | Lucide React |
| Routing | React Router v7 |
| Forms | React Hook Form + Zod |

---

## Features

### Authentication & Authorization
- Google OAuth 2.0 single sign-on
- JWT access + refresh token management with auto-refresh
- Role-based access control (FREE, PREMIUM, ADMIN)
- Protected routes and API endpoints

### Real-Time Messaging
- WebSocket-powered instant messaging via Socket.io
- Direct and group conversations
- Message editing and deletion
- Typing indicators and online/offline presence
- Read receipts (double checkmarks)
- Unread message count badges
- Full-text message search with filters
- Message history with infinite scroll pagination

### File Sharing
- Drag-and-drop and paste-to-upload file attachments
- Per-conversation media gallery with grid view and lightbox
- File type validation, size limits, and storage quotas
- Secure local file storage

### User Management
- Profile editing (display name, status message)
- Avatar upload with preview
- Subscription status display
- Stripe-integrated subscription flow (checkout, billing portal)

### UI & Design
- Minimalistic dark theme (shadcn/21st.dev aesthetic)
- Framer Motion entrance animations
- Responsive layout across all pages
- Floating navbar with smooth-scroll anchor links
- Split-screen login page with Google OAuth
- Animated hero section with SVG background paths

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── auth/              # OAuth, JWT, guards, strategies
│   │   ├── users/             # User entity, service, controller
│   │   ├── chat/              # Conversations, messages, WebSocket gateway
│   │   ├── files/             # File upload, storage, attachments
│   │   ├── profile/           # Profile management
│   │   └── subscription/      # Stripe integration
│   └── test/                  # E2E tests
│
├── frontend/
│   ├── src/
│   │   ├── pages/             # Dashboard, Chat, Profile, Login, Landing
│   │   ├── components/        # Reusable UI components
│   │   │   ├── ui/            # shadcn components (button, card, input, etc.)
│   │   │   ├── Conversation*  # Chat sidebar & header
│   │   │   ├── Message*       # Message list, items, input, search
│   │   │   └── File*          # Upload, preview, attachments, gallery
│   │   ├── contexts/          # Auth, WebSocket providers
│   │   ├── hooks/             # Custom hooks (conversations, messages, files)
│   │   ├── api/               # API client modules
│   │   └── types/             # TypeScript type definitions
│   └── public/
│
└── docs/                      # Sprint documentation
```

---

## Setup

### Prerequisites
- Node.js ≥ 18
- PostgreSQL ≥ 14
- Google Cloud OAuth credentials
- Stripe API keys (for subscriptions)

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```env
# Database
DB_HOST=127.0.0.1
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=chat_app

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# App
PORT=3000
NODE_ENV=development
```

```bash
npm run start:dev    # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000
```

```bash
npm run dev          # http://localhost:5173
```

### Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable Google+ API
3. Configure OAuth consent screen
4. Create OAuth 2.0 Web credentials
5. Add redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID & Secret into `.env`

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | OAuth callback |
| POST | `/auth/refresh` | Refresh JWT token |
| GET | `/auth/profile` | Get current user |
| POST | `/auth/logout` | Logout |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | `/users` | List all users |
| GET | `/profile` | Get profile |
| PATCH | `/profile` | Update profile |
| POST | `/profile/avatar` | Upload avatar |

### Conversations & Messages
| Method | Endpoint | Description |
|---|---|---|
| POST | `/conversations` | Create conversation |
| GET | `/conversations` | List conversations |
| GET | `/conversations/:id` | Get conversation |
| POST | `/conversations/:id/participants` | Add participants |
| POST | `/messages` | Send message |
| GET | `/messages/conversation/:id` | Get messages (paginated) |
| PATCH | `/messages/:id` | Edit message |
| DELETE | `/messages/:id` | Delete message |
| GET | `/messages/search` | Search messages |
| GET | `/messages/unread-counts` | Get unread counts |
| POST | `/messages/mark-read` | Mark as read |

### Files
| Method | Endpoint | Description |
|---|---|---|
| POST | `/files/upload` | Upload file |
| GET | `/files/:id` | Download file |
| GET | `/files/conversation/:id` | List conversation files |

### WebSocket Events
| Event | Direction | Description |
|---|---|---|
| `sendMessage` | Client → Server | Send a message |
| `newMessage` | Server → Client | Receive a message |
| `typingStart` / `typingStop` | Bidirectional | Typing indicators |
| `userOnline` / `userOffline` | Server → Client | Presence updates |
| `messageEdited` / `messageDeleted` | Server → Client | Message mutations |
| `unreadCountUpdate` | Server → Client | Badge updates |

---

## Database Schema

### Core Entities
- **User** — id, email, googleId, displayName, avatarUrl, role, subscriptionStatus, stripeCustomerId, statusMessage, isBanned
- **Conversation** — id, name, type (DIRECT / GROUP), createdBy
- **ConversationParticipant** — userId, conversationId, joinedAt
- **Message** — id, content, senderId, conversationId, isEdited, deletedAt, attachments
- **FileMetadata** — id, filename, mimeType, size, storagePath, uploadedBy, conversationId
- **UserStatus** — userId, status (ONLINE / AWAY / OFFLINE), lastSeen

---

## Scripts

### Backend
```bash
npm run start:dev     # Dev server (watch mode)
npm run build         # Production build
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage report
```

### Frontend
```bash
npm run dev           # Dev server
npm run build         # Production build
npm run preview       # Preview build
npm run lint          # ESLint
```

---

## License

MIT

## Author

Muhammad Muzammil
