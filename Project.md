# Spendly API

REST API backend for the Spendly personal finance app. Handles auth, wallets, transactions, categories, currencies, AI-powered transaction parsing, and financial reports.

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript 5.7 |
| Framework | Fastify v5 |
| ORM | Prisma v6 |
| Database | PostgreSQL |
| Validation | Zod v3 (via fastify-type-provider-zod v4) |
| Auth | JWT — access + refresh tokens (@fastify/jwt v9) |
| 2FA | TOTP-style email code via Resend |
| File storage | Cloudinary |
| AI | OpenAI v6 (transaction text + voice parsing) |
| Email | Resend |
| File uploads | @fastify/multipart |
| Build | tsc + tsc-alias |
| Deployment | Docker + Google Cloud Build |

## Project Structure

```
spendly-api/
├── src/
│   ├── index.ts                   # Entry — Fastify setup, plugin registration, server start
│   ├── config.ts                  # Env variable schema + validation (fastify-env)
│   ├── bootstrap/
│   │   ├── email.ts               # Resend client setup
│   │   ├── jwt.ts                 # @fastify/jwt config
│   │   ├── multipart.ts           # @fastify/multipart (file uploads)
│   │   └── openai.ts              # OpenAI client setup
│   ├── routes/                    # HTTP route handlers
│   │   ├── app.ts                 # GET /ping — health check
│   │   ├── auth/                  # Register, login, refresh, 2FA, logout
│   │   ├── category/              # CRUD categories + user favourites
│   │   ├── currency/              # List currencies + user favourites
│   │   ├── transaction/           # CRUD + AI parsing (text / voice)
│   │   ├── wallet/                # CRUD wallets + archive
│   │   └── reports/               # Balance trend, income/expense, category breakdown
│   ├── business/
│   │   ├── services/
│   │   │   ├── auth/              # Register, login, token refresh, 2FA flows
│   │   │   ├── category/
│   │   │   ├── cloudinary/        # Image upload / delete
│   │   │   ├── currency/
│   │   │   ├── reports/           # Financial aggregation queries
│   │   │   ├── snapshot/          # Daily balance snapshot — updated on every transaction write
│   │   │   ├── tokens/            # Token creation / validation / revocation
│   │   │   ├── transaction/       # CRUD + OpenAI parsing
│   │   │   └── wallet/            # CRUD + balance recalculation
│   │   └── lib/
│   │       ├── jwt.ts             # Sign / verify helpers
│   │       ├── errors/            # Custom Fastify error classes
│   │       └── validation/        # Zod schemas per domain
│   ├── database/
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Database schema
│   │   │   ├── prisma.ts          # Prisma client singleton + proxy
│   │   │   ├── seed.ts            # Initial seed: currencies + categories
│   │   │   └── migrations/        # SQL migration history
│   │   └── repositories/          # Data access layer
│   │       ├── user/
│   │       ├── token/
│   │       ├── transaction/
│   │       ├── wallet/
│   │       ├── category/
│   │       ├── currency/
│   │       └── daily-snapshot/
│   └── types/                     # Global TypeScript declarations
├── docker-compose.yml             # Local dev: PostgreSQL + API
├── Dockerfile
├── cloudbuild.yaml                # Google Cloud Build — API deploy
└── migration-cloudbuild.yaml      # Google Cloud Build — migrations
```

## Database Schema

### Models

| Model | Key Fields |
|---|---|
| **User** | id, type (`GUEST`/`REGISTERED`), email, passwordHash, avatarUrl, totalBalance, isTwoFactorEnabled, mainCurrencyCode |
| **Token** | id, userId, token, type (`REFRESH`) |
| **Transaction** | id, userId, amount, date, description, categoryId, type (`INCOME`/`EXPENSE`), walletId, currencyCode, convertedAmount, mainCurrencyCode |
| **Wallet** | id, userId, name, type (`CASH`/`DEBIT_CARD`/`CREDIT_CARD`/`SAVINGS`/`CUSTOM`), currencyCode, initialBalance, balance, isDefault, isArchived |
| **DailyBalanceSnapshot** | id, userId, date, openingBalance, closingBalance, totalIncome, totalExpense, netChange |
| **Currency** | code (PK, 3-char ISO), name |
| **Category** | id, name, color (hex), type (`INCOME`/`EXPENSE`), order |
| **UserFavoriteCurrency** | userId, currencyCode, order |
| **UserFavoriteCategory** | userId, categoryId, order |

### Notes
- `totalBalance` on User is a denormalised sum maintained by wallet/transaction services on every write
- `DailyBalanceSnapshot` is created/updated by `SnapshotService` on each transaction write — powers the balance trend chart in analytics
- Categories are global (not per-user); users maintain an ordered favourites list
- All monetary amounts are stored as floats; conversion happens in the transaction service using exchange rates
- `convertedAmount` + `mainCurrencyCode` stored on Transaction for multi-currency display in the mobile app

## API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/ping` | — | Health check |
| POST | `/auth/register` | — | Create guest or registered user |
| POST | `/auth/login` | — | Email + password login |
| POST | `/auth/refresh` | — | Refresh access token |
| POST | `/auth/logout` | ✓ | Revoke refresh token |
| POST | `/auth/2fa/send` | ✓ | Send 2FA email code |
| POST | `/auth/2fa/verify` | ✓ | Verify 2FA code, return tokens |
| GET | `/wallets` | ✓ | List user wallets |
| POST | `/wallets` | ✓ | Create wallet |
| PATCH | `/wallets/:id` | ✓ | Update wallet |
| DELETE | `/wallets/:id` | ✓ | Delete wallet |
| GET | `/transactions` | ✓ | List (filterable: startDate, endDate, search, walletId) |
| POST | `/transactions` | ✓ | Create transaction manually |
| POST | `/transactions/ai/text` | ✓ | Parse from natural language text (OpenAI) |
| POST | `/transactions/ai/voice` | ✓ | Parse from audio recording (OpenAI Whisper) |
| PATCH | `/transactions/:id` | ✓ | Update transaction |
| DELETE | `/transactions/:id` | ✓ | Delete transaction |
| GET | `/categories` | ✓ | List all categories |
| GET | `/categories/favorites` | ✓ | User's favourite categories |
| POST | `/categories/favorites` | ✓ | Add favourite category |
| DELETE | `/categories/favorites/:id` | ✓ | Remove favourite category |
| GET | `/currencies` | ✓ | List all currencies |
| GET | `/currencies/favorites` | ✓ | User's favourite currencies |
| POST | `/currencies/favorites` | ✓ | Add favourite currency |
| DELETE | `/currencies/favorites/:id` | ✓ | Remove favourite currency |
| GET | `/reports/balance-trend` | ✓ | Balance over time (from DailySnapshots) |
| GET | `/reports/income-expense` | ✓ | Income vs expense totals per period |
| GET | `/reports/categories` | ✓ | Spending breakdown by category |

## Auth Flow

1. **Register** — email optional; `GUEST` users get a UUID-based account, can upgrade later
2. **Login** → returns short-lived `accessToken` (JWT) + `refreshToken` (stored in DB)
3. **Mobile** stores tokens in Expo SecureStore; attaches `Authorization: Bearer <accessToken>` to every request
4. **On 401** → mobile calls `POST /auth/refresh` → new access token issued, old refresh token revoked
5. **2FA** — enabled per-user; login triggers email code via Resend; `POST /auth/2fa/verify` returns tokens

## AI Transaction Parsing

Both endpoints hit OpenAI with a structured prompt that extracts:
- `amount`, `currencyCode`, `type` (INCOME/EXPENSE), `description`, `categoryName`, `date`

- **Text** (`POST /transactions/ai/text`) — user sends a natural language string
- **Voice** (`POST /transactions/ai/voice`) — multipart audio upload; transcribed via Whisper, then parsed

The service matches the extracted `categoryName` against the user's favourite categories (fuzzy match) and falls back to a default.

## Business Logic Notes

- **Balance recalculation** — every transaction create/update/delete triggers `WalletService.recalculate()` which recomputes wallet balance from `initialBalance + sum(transactions)`, then propagates to `User.totalBalance`
- **Snapshot** — `SnapshotService.upsert()` is called after each transaction write with the affected date; it aggregates that day's totals and updates/creates the `DailyBalanceSnapshot` row

## Dev Commands

```bash
npm run dev                      # ts-node-dev with hot reload
npm run build                    # Compile TypeScript → build/
npm run prisma:migrate:dev       # Run pending migrations (dev)
npm run prisma:migrate:apply     # Apply migrations
npm run prisma:migrate:deploy    # Deploy migrations (prod)
npm run prisma:studio            # Prisma Studio GUI
npm run prisma:seed              # Seed currencies + categories
npm run prisma:reset             # Reset DB + re-run all migrations
docker-compose up -d             # Start local PostgreSQL
```

## Environment Variables

See `.env_example`. Key variables:

```
DATABASE_URL           # PostgreSQL connection string
JWT_ACCESS_SECRET      # Access token signing key
JWT_REFRESH_SECRET     # Refresh token signing key
OPENAI_API_KEY         # OpenAI (text + voice parsing)
CLOUDINARY_CLOUD_NAME  # Cloudinary
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
RESEND_API_KEY         # Email (2FA codes)
PORT                   # Default: 3000
HOST                   # Default: 0.0.0.0
```
