updated 2606 sha 0bd3b87f
# AI Knowledge Base — Frontend

Giao diện web (Next.js) cho **Enterprise AI Knowledge Base**.

## Deploy (production)

| | URL |
|--|--|
| **Live app** | https://tringuon-web.vercel.app |
| **API** | https://akb-api-production.up.railway.app |


Backend riêng: [`AI-Knowledge-Base-BE`](https://github.com/Nguyen-Nhu-Phuc/AI-Knowledge-Base-BE)

---

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript  
- Tailwind CSS + next-themes  
- TanStack Query + Zustand  
- i18n (VI / EN)  
- Chat SSE
O  

---

## Yêu cầu

- Node.js 20+  
- Backend API đang chạy (mặc định `http://localhost:3001`)  
- AI service (qua API) nếu dùng Chat / ingest thật  

---

## Chạy local

```bash
cp .env.example .env.local
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

### `.env.local`

```bash
# Khuyến nghị: same-origin proxy (cookie refresh SameSite=Lax)
NEXT_PUBLIC_API_URL=/api/v1
API_PROXY_TARGET=http://localhost:3001
```

Next.js rewrite `/api/v1/*` → Nest API. Không cần gọi cross-origin trừ khi bạn chủ đích cấu hình cookie `SameSite=None`.

---

## Tính năng UI

| Khu vực | Đường dẫn |
|---------|-----------|
| Đăng nhập / Đăng ký | `/login`, `/register` |
| Tổng quan + hỏi nhanh AI | `/app` |
| Kho tri thức & tài liệu | `/app/knowledge-bases` |
| Chat AI (SSE + citations) | `/app/chat` |
| Tìm kiếm hybrid | `/app/search` |
| Thành viên / invite | `/app/members`, `/invite/[token]` |
| Phân tích | `/app/analytics` |
| Bot / Connectors / People | `/app/bots`, `/app/connectors`, `/app/people` |
| Cài đặt | `/app/settings` |
| Super Admin | `/app/super-admin` |
| Hướng dẫn trong app | `/app/help` |

### Phân quyền

UI ẩn/chặn theo role org: `owner` · `admin` · `member` · `viewer`.  
Super Admin (`isPlatformAdmin`) thấy thêm console hệ thống.

### Thông báo

Chuông trên header — duyệt org, cấp quyền Super Admin, v.v.

---

## Cấu trúc thư mục

```
src/
  app/           # App Router pages
  components/    # UI, shell, notifications, i18n
  lib/           # api client, hooks, upload, chat-sse
  stores/        # auth (Zustand)
  i18n/          # vi / en
```

---

## Làm việc với Backend

1. Clone & chạy [`AI-Knowledge-Base-BE`](https://github.com/Nguyen-Nhu-Phuc/AI-Knowledge-Base-BE) (`api` + `ai` + docker).  
2. Seed demo (tuỳ chọn) trên BE.  
3. Đăng nhập FE bằng tài khoản demo, ví dụ `demo@akb.local` / `Demo1234!`.

---

## Scripts

```bash
npm run dev      # dev server :3000
npm run build    # production build
npm run start    # chạy bản build
npm run lint     # ESLint
```

---

## License

Private — chỉ chủ sở hữu repo.
