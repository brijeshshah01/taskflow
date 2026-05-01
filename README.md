# ⚡ TaskFlow — Team Task Manager

A full-stack team task management application with role-based access control, built with Node.js/Express backend and React frontend.

![TaskFlow Screenshot](https://placeholder.com/screenshot)

## 🚀 Live Demo

- **Live URL**: [Deploy to Railway first]
- **Demo Admin**: `admin@demo.com` / `password123`
- **Demo Member**: `sam@demo.com` / `password123`

## ✨ Features

### Authentication
- JWT-based signup/login
- Role selection at signup (Admin/Member)
- Persistent sessions with localStorage

### Projects
- Create and manage projects
- Add/remove team members
- Role-based project access (owner, admin, member)
- Project progress tracking

### Tasks
- Kanban board view (To Do → In Progress → Review → Done)
- List view with sortable columns
- Priority levels: Urgent, High, Medium, Low
- Assign tasks to project members
- Due dates with overdue detection
- Comments on tasks
- Filter by priority and assignee

### Dashboard
- Personal task overview
- Stats: projects, tasks, in-progress, completed, overdue
- Tasks assigned to you
- Recent activity across all projects

### Role-Based Access Control
| Feature | Admin | Member |
|---------|-------|--------|
| Create projects | ✅ | ✅ |
| Delete projects | ✅ (own) | ❌ |
| Add/remove members | ✅ (own project) | ❌ |
| Create tasks | ✅ | ✅ |
| Edit any task | ✅ | Own tasks only |
| Delete any task | ✅ | Own tasks only |

## 🛠️ Tech Stack

**Backend**
- Node.js + Express
- SQLite (better-sqlite3) — zero-config, file-based
- JWT authentication (jsonwebtoken)
- bcryptjs for password hashing
- express-validator for input validation

**Frontend**
- React 18
- React Router v6
- Vite (build tool)
- Vanilla CSS with CSS variables (no external UI library)

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── models/
│   │   └── db.js          # SQLite setup + schema
│   ├── middleware/
│   │   └── auth.js        # JWT + RBAC middleware
│   ├── routes/
│   │   ├── auth.js        # Login, signup, user info
│   │   ├── projects.js    # CRUD + member management
│   │   ├── tasks.js       # CRUD + comments
│   │   └── dashboard.js   # Aggregated stats
│   ├── seed.js            # Demo data script
│   └── server.js          # Express app entry
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Layout.jsx    # Sidebar navigation
│       │   ├── TaskModal.jsx # Create/edit tasks
│       │   └── UI.jsx        # Shared components
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── AuthPage.jsx
│       │   ├── Dashboard.jsx
│       │   ├── ProjectsPage.jsx
│       │   └── ProjectPage.jsx
│       └── utils/
│           └── api.js        # Fetch wrapper
├── package.json           # Root build scripts
└── railway.toml           # Railway deployment config
```

## 🔌 API Reference

### Auth
```
POST /api/auth/signup     { name, email, password, role? }
POST /api/auth/login      { email, password }
GET  /api/auth/me         → current user
GET  /api/auth/users      → all users (for assignment)
```

### Projects
```
GET    /api/projects
POST   /api/projects      { name, description? }
GET    /api/projects/:id
PATCH  /api/projects/:id  { name?, description?, status? }
DELETE /api/projects/:id
POST   /api/projects/:id/members        { email, role? }
DELETE /api/projects/:id/members/:uid
```

### Tasks
```
GET    /api/projects/:pid/tasks          ?status=&priority=&assignee=
POST   /api/projects/:pid/tasks          { title, description?, status?, priority?, assignee_id?, due_date? }
GET    /api/projects/:pid/tasks/:id
PATCH  /api/projects/:pid/tasks/:id      { ...fields }
DELETE /api/projects/:pid/tasks/:id
POST   /api/projects/:pid/tasks/:id/comments  { content }
```

### Dashboard
```
GET /api/dashboard  → stats, myTasks, recentTasks, tasksByStatus, tasksByPriority
```

## 🚀 Local Development

```bash
# Install dependencies
npm run install:all

# Seed demo data
cd backend && node seed.js && cd ..

# Start backend (port 3001)
npm run dev:backend

# Start frontend (port 5173) — in another terminal
npm run dev:frontend

# Visit http://localhost:5173
```

## 🚂 Deploy to Railway

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/taskflow
   git push -u origin main
   ```

2. **Create Railway project**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Set environment variables** in Railway dashboard:
   ```
   JWT_SECRET=your-very-long-random-secret-here
   NODE_ENV=production
   PORT=3001
   ```

4. **Seed demo data** (optional):
   - In Railway dashboard → your service → Shell
   - Run: `node backend/seed.js`

5. **Done!** Railway will auto-deploy on every push.

### Railway Build Process
- `npm run build` → installs deps + builds frontend
- `npm start` → starts Express server (serves frontend + API)
- SQLite DB persists in Railway's file system

## 🔒 Security Notes

- JWT tokens expire in 7 days
- Passwords hashed with bcrypt (10 rounds)
- CORS configured for production
- SQL injection prevented via parameterized queries
- Input validation on all endpoints
- Change `JWT_SECRET` in production!

## 📦 Database Schema

```sql
users         (id, name, email, password, role, avatar_color, created_at)
projects      (id, name, description, status, owner_id, created_at)
project_members (project_id, user_id, role, joined_at)
tasks         (id, title, description, status, priority, project_id, assignee_id, created_by, due_date, created_at, updated_at)
comments      (id, task_id, user_id, content, created_at)
```
