# Pyramid — Modern Collaborative Task & Workspace Management System

> **Full Stack Developer Technical Assessment Submission**  
> Built strictly adhering to the assessment requirements, tech stack specifications, and Figma design fidelity.

---

## 📑 Table of Contents
1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Key Features & Figma Fidelity](#-key-features--figma-fidelity)
4. [Architecture & Project Structure](#-architecture--project-structure)
5. [Getting Started & Local Setup](#-getting-started--local-setup)
6. [Environment Variables](#-environment-variables)
7. [API Endpoints Reference](#-api-endpoints-reference)
8. [Theme Persistence & Responsive Design](#-theme-persistence--responsive-design)
9. [Part 2: Product Understanding (AbleSpace)](#-part-2-product-understanding-ablespace)
10. [Intentional Engineering Decisions](#-intentional-engineering-decisions)

---

## 🌟 Project Overview

**Pyramid** is an enterprise-grade collaborative task and project management application modeled after modern productivity platforms (Linear, Monday, Jira). It features real-time Kanban boards, multi-workspace isolation, threaded task discussions, subtask workflows, customizable project timelines, and seamless dark/light theme persistence.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router architecture)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing throughout)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Vanilla CSS tokens, custom animations, fluid layouts)
- **State Management**: React Context API (`AuthContext`, `BoardContext`, `ThemeContext`)
- **Drag & Drop**: [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) (Smooth, accessible drag & drop)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Framework**: [NestJS 10+](https://nestjs.com/) (Modular architecture, dependency injection, pipes, filters)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **ORM & Database**: [Prisma ORM](https://www.prisma.io/) with SQLite (local development) / PostgreSQL (production ready)
- **Authentication**: JWT (`@nestjs/jwt`), Passport (`@nestjs/passport`), and bcrypt password hashing
- **Validation**: `class-validator` & `class-transformer` with global validation pipes
- **Documentation**: Swagger / OpenAPI (`@nestjs/swagger`) at `/api/docs`

---

## 🎯 Key Features & Figma Fidelity

### 1. Authentication & Onboarding
- **Guest Login (1-Click)**: Instant exploration with an isolated guest account and pre-configured workspace.
- **Google Sign-In**: Native Google OAuth2 popup integration (`accounts.google.com`) with automated profile syncing and dedicated workspace creation.
- **Email & Password Login**: Credential authentication with validation error alerts.
- **Isolated User Workspaces**: Every new account receives a fresh, isolated workspace with zero hardcoded task pollution.

### 2. Kanban Board & List Views
- **Fluid Drag-and-Drop**: Reorder tasks within columns or move across workflow stages (`To Do`, `Doing`, `Completed`, `On Hold`).
- **Column Customization**: Add, rename, color-code, or delete custom columns with automatic position recalculation.
- **List View**: Structured tabular representation of tasks with sorting, multi-criteria filtering, and inline edits.

### 3. Task Detail & Collaboration View
- **Fluid Screen Expansion**: Collapsing the right Details panel smoothly expands the main workspace to **100% full-width (`w-full`)**.
- **Interactive Subtasks**: Create subtasks with individual assignees, due dates, priority tags, and completion checkboxes.
- **Threaded Discussions & Replies**: Post comments, reply to specific threads, and edit or delete messages.
- **Real-Time Activity Audit Trail**: Automatically tracks status transitions, priority updates, assignee changes, and comment timestamps.
- **Attachments & Resources**: Upload and manage file attachments and external reference URLs.

### 4. Project Management
- **Dedicated Projects View**: Organize tasks by high-level business initiatives, assign project leads, and track target deadlines.
- **Project Detail Dashboard**: Filter boards and lists strictly scoped to a selected project.

### 5. Multi-Workspace Architecture & Member Roles
- **Workspace Switcher**: Easily switch between multiple workspaces.
- **Role-Based Access Control**:
  - `OWNER`: Full workspace ownership, settings configuration, member role management, ownership transfer.
  - `ADMIN`: Invite teammates, manage boards and tasks, view pending invitations.
  - `MEMBER`: Collaborate on tasks, view workspace members and pending invites.
- **Invite Links**: Generate and copy direct workspace invite URLs (`/invite/:token`).
- **Automatic Owner Succession**: If an owner leaves a workspace, ownership automatically transfers to the senior active Admin or Member.

---

## 📁 Architecture & Project Structure

```
kanban-task-management/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma         # Database schema (User, Workspace, Board, Column, Task, Subtask, Comment, Activity)
│   ├── src/
│   │   ├── auth/                 # JWT Auth, Google Sign-In, Guest Login, Guards & Strategies
│   │   ├── workspaces/           # Workspace CRUD, Members, Role permissions, Invitations
│   │   ├── boards/               # Boards and Column management
│   │   ├── tasks/                # Task CRUD, Move/Reorder, Subtasks, Comments, Activity logging
│   │   ├── projects/             # Projects CRUD & workspace scoping
│   │   ├── prisma/               # Prisma service & client lifecycle
│   │   ├── app.module.ts         # Root NestJS module
│   │   └── main.ts               # Server bootstrap, global pipes, CORS, Swagger setup
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js App Router (layout.tsx, page.tsx, globals.css)
│   │   ├── components/
│   │   │   ├── auth/             # AuthScreen, Google OAuth modal, Email login form
│   │   │   ├── board/            # KanbanBoardView, KanbanColumn, TaskCard
│   │   │   ├── list/             # ListView, TaskTableRow
│   │   │   ├── detail/           # TaskDetailView, SubtasksTable, DiscussionThread, UpdatesSidebar
│   │   │   ├── layout/           # WorkspaceSidebar, TasksHeader
│   │   │   ├── modals/           # CreateTask, CreateProject, InviteMember, WorkspaceSettings
│   │   │   └── common/           # ConfirmDialog, DatePickerPopover
│   │   ├── contexts/             # AuthContext, BoardContext, ThemeContext
│   │   ├── hooks/                # useWorkspace, useDebounce
│   │   ├── services/             # Axios/Fetch API client with error handling
│   │   └── types/                # Strict TypeScript interfaces
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── PART2_PRODUCT_UNDERSTANDING.md # AbleSpace Caseload & Take Data deep-dive analysis
└── README.md
```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm** or **yarn** / **pnpm**

---

### Step 1: Clone Repository
```bash
git clone <YOUR_REPOSITORY_URL>
cd kanban-task-management
```

---

### Step 2: Backend Setup
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Initialize database schema
npx prisma generate
npx prisma db push

# Start NestJS development server (Port 4000)
npm run start:dev
```
> Backend will be running at: `http://localhost:4000`  
> Interactive Swagger API Documentation: `http://localhost:4000/api/docs`

---

### Step 3: Frontend Setup
In a separate terminal:
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Next.js App Router development server (Port 3000)
npm run dev
```
> Frontend will be running at: `http://localhost:3000`

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET="pyramid-super-secret-jwt-key-2026"
FRONTEND_URL="http://localhost:3000"
```

### Frontend (`frontend/.env`)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=644272848172-6pdgjqnlhjh4oki6cekp4hakumr5acc1.apps.googleusercontent.com
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/guest` | Instant Guest login | No |
| `POST` | `/api/auth/google` | Google OAuth authentication | No |
| `POST` | `/api/auth/login` | Email & password login | No |
| `GET` | `/api/auth/me` | Fetch authenticated profile | Yes |
| `GET` | `/api/workspaces` | List user workspaces | Yes |
| `POST` | `/api/workspaces` | Create new workspace | Yes |
| `POST` | `/api/workspaces/:id/invite` | Generate workspace invite link | Yes |
| `POST` | `/api/workspaces/join/:token`| Accept workspace invitation | Yes |
| `GET` | `/api/boards` | List workspace boards & columns | Yes |
| `POST` | `/api/tasks` | Create task with subtasks | Yes |
| `PATCH`| `/api/tasks/:id` | Update task properties | Yes |
| `POST` | `/api/tasks/:id/move` | Move/reorder task position | Yes |
| `POST` | `/api/tasks/:id/comments` | Add threaded comment/reply | Yes |
| `GET` | `/api/projects` | List workspace projects | Yes |

---

## 🌓 Theme Persistence & Responsive Design

- **Theme Persistence**: Theme preference (`dark` | `light`) is stored in `localStorage` (`kanban_theme`) and evaluated synchronously on initial render, preventing layout shifts or flashing.
- **Adaptive Breakpoints**:
  - **Desktop (1280px+)**: Multi-column Kanban board, sidebar navigation, collapsible task details drawer.
  - **Tablet (768px - 1024px)**: Collapsible sidebar, responsive board scrolling, adaptive modals.
  - **Mobile (< 768px)**: Touch-friendly layout, bottom sheets, full-screen task editor.

---

## 📖 Part 2: Product Understanding (AbleSpace)

The complete, hands-on analysis for **Part 2 – Product Understanding (AbleSpace "Caseload → Take Data" Workflow)** is documented in [`PART2_PRODUCT_UNDERSTANDING.md`](./PART2_PRODUCT_UNDERSTANDING.md).

### Summary of Part 2 Findings & UX Improvements:
1. **End-to-End Hands-On Walkthrough**: Evaluated all 7 demo IEP goals across **List**, **Board**, and **Group** views on `app.ablespace.io`, analyzing 5+ distinct data-collection widgets (tally counters, letter checklists, prompt/accuracy counters, Wh-question accordions, and independence scales).
2. **Key UX/UI & Functionality Enhancements Identified**:
   - **Resizable / Collapsible Panels**: Replaced rigid fixed widths with draggable dividers to display long IEP goal targets without horizontal scrolling.
   - **Horizontal Space Utilization**: Replaced single-column board cards with responsive multi-column grid layouts.
   - **Goal Effort Badges**: Added data-type indicators (`Tally`, `Checklist`, `Prompt`, `Scale`) on goal cards before opening.
   - **Filter Modal Clarity**: Separated table column visibility controls from record value filters.
   - **Consistent Paywall UX**: Fixed inconsistent *"Performance Summary"* access rules across Info and Stats tabs.
   - **Primary Action Differentiation**: Styled *"Take Data"* (active session) distinctively from *"View Data"* (read-only) to avoid mis-clicks.

---

## 💡 Intentional Engineering Decisions

1. **Strict TypeScript & 0 Build Warnings**: Verified with `npx tsc --noEmit` across both frontend and backend directories.
2. **Clean Codebase**: Removed all dead comments, unused UI boilerplate, and unnecessary logs for production readiness.
3. **No Window Alerts**: Replaced all native browser `alert()` and `confirm()` dialogs with custom accessible modal dialogs (`ConfirmDialog.tsx`).
4. **Optimistic Updates with Background Reconciliation**: Kanban drag-and-drop and comment postings update the UI immediately while reconciling with the backend server.
