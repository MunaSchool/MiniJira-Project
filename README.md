# Mini-Jira on AWS

Team task board for Software Cloud Computing 2026. Managers assign work across teams. Employees only see tasks for their team. DynamoDB holds app data. S3 holds images. Cognito handles login.

## Stack

- React and Vite in `client/` (frontend scaffold for now)
- Node and Express in `mini-jira-backend/`
- AWS: DynamoDB, S3, Cognito, SNS, SQS, Lambda, EventBridge

## Folder layout

The repo root is `MiniJira-Project`. The API lives in `mini-jira-backend/` because the course guide treats the backend as its own Node app inside the monorepo. The React app sits in `client/`.

```
MiniJira-Project/
├── client/                 React (Vite)
├── mini-jira-backend/      Express API
│   ├── server.js
│   └── src/
│       ├── middleware/     Cognito JWT (Person 1)
│       ├── routes/         users done, rest stubbed
│       ├── services/       DynamoDB, Cognito, AWS clients
│       └── lambda/         placeholders
└── README.md
```

## Where to clone on your PC

Use your user folder, not Program Files:

`C:\Users\munah\Documents\Software Cloud Computing 2026\MiniJira-Project`

That path avoids admin prompts and matches how most of the team will open the repo in Cursor.

## Setup

```bash
cd mini-jira-backend
npm install
copy .env.example .env
```

Fill `.env` with shared IAM keys, Cognito pool id, client id and DynamoDB table names. Do not commit `.env`.

Optional frontend:

```bash
cd client
npm install
npm run dev
```

## Run the API

```bash
cd mini-jira-backend
npm run dev
```

Health check (no auth): `GET http://localhost:3000/health`

Protected routes need a Cognito ID token:

```
Authorization: Bearer <token>
```

## API status (Person 1 done)

| Route | Status |
|-------|--------|
| `GET /health` | Done |
| `GET /api/users/profile` | Done |
| `PUT /api/users/profile` | Done |
| `/api/tasks/*` | 501 stub (Person 2) |
| `/api/projects/*` | 501 stub (Person 3) |
| `/api/comments/*` | 501 stub (Person 3) |
| `/api/uploads/*` | 501 stub (Person 4) |

## Who owns what

| Area | Person |
|------|--------|
| Auth, users, health, DynamoDB client | 1 (Muna) |
| Tasks API | 2 |
| Projects and comments | 3 |
| S3 uploads and image Lambda | 4 |
| SNS, SQS, EventBridge, metrics | 5 |

Stop EC2 and the NAT instance when you are not working. Do not terminate shared AWS resources before the deadline.
