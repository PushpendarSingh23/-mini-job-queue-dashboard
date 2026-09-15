# Mini Job Queue Management Dashboard

A production-ready, full-stack Mini Job Queue Management Dashboard built with **NestJS**, **TypeScript**, **PostgreSQL**, **TypeORM**, **React**, and **Vite**.

- **GitHub Repository**: [PushpendarSingh23/-mini-job-queue-dashboard](https://github.com/PushpendarSingh23/-mini-job-queue-dashboard)
- **Live Backend API (Render)**: [https://mini-job-queue-dashboard-44tb.onrender.com](https://mini-job-queue-dashboard-44tb.onrender.com)
- **Live Health Check**: [https://mini-job-queue-dashboard-44tb.onrender.com/health](https://mini-job-queue-dashboard-44tb.onrender.com/health)

This application provides job creation, filtering, real-time status monitoring, state machine enforcement, and **atomic database-level concurrency protection** against simultaneous status updates across multiple browser tabs or API clients.

---

## Deployment Architecture

```mermaid
graph TD
    User([User / Browser Tabs]) <-->|React 18 + Vite| Vercel[Frontend - Vercel Host]
    Vercel <-->|REST API / HTTPS| Render[Backend - Render Node Web Service]
    Render -->|TypeORM / SSL| Neon[(Neon / Supabase PostgreSQL DB)]
```

- **Frontend (`/frontend`)**: React 18, TypeScript, Vite, Tailwind CSS, Axios → **Deployed on Vercel**
- **Backend (`/backend`)**: NestJS, TypeScript, TypeORM, class-validator → **Deployed on Render**
- **Database**: **Neon PostgreSQL** (or Supabase) via `DATABASE_URL` with SSL support.

---

## Features

- **Job Creation**: Create jobs with required `title` and `type`. Initial status is strictly set to `pending` by the backend.
- **Status Dashboard & Statistics**: Overview cards displaying real-time counts for `All`, `Pending`, `Running`, `Completed`, and `Failed` jobs.
- **Backend-Driven Filtering**: Filter jobs by status (`POST /jobs?status=...`) while maintaining accurate global count metrics.
- **Strict State Machine**: Enforces valid state transitions (`pending` → `running` | `failed`, `running` → `completed` | `failed`).
- **Atomic Concurrency Protection**: Uses database-level conditional updates to prevent race conditions when concurrent requests attempt state changes on the same job.
- **Resilient Multi-Tab UX**: Detects concurrent state modification conflicts, displays user-friendly error banners, and automatically refreshes job state.
- **Health Monitoring**: Included `GET /health` endpoint for deployment health checks.
- **Automated Test Suite**: Unit tests verifying state machine transitions, DTO validations, and concurrent update handling.

---

## Job State Machine

Each job transitions through a strictly validated state machine:

```mermaid
stateDiagram-v2
    [*] --> pending: POST /jobs
    pending --> running: PATCH status = running
    pending --> failed: PATCH status = failed
    running --> completed: PATCH status = completed
    running --> failed: PATCH status = failed

    completed --> [*]: Terminal State (No Transitions)
    failed --> [*]: Terminal State (No Transitions)
```

### Transition Validation Rules

| Current Status | Target Status | Allowed? | Rationale |
| :--- | :--- | :---: | :--- |
| `pending` | `running` | ✅ | Job execution started |
| `pending` | `failed` | ✅ | Pre-execution failure / cancellation |
| `running` | `completed` | ✅ | Job finished successfully |
| `running` | `failed` | ✅ | Job encountered execution error |
| `pending` | `completed` | ❌ | Cannot complete without running |
| `running` | `pending` | ❌ | Cannot revert running job back to pending |
| `completed` | *any* | ❌ | Completed jobs are immutable (terminal) |
| `failed` | *any* | ❌ | Failed jobs are immutable (terminal) |
| *any* | `pending` | ❌ | Jobs cannot transition back to pending |

---

## Concurrency & State Transition Handling

### Why Frontend Validation Is Insufficient
Relying solely on frontend UI logic (e.g., hiding or disabling action buttons in React) is insufficient for two critical reasons:
1. **Direct API Access**: Malicious or external clients can bypass the React frontend entirely and issue direct HTTP `PATCH` calls.
2. **Multi-Tab Race Conditions**: If two browser tabs display the same job in a `pending` state, both users can click **"Start"** simultaneously. Both tabs send a `PATCH /jobs/:id/status` request payload `{ "status": "running" }`.

### Why Backend Read-Then-Save Is Vulnerable
A naive backend implementation performs:
```ts
// VULNERABLE APPROACH (DO NOT USE)
const job = await repository.findOneBy({ id });
if (job.status === 'pending') {
  job.status = 'running';
  await repository.save(job);
}
```
If two requests execute `findOneBy` simultaneously, both will read `status = 'pending'` before either `save` call runs. Both requests would then write `status = 'running'`, causing double-execution or invalid state corruptions.

### Our Solution: Atomic Conditional DB Updates
To guarantee strict concurrency safety without heavy distributed locks, we perform an **atomic conditional update** at the database level:

```sql
UPDATE jobs
SET status = 'running'
WHERE id = $1
  AND status = 'pending';
```

In TypeORM, this is implemented cleanly as:

```ts
const updateResult = await this.jobsRepository
  .createQueryBuilder()
  .update(Job)
  .set({ status: targetStatus })
  .where('id = :id AND status IN (:...allowedSourceStatuses)', {
    id,
    allowedSourceStatuses: [JobStatus.PENDING],
  })
  .execute();
```

### Execution Flow Under Simultaneous Requests
When two requests hit the backend concurrently for `pending` → `running`:
1. PostgreSQL processes the `UPDATE` query under row-level locking.
2. **Request 1** matches the row (`status = 'pending'`), updates it to `'running'`, and returns `affected = 1`. The transition succeeds immediately.
3. **Request 2** evaluates the same query. Because Request 1 updated the row, Request 2 sees `status = 'running'`, which does not match `WHERE status = 'pending'`. Request 2 returns `affected = 0`.
4. The service inspects `affected = 0`, checks the job's current status in DB, and throws an HTTP `409 Conflict` exception (`"Invalid status transition... Job status may have changed concurrently."`).
5. The React frontend catches the `409 Conflict` response, displays a helpful error notification, and automatically re-fetches job state from the server.

---

## API Documentation

### 1. `POST /jobs`
Create a new job.
- **Request Body**:
  ```json
  {
    "title": "Process Resume",
    "type": "resume-processing"
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "id": "c9b1d8e0-1234-4567-89ab-cdef01234567",
    "title": "Process Resume",
    "type": "resume-processing",
    "status": "pending",
    "createdAt": "2026-09-15T14:20:00.000Z"
  }
  ```

### 2. `GET /jobs`
Retrieve all jobs, sorted by newest first (`createdAt DESC`).
- **Query Parameters**:
  - `status` (optional): Filter by `pending`, `running`, `completed`, or `failed`. Example: `GET /jobs?status=pending`.
- **Response** (`200 OK`):
  ```json
  [
    {
      "id": "c9b1d8e0-1234-4567-89ab-cdef01234567",
      "title": "Process Resume",
      "type": "resume-processing",
      "status": "pending",
      "createdAt": "2026-09-15T14:20:00.000Z"
    }
  ]
  ```

### 3. `GET /jobs/stats`
Retrieve global status counts.
- **Response** (`200 OK`):
  ```json
  {
    "all": 10,
    "pending": 4,
    "running": 2,
    "completed": 3,
    "failed": 1
  }
  ```

### 4. `PATCH /jobs/:id/status`
Update job status enforcing the state machine and atomic update.
- **Request Body**:
  ```json
  {
    "status": "running"
  }
  ```
- **Response** (`200 OK`): Updated Job object.
- **Errors**: `400 Bad Request` (invalid status/transition), `404 Not Found`, `409 Conflict` (concurrent state change).

### 5. `DELETE /jobs/:id`
Delete a job by UUID.
- **Response** (`200 OK`):
  ```json
  {
    "message": "Job with ID \"c9b1d8e0-...\" deleted successfully"
  }
  ```
- **Errors**: `404 Not Found` if job does not exist.

### 6. `GET /health`
System health check endpoint.
- **Response** (`200 OK`):
  ```json
  {
    "status": "ok",
    "timestamp": "2026-09-15T14:20:00.000Z",
    "uptime": 124.5
  }
  ```

---

## Project Structure

```
mini-job-queue-dashboard/
├── backend/
│   ├── src/
│   │   ├── jobs/
│   │   │   ├── dto/
│   │   │   │   ├── create-job.dto.ts
│   │   │   │   ├── update-job-status.dto.ts
│   │   │   │   └── filter-job.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── job.entity.ts
│   │   │   ├── enums/
│   │   │   │   └── job-status.enum.ts
│   │   │   ├── jobs.controller.ts
│   │   │   ├── jobs.service.ts
│   │   │   └── jobs.module.ts
│   │   ├── health/
│   │   │   ├── health.controller.ts
│   │   │   └── health.module.ts
│   │   ├── common/
│   │   │   └── filters/http-exception.filter.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── src/jobs/jobs.service.spec.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── jobsApi.ts
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── StatsOverview.tsx
│   │   │   ├── JobList.tsx
│   │   │   ├── JobCard.tsx
│   │   │   ├── JobCreateModal.tsx
│   │   │   ├── ConfirmDeleteModal.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── ErrorBanner.tsx
│   │   ├── types/
│   │   │   └── job.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env.example
└── README.md
```

---

## Local Setup & Development

### Prerequisites
- **Node.js**: v18+ (v24 tested)
- **PostgreSQL**: Local or hosted instance (e.g., Supabase / Neon / Render Postgres)

### Step 1: Clone & Navigate
```bash
git clone <repository-url>
cd mini-job-queue-dashboard
```

### Step 2: Backend Setup
```bash
cd backend
npm install
```

Configure `.env` file in `/backend`:
```env
PORT=3000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/job_queue
```

Start backend development server:
```bash
npm run start:dev
```
Backend will start on `http://localhost:3000`.

### Step 3: Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
```

Configure `.env` file in `/frontend`:
```env
VITE_API_URL=http://localhost:3000
```

Start Vite dev server:
```bash
npm run dev
```
Frontend will be accessible at `http://localhost:5173`.

---

## Environment Variables

### Backend (`/backend/.env`)
| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `PORT` | No | `3000` | Port for NestJS server |
| `FRONTEND_URL` | No | `http://localhost:5173` | Allowed CORS origin |
| `DATABASE_URL` | Optional | `postgresql://...` | Full PostgreSQL connection string |
| `DB_HOST` | No | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_USERNAME` | No | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | No | `postgres` | PostgreSQL password |
| `DB_NAME` | No | `job_queue` | PostgreSQL database name |

### Frontend (`/frontend/.env`)
| Variable | Required | Default | Description |
| :--- | :---: | :--- | :--- |
| `VITE_API_URL` | Yes | `http://localhost:3000` | Backend API base URL |

---

## Testing

Run backend Jest unit tests:
```bash
cd backend
npm test
```

### Tested Capabilities
- Job creation with forced `pending` status.
- DTO input validation and string trimming.
- Job retrieval and filtering by status enum.
- All valid state machine transitions (`pending` → `running`/`failed`, `running` → `completed`/`failed`).
- Rejection of invalid transitions (`pending` → `completed`, `completed` → `running`, `failed` → `pending`).
- Atomic conditional update execution and concurrent collision handling (`409 Conflict`).
- Job deletion and non-existent ID handling (`404 Not Found`).

---

## Deployment Guide

### Frontend Deployment (Vercel / Netlify)
1. Push repository to GitHub/GitLab.
2. Connect repo to Vercel/Netlify with Root Directory set to `frontend`.
3. Set environment variable: `VITE_API_URL=https://your-backend-service.onrender.com`.
4. Deploy command: `npm run build`, Output directory: `dist`.

### Backend Deployment (Render / Railway / Fly.io)
1. Connect repo to deployment service with Root Directory set to `backend`.
2. Provision a managed PostgreSQL instance and obtain `DATABASE_URL`.
3. Set environment variables:
   - `DATABASE_URL=postgresql://...`
   - `FRONTEND_URL=https://your-frontend.vercel.app`
4. Build command: `npm run build`.
5. Start command: `npm run start:prod`.

---

## Assumptions & Trade-offs

1. **PostgreSQL Persistence**: Selected for relational schema integrity, enum indexing, and row-level locking for atomic updates.
2. **REST API over WebSockets**: Standard REST with HTTP error statuses was chosen to meet core project constraints while minimizing runtime client connection complexity. Manual & automatic refresh handles state synchronization.
3. **DB-Level Atomic Conditional Update**: Eliminates explicit distributed lock servers (like Redis Redlock) while providing total concurrency safety.

---

## Bonus Improvement

- **Health Check Endpoint (`GET /health`)**: Added to provide container orchestration and deployment platforms (Render, AWS ALB, Kubernetes) with a lightweight liveness probe returning process status and server uptime.

---

## Future Improvements

- **Authentication & Authorization**: Add JWT/OAuth2 role-based access control.
- **Distributed Background Workers**: Integrate Redis & BullMQ to process queued jobs asynchronously.
- **Pagination**: Implement cursor-based pagination for large job lists.
- **Real-Time Updates**: Add Server-Sent Events (SSE) or WebSockets for live status changes.
- **Metrics & Observability**: Add Prometheus metrics and OpenTelemetry trace instrumentation.
