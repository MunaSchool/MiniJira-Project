# Mini Jira Frontend

Standalone React app (separate from `client/` scaffold).

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router, React Query, Axios
- AWS Cognito (client SDK fallback)

## Run

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open **http://localhost:5174/login**

Start the API first:

```bash
cd mini-jira-backend
npm run dev
```

Copy Cognito values from `mini-jira-backend/.env` into `frontend/.env`.

## Auth

1. `POST /auth/login` when the backend exposes it
2. Otherwise Cognito login + `GET /api/users/profile`
3. Manager → `/dashboard`, Employee → `/my-tasks`

Backend is not modified; Vite proxies `/api`, `/auth`, `/health` to port 3000.
