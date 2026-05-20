# Victory Pharmaceutical

Wholesale pharmaceutical ordering system built with Next.js 14, Prisma, NextAuth v5, and Tailwind CSS.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm / npm

## Setup

### 1. Clone and install

```bash
cd victory-pharma
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL (`http://localhost:3000` for dev) |
| `CONTACT_PHONE` | Support phone number |
| `WHATSAPP_LINK` | WhatsApp link (`https://wa.me/<number>`) |
| `NEXT_PUBLIC_CONTACT_PHONE` | Same as CONTACT_PHONE (exposed to client) |
| `NEXT_PUBLIC_WHATSAPP_LINK` | Same as WHATSAPP_LINK (exposed to client) |

### 3. Database setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (development)
npm run db:migrate:dev

# Seed the admin account
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

## Default Admin Account

| Field | Value |
|---|---|
| Email | admin@victory.com |
| Password | ChangeMe123! |

**Change the admin password immediately after first login.**

## Docker

```bash
cp .env.example .env
# Edit .env with your NEXTAUTH_SECRET and contact details
docker-compose up -d
```

## Project Structure

```
src/
├── app/
│   ├── (public)/          # Landing, login, register
│   ├── (dashboard)/
│   │   ├── retail/        # Retail pharmacy pages
│   │   └── wholesale/     # Admin pages
│   └── api/               # Route handlers
├── components/
│   ├── retail/            # Retail-specific components
│   ├── wholesale/         # Admin-specific components
│   └── shared/            # Shared components
├── lib/
│   ├── auth/              # NextAuth config
│   ├── db/                # Prisma client
│   ├── validation/        # Zod schemas
│   └── utils/             # Helpers, rate limiting
├── contexts/              # CartContext
├── types/                 # Global TypeScript types
└── middleware.ts           # Route protection
```

## User Roles

- **wholesale_admin** — manages products, orders, payments, complaints
- **retail_pharmacy** — browses catalog, places orders, tracks delivery, reviews

## Key Flows

1. Register as retail pharmacy → login → browse catalog → add to cart → checkout
2. Admin logs in → adds products → manages incoming orders → confirms payment → receipt auto-generates
3. Retail tracks order via timestamped timeline, submits payment, downloads PDF receipt
