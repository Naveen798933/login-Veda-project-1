# 🚀 LogicVeda Enterprise Collaboration Platform

> **Real-Time Document Collaboration at Enterprise Scale**  
> A production-ready, multi-user document editing platform with Notion-like capabilities, powered by Yjs CRDT and Socket.io.

**Version:** 2.0  
**Status:** ✅ Production Ready  
**License:** MIT

---

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#️-technology-stack)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [Support](#-support)

---

## ✨ Features

### Real-Time Collaboration
- **CRDT-Based Sync**: Uses Yjs for conflict-free, zero-loss simultaneous editing
- **Live Cursors**: Multi-colored presence awareness showing active collaborators
- **Instant Updates**: Sub-100ms synchronization across all clients
- **Offline Support**: Seamless reconnection with automatic conflict resolution

### Document Management
- **Rich Editing**: Powered by Tiptap with full markdown support
- **Version History**: Automatic snapshots with manual checkpoint creation
- **Soft Delete**: Trash with permanent deletion capability
- **Full-Text Search**: MongoDB text indexing for fast document discovery

### Collaboration Features
- **Threaded Comments**: Contextual discussions with resolution tracking
- **@Mentions**: Automatic notifications for tagged collaborators  
- **Role-Based Access Control (RBAC)**: Owner → Editor → Commenter → Viewer
- **Shareable Links**: Time-limited invitation tokens (7-day default)

### Real-Time Notifications
- **Email Notifications**: Via BullMQ queue + Nodemailer
- **Socket.io Events**: Real-time in-app notifications
- **Mention Alerts**: Automatic detection and notification
- **Collaboration Notifications**: Document and comment updates

### Security & Compliance
- **Helmet.js**: HTTP security headers (XSS, CSRF protection)
- **JWT Authentication**: Dual-token system (15m access, 7d refresh)
- **NoSQL Injection Prevention**: `express-mongo-sanitize`
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **HTTPS Ready**: Environment-based secure cookie configuration

### Observability
- **Health Checks**: `/health` endpoint for load balancers
- **Prometheus Metrics**: `/metrics` endpoint with `prom-client`
- **Structured Logging**: JSON-formatted error tracking
- **Kubernetes Ready**: Deployment manifests included

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework |
| **Vite** | Build tooling (HMR, fast builds) |
| **TypeScript** | Type safety |
| **Zustand** | Lightweight state management |
| **@tiptap/react** | Rich text editor |
| **yjs** | Conflict-free replicated data (CRDT) |
| **Socket.io Client** | Real-time WebSocket communication |
| **Joy UI** | Component library |
| **Lucide Icons** | Icon system |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js 22** | Runtime |
| **Express** | HTTP framework |
| **TypeScript** | Type safety |
| **MongoDB 8** + **Mongoose** | Database & ODM |
| **Socket.io** | Real-time communication |
| **yjs** | CRDT implementation |
| **BullMQ** | Job queue for notifications |
| **Redis** | Cache & message broker |
| **Nodemailer** | Email sending |
| **Argon2** | Password hashing |
| **JWT** | Token-based auth |

### DevOps
| Technology | Purpose |
|-----------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Local orchestration |
| **Kubernetes** | Production orchestration |
| **GitHub Actions** | CI/CD pipeline |
| **Vitest** | Unit testing |
| **Playwright** | E2E testing |

---

## Quick Start

### Prerequisites
- **Node.js 22+**
- **Docker & Docker Compose** (for local services)
- **Git**

### 1. Clone & Setup
```bash
git clone https://github.com/logicveda/realtime-collaboration.git
cd realtime-collaboration

# Install all dependencies (monorepo)
npm install
```

### 2. Environment Configuration
```bash
# Copy template
cp .env.example .env.local

# Edit with your settings
nano .env.local
```

**Key Variables to Configure:**
```bash
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173

MONGODB_URI=mongodb://localhost:27017/logicveda
REDIS_URI=redis://localhost:6379

ACCESS_TOKEN_SECRET=your_super_secret_key
REFRESH_TOKEN_SECRET=your_super_secret_key

SMTP_HOST=smtp.ethereal.email  # For dev, or use production SMTP
```

### 3. Start Services
```bash
# Terminal 1: Start MongoDB & Redis
docker-compose up

# Terminal 2: Start backend server  
npm run dev:server

# Terminal 3: Start frontend dev server
npm run dev:client
```

**Application accessible at:** `http://localhost:5173`

### 4. Create Test Account
```
Email: test@example.com
Password: TestPassword123!
```

---

## Architecture

### System Design (C4 Model)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                 │
│  (Browser - React + Vite)  (Mobile - React Native - Future)   │
└────────────────┬────────────────────────────────┬───────────────┘
                 │                                │
         HTTP/REST  +  WSS/WebSocket      HTTP/REST + Socket.io
                 │                                │
┌────────────────┴────────────────────────────────┴───────────────┐
│                                                                 │
│              LOAD BALANCER / REVERSE PROXY                     │
│                    (Nginx / Caddy)                              │
│                                                                 │
└────────────────┬────────────────────────────────┬───────────────┘
                 │                                │
             HTTP/JSON                    WSS Upgrade
                 │                                │
    ┌────────────┴────────────┐      ┌───────────┴──────────────┐
    │                         │      │                          │
    ▼                         ▼      ▼                          ▼
┌─────────────────┐  ┌──────────────┐  ┌──────────────────┐
│  Backend API    │  │ Socket.io    │  │  Redis Adapter   │
│  (Express)      │  │  Server      │  │  (Horizontal     │
│  Port: 5000     │  │  Port: 5000  │  │   Scaling)       │
└────────┬────────┘  └────────┬─────┘  └─────────┬────────┘
         │                    │                   │
         │       YARGON       │                   │
         │      (Update)      │                   │
         └────────┬───────────┘                   │
                  │                               │
                  │  Pub/Sub (Horizontal Scale)   │
                  └───────────┬───────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
              ┌──────────────┐  ┌─────────────────┐
              │  MongoDB     │  │  Redis Cache    │
              │  (Primary)   │  │  Session Store  │
              │  Port: 27017 │  │  Job Queue      │
              │              │  │  Port: 6379     │
              └──────────────┘  └────────┬────────┘
                    △                    │
                    │                    │
              ┌─────┴──────┐             │
              │ Replica Set│             │
              │  (Optional)│             │
              └────────────┘             │
                                         │
                                    ┌────▼─────────┐
                                    │ BullMQ Worker│
                                    │ (Async Jobs) │
                                    └────┬─────────┘
                                         │
                                         ▼
                                    ┌──────────────┐
                                    │ Nodemailer   │
                                    │ SMTP Server  │
                                    └──────────────┘
```

### Data Flow: Real-Time Editing

```
1. User Types in Editor
        ↓
2. Tiptap Detects Change
        ↓
3. Yjs Encodes Update (Uint8Array)
        ↓
4. Socket.io Emits 'sync-update' to Server
        ↓
5. Server Applies Update & Broadcasts to Room
        ↓
6. Other Clients Receive & Apply Update
        ↓
7. All Editors Show Same Content (Conflict-Free)
```

### Awareness Protocol (Cursors)

```
User A at position X
        ↓
Encodes Awareness State (position, color)
        ↓
Socket.io 'awareness-update' Event
        ↓
Server Broadcasts to Document Room
        ↓
User B Sees Cursor at Position X
```

---

## API Documentation

### Authentication Endpoints

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe"
}

Response: 201 Created
{
  "user": { ... },
  "accessToken": "eyJhbGc..."
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response: 200 OK
{
  "user": { ... },
  "accessToken": "eyJhbGc..."
}
Cookie: refreshToken=... (HttpOnly, Secure, SameSite=Strict)
```

#### Refresh Token
```
POST /api/auth/refresh
Cookie: refreshToken=...

Response: 200 OK
{
  "accessToken": "new_token_here"
}
```

#### Forgot Password
```
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}

Response: 200 OK
Email sent with reset link
```

#### Reset Password
```
POST /api/auth/reset-password
{
  "token": "{{resetToken}}",
  "email": "user@example.com",
  "newPassword": "NewPassword123!"
}

Response: 200 OK
```

### Document Endpoints

#### Create Document
```
POST /api/documents
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "title": "Project Proposal"
}

Response: 201 Created
{
  "_id": "..." ,
  "title": "Project Proposal",
  "owner": "...",
  "content": "",
  "collaborators": []
}
```

#### Get All Documents
```
GET /api/documents
Authorization: Bearer {{accessToken}}

Response: 200 OK
[
  { /* document objects */ }
]
```

#### Get Trash
```
GET /api/documents/trash
Authorization: Bearer {{accessToken}}

Response: 200 OK
[
  { /* deleted documents */ }
]
```

#### Search Documents
```
GET /api/documents/search?q=proposal
Authorization: Bearer {{accessToken}}

Response: 200 OK
[
  { /* matching documents */ }
]
```

#### Invite Collaborator
```
POST /api/documents/:documentId/invite
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "email": "collaborator@example.com",
  "role": "editor"  # owner | editor | commenter | viewer
}

Response: 201 Created
```

#### Create Snapshot
```
POST /api/documents/:documentId/snapshots
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "title": "Final Draft v1"
}

Response: 201 Created
```

### Comments Endpoints

#### Post Comment
```
POST /api/comments
Authorization: Bearer {{accessToken}}
Content-Type: application/json

{
  "documentId": "...",
  "content": "Great work! @teammate please review",
  "parentId": null  # For threading
}

Response: 201 Created
```

#### Get Comments
```
GET /api/comments/:documentId
Authorization: Bearer {{accessToken}}

Response: 200 OK
[
  {
    "_id": "...",
    "content": "Comment text",
    "author": { /* user */ },
    "replies": [ /* nested comments */ ]
  }
]
```

#### Resolve Comment
```
PATCH /api/comments/:commentId/resolve
Authorization: Bearer {{accessToken}}

Response: 200 OK
```

### WebSocket Events (Socket.io)

#### Connection
```javascript
io.on('connect', () => {
  // Automatic room assignment based on docId query
  socket.on('sync-update', (update) => {
    // Yjs update received
  });
  
  socket.on('awareness-update', (update) => {
    // Cursor position update
  });
});
```

---

## 🚀 Deployment

### Docker Deployment

#### Build Images
```bash
# Backend
docker build -t logicveda-api:latest ./apps/server

# Frontend
docker build -t logicveda-web:latest ./apps/client
```

#### Run with Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment

```bash
# Apply Kubernetes manifests
kubectl apply -f kubernetes/

# Scale backend replicas
kubectl scale deployment logicveda-api --replicas=5

# Monitor deployment
kubectl get pods -l app=logicveda
```

### Platform-Specific Guides

#### Front end: Vercel
```bash
# Push to GitHub, connect to Vercel
# Environment Variables:
VITE_API_URL=https://api.yourdomain.com
VITE_API_TIMEOUT=10000
```

#### Backend: Render / Railway
```bash
# Set environment variables in platform dashboard
# MongoDB, Redis URIs
# JWT secrets
# SMTP credentials

# Auto-deploys on push to main
```

---

## 🧪 Testing

### Unit Tests (Vitest)
```bash
npm run test -- --run              # Single run
npm run test                       # Watch mode
npm run test -- --coverage        # With coverage
```

### E2E Tests (Playwright)
```bash
npm run test:e2e --workspace=@collaboration/client
npm run test:e2e -- --headed      # Visualize browser
npm run test:e2e -- --debug       # Debug mode
```

### Test Coverage
- **Backend**: 80%+ coverage on critical paths
- **Frontend**: Component & integration tests
- **E2E**: Critical user journeys

---

## 📊 Monitoring & Observability

### Health Checks
```bash
curl http://localhost:5000/health
# { "status": "ok", "timestamp": "..." }
```

### Prometheus Metrics
```bash
curl http://localhost:5000/metrics
# node_process_resident_memory_bytes, etc.
```

### Logging
All errors logged in JSON format for centralized log aggregation (ELK, Datadog, etc.)

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Use `.env.example`
2. **Rotate JWT secrets** regularly in production
3. **Use HTTPS only** - Set `NODE_ENV=production` for secure cookies
4. **Enable CORS selectively** - Whitelist trusted origins
5. **Rate Limit API** - Already configured (100 req/15min)
6. **Monitor refresh token rotation** - Prevented token reuse
7. **Sanitize user input** - `express-mongo-sanitize` enabled
8. **Keep dependencies updated** - Run `npm audit` regularly

---

## 🐛 Troubleshooting

### Redis Connection Issues
```bash
# Check Redis status
redis-cli ping
# Output: PONG

# Manual connection with different URI
REDIS_URI=redis://your-host:6379 npm run dev:server
```

### MongoDB Connection
```bash
# Test connection
mongosh --connString "mongodb://localhost:27017"

# Check if MongoDB is running
docker ps | grep mongo
```

### Socket.io Not Connecting
- Check CORS origins in server.ts
- Verify WebSocket protocols enabled on server
- Browser console for connection errors

---

## 📈 Performance Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| API Response Time | <200ms | ~50-100ms |
| Sync Latency | <100ms | ~30-50ms |
| Search (1000 docs) | <500ms | ~200ms |
| Concurrent Editors | 100+ | Tested ✅ |

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create feature branch** - `git checkout -b feature/amazing-feature`
3. **Make changes** - Follow existing code patterns
4. **Write tests** - Maintain >80% coverage
5. **Commit clearly** - `git commit -m "feat: add real-time sync"`
6. **Push branch** - `git push origin feature/amazing-feature`
7. **Open Pull Request** - Reference issues if applicable

### Development Guidelines
- TypeScript strict mode required
- ESLint must pass (`npm run lint`)
- All tests must pass (`npm run test`)
- Components must be typed (no `any`)

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file

---

## 💬 Support

- **Documentation**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **API Docs**: [Swagger UI](http://localhost:5000/api-docs) (when running)
- **Issues**: [GitHub Issues](https://github.com/logicveda/realtime-collaboration/issues)
- **Discussions**: [GitHub Discussions](https://github.com/logicveda/realtime-collaboration/discussions)

---

## 🎯 Roadmap

- ✅ Core real-time editing (CRDT + Yjs)
- ✅ RBAC and collaboration
- ✅ Comments and notifications
- 🔄 **Next**: Mobile app (React Native)
- 🔄 **Next**: AI content assist integration
- 🔄 **Next**: Advanced analytics dashboard
- 🔄 **Next**: White-label SaaS version

---

**Built with ❤️ by the LogicVeda Team**  
*Enterprise-Grade Real-Time Collaboration Platform*  
*Version 2.0 - Production Ready*
