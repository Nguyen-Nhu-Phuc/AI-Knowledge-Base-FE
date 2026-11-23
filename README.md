# Web — AI Knowledge Base

Next.js 15 App Router frontend aligned to NestJS `apps/api` (`/api/v1`).

## Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS + next-themes
- TanStack Query + Zustand
- SSE chat (`src/lib/chat-sse.ts`) + presigned upload (`src/lib/upload.ts`)

## API coverage

| BE area | FE |
|---------|----|
| Auth register/login/refresh/logout | `/login`, `/register`, `api.ts` |
| Users me / password | `/app/settings` |
| Orgs CRUD + members + invite links | dashboard, settings, `/app/members`, `/invite/[token]` |
| Knowledge bases CRUD | `/app/knowledge-bases` |
| Documents upload/confirm/list/delete/reprocess | `/app/knowledge-bases/[kbId]` |
| Versions + activate + jobs retry + chunks | document Details panel |
| Hybrid search | `/app/search` |
| Chat SSE + conversations + feedback | `/app/chat` (`research`, `rewrite`) |
| Usage + analytics overview | `/app/analytics` (admin+) |
| Platform admin orgs/jobs | `/app/admin` (`isPlatformAdmin`) |
| Health | not UI (ops) |

Upload MIME/size rules mirror `apps/api/src/common/constants/upload.constants.ts` (50MB; pdf/docx/txt/md).

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

- App: http://localhost:3000
- `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`
