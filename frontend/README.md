# Mini Jira — Frontend

React + Vite dashboard (Kanban board, task creation, projects, comments, S3 uploads). Uses Cognito Hosted UI and calls the Express API under `/api/*`.

## Quick start (local)

1. Copy env: `copy .env.example .env` and fill Cognito + API values.
2. Start backend: `cd ../mini-jira-backend && npm run dev`
3. Install and run:

```bash
npm install
npm run dev
```

Open http://localhost:5174 — sign in with Cognito, then use the dashboard.

## Docker (from repo root)

```bash
docker compose up --build
```

- Frontend: http://localhost:5174
- Backend health: http://localhost:3000/health

Ensure `mini-jira-backend/.env` has valid AWS credentials and Cognito settings.

## API wiring

All requests send `Authorization: Bearer <id_token>`. Services live in `src/services/`:

| Endpoint | Service |
|----------|---------|
| `GET /health` | `health.service.ts` |
| `GET/PUT /api/users/me` | `user.service.ts` |
| `GET /api/users?teamId=` | `users.service.ts` |
| Tasks CRUD + status | `tasks.service.ts` |
| Projects CRUD | `projects.service.ts` |
| Comments | `comments.service.ts` |
| Uploads presigned + delete | `uploads.service.ts` |

Set `VITE_API_BASE_URL` to your CloudFront origin host (e.g. `https://dxxxx.cloudfront.net`) in production; paths already include `/api/...`.
