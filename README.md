# TaskFlow — Team Task Manager

A modern, full-stack task management application built with Next.js 14, TypeScript, Tailwind CSS, and Prisma ORM. Manage projects, assign tasks, and collaborate with your team seamlessly.

![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-06B6D4?style=flat-square&logo=tailwind-css)
![Prisma](https://img.shields.io/badge/Prisma-5.13-2D3748?style=flat-square&logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?style=flat-square&logo=postgresql)

## Features

✨ **Authentication**
- Secure JWT-based authentication with HTTP-only cookies
- User registration and login
- Session persistence across browser tabs

🏢 **Project Management**
- Create and manage multiple projects
- Invite team members to projects
- Role-based access control (Admin/Member)
- Project descriptions and metadata

📋 **Task Management**
- Create, update, and delete tasks
- Assign tasks to team members
- Set task priorities (Low, Medium, High)
- Track task status (To Do, In Progress, Done)
- Due date tracking with overdue indicators
- Task descriptions and comments

📊 **Dashboard**
- Real-time project statistics
- Task overview by status
- Overdue task tracking
- Recent activity timeline
- Personal task assignments

🎨 **Modern UI**
- Dark theme with Tailwind CSS
- Responsive design (mobile-first)
- Smooth animations and transitions
- Intuitive navigation

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 |
| ORM | Prisma 5.13 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT + bcryptjs |
| Deployment | Railway.app |

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vaishak-v-nair/TaskFlow.git
   cd TaskFlow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file from example
   cp .env.example .env
   ```

   Edit `.env` and configure:
   ```env
   # Database (SQLite for development)
   DATABASE_URL="file:./dev.db"

   # Authentication secret (change in production!)
   JWT_SECRET="your-strong-random-secret-here"
   ```

4. **Initialize the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
# Development
npm run dev                    # Start dev server with hot reload at localhost:3000

# Database Management
npm run db:push              # Sync Prisma schema with database (creates tables)
npm run db:migrate           # Run migrations on deployed database
npm run db:studio            # Open Prisma Studio GUI for database inspection

# Build & Production
npm run build                # Build Next.js application for production
npm start                    # Start production server (requires npm run build first)

# Code Quality
npm run lint                 # Run ESLint on source files
```

## Database Management

### Viewing Your Data with Prisma Studio

Use **Prisma Studio** to visualize and manage your database in a web GUI:

```bash
npm run db:studio
```

This opens your browser to `http://localhost:5555` where you can:
- ✅ Browse all tables: Users, Projects, Tasks, ProjectMembers
- ✅ Add, edit, and delete records directly
- ✅ View relationships between data
- ✅ Run and test database queries
- ✅ No additional database tools needed

**Perfect for:**
- Testing database changes without writing SQL
- Verifying user registrations and login data
- Checking created projects and tasks
- Debugging data relationships

### Database Location

- **Development**: `dev.db` (SQLite file in project root, included in `.gitignore`)
- **Production**: PostgreSQL (configured via `DATABASE_URL` environment variable)

### Database Schema

The application uses the following tables:

**User**
- Stores user credentials and profile information
- Passwords are hashed using bcryptjs (12 salt rounds)
- Roles: `MEMBER` (default) or `ADMIN`

**Project**
- Team projects with optional descriptions
- Created by and belongs to users
- Can have multiple team members

**ProjectMember**
- Junction table mapping users to projects
- Tracks member role within each project
- Enforces one membership per user per project

**Task**
- Project tasks with full lifecycle management
- Status: `TODO`, `IN_PROGRESS`, `DONE`
- Priority: `LOW`, `MEDIUM`, `HIGH`
- Can be assigned to project members

## Project Structure

```
src/
├── app/
│   ├── (auth)/                     # Auth pages (login, signup)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (app)/                      # Protected pages (require authentication)
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── projects/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── layout.tsx              # Sidebar navigation & auth state
│   ├── api/                        # API routes
│   │   ├── auth/
│   │   │   ├── signup/route.ts     # Register new user
│   │   │   ├── login/route.ts      # Authenticate user
│   │   │   ├── logout/route.ts     # Clear session
│   │   │   └── me/route.ts         # Get current user
│   │   ├── projects/
│   │   │   ├── route.ts            # List & create projects
│   │   │   ├── [id]/route.ts       # Get, update, delete project
│   │   │   ├── [id]/members/route.ts
│   │   │   └── [id]/tasks/route.ts
│   │   ├── tasks/[id]/route.ts     # Update, delete task
│   │   └── dashboard/route.ts      # Dashboard statistics
│   ├── globals.css                 # Global styles & Tailwind utilities
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Homepage (redirects to /projects)
├── components/                     # Reusable React components (future)
├── lib/
│   ├── auth.ts                     # JWT utilities & cookie helpers
│   ├── prisma.ts                   # Prisma client singleton
│   └── response.ts                 # API response formatting helpers
├── middleware.ts                   # Route protection & auth verification
└── prisma/
    ├── schema.prisma               # Database schema definition
    └── seed.ts                     # Database seeding script (optional)
```

## Authentication Flow

### Registration
1. User enters name, email, and password on `/signup`
2. Server validates input and checks if email exists
3. Password is hashed with bcryptjs (12 rounds)
4. User record is created in database
5. JWT token is signed with 7-day expiration
6. Token is set as HTTP-only, secure cookie (`ttm_token`)
7. User is redirected to `/projects`

### Login
1. User enters email and password on `/login`
2. Server finds user by email
3. Password is verified against stored hash
4. JWT token is signed and set as HTTP-only cookie
5. User is redirected to `/projects`

### Session Management
- Cookies are sent automatically with every request
- Middleware verifies token on protected routes
- Token expiration: 7 days
- Unauthorized users are redirected to `/login`

### Logout
- Cookie is cleared (maxAge: 0)
- User is redirected to `/login`

## API Reference

### Authentication Endpoints

**POST `/api/auth/signup`**
- Create new user account
- Body: `{ name, email, password }`
- Returns: `{ success, data: { id, name, email, role } }`

**POST `/api/auth/login`**
- Sign in user
- Body: `{ email, password }`
- Returns: `{ success, data: { id, name, email, role } }`

**POST `/api/auth/logout`**
- Sign out user (clears session cookie)
- Returns: `{ success, data: { message } }`

**GET `/api/auth/me`**
- Get current user
- Returns: `{ success, data: { id, name, email, role } }`

### Project Endpoints

**GET `/api/projects`**
- List user's projects
- Returns: `{ success, data: Project[] }`

**POST `/api/projects`**
- Create new project
- Body: `{ name, description? }`
- Returns: `{ success, data: Project }`

**GET `/api/projects/[id]`**
- Get project details with members and tasks
- Returns: `{ success, data: Project }`

**PUT `/api/projects/[id]`**
- Update project (name/description)
- Body: `{ name?, description? }`
- Returns: `{ success, data: Project }`

**DELETE `/api/projects/[id]`**
- Delete project and all associated tasks
- Returns: `{ success, data: { message } }`

### Task Endpoints

**POST `/api/projects/[id]/tasks`**
- Create task in project
- Body: `{ title, description?, priority?, dueDate? }`
- Returns: `{ success, data: Task }`

**GET `/api/projects/[id]/tasks`**
- List project tasks
- Returns: `{ success, data: Task[] }`

**PUT `/api/tasks/[id]`**
- Update task (title, status, priority, etc.)
- Body: `{ title?, status?, priority?, assigneeId?, dueDate? }`
- Returns: `{ success, data: Task }`

**DELETE `/api/tasks/[id]`**
- Delete task
- Returns: `{ success, data: { message } }`

### Dashboard Endpoint

**GET `/api/dashboard`**
- Get dashboard statistics and recent activity
- Returns: 
```json
{
  "success": true,
  "data": {
    "stats": { "total", "todo", "inProgress", "done", "overdue" },
    "myTasks": Task[],
    "recentTasks": Task[],
    "projects": Project[]
  }
}
```

## Deployment

### Deploy to Railway

Railway automatically builds and deploys your Next.js app. Follow these steps:

#### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

#### Step 2: Connect to Railway
1. Go to [railway.app](https://railway.app)
2. Sign up or log in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository

#### Step 3: Add PostgreSQL Database
1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway automatically sets `DATABASE_URL` environment variable

#### Step 4: Set Environment Variables
In Railway dashboard for your app service, go to **Variables**:
```env
JWT_SECRET=<generate-with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
NODE_ENV=production
```

#### Step 5: Configure Build & Start Commands
The `railway.toml` file handles this automatically:
- **Build**: `npm ci && npx prisma generate && npm run build`
- **Start**: `npx prisma migrate deploy && npm start`
- **Health Check**: `GET /api/auth/me` (every 30 seconds)

#### Step 6: Deploy
Push a new commit to trigger deployment:
```bash
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

**Your app is now live!** Railway provides a public URL.

## Development Tips

### Hot Reload
The dev server automatically reloads when you save files—no manual refresh needed.

### Database Changes
After modifying `prisma/schema.prisma`:
```bash
npm run db:push
```

### View Database Queries
Prisma logs all queries to console in development:
```
prisma:query SELECT ...
```

### Debug Authentication
- Check browser DevTools → Application → Cookies for `ttm_token`
- Inspect API responses in Network tab
- Check server logs for auth errors

### Reset Local Database
```bash
# Delete the SQLite file and recreate schema
rm dev.db
npm run db:push
```

## Performance

- **Server-side rendering** for dashboard and projects
- **Optimized Prisma queries** with proper relations
- **HTTP-only cookies** prevent XSS attacks
- **JWT tokens** enable stateless authentication
- **Tailwind CSS purging** minimizes bundle size

## Security

✅ **HTTP-only cookies** — Not accessible via JavaScript  
✅ **Secure flag** — Cookie only sent over HTTPS in production  
✅ **SameSite=Lax** — CSRF protection  
✅ **Password hashing** — bcryptjs with 12 salt rounds  
✅ **JWT expiration** — 7-day token lifetime  
✅ **Route protection** — Middleware validates auth on protected pages  

## Troubleshooting

**Port already in use?**
```bash
npm run dev -- -p 3001
```

**Database connection error?**
```bash
# Verify DATABASE_URL in .env
# Reset database if corrupted
rm dev.db
npm run db:push
```

**Prisma client not found?**
```bash
npx prisma generate
```

**Clear build cache?**
```bash
rm -rf .next
npm run dev
```

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

MIT License — See LICENSE file for details.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

## Author

**Vaishak V Nair**  
[GitHub](https://github.com/vaishak-v-nair) | [Email](mailto:vaishak@example.com)

---

Built with ❤️ using Next.js 14, TypeScript, Tailwind CSS, and Prisma
