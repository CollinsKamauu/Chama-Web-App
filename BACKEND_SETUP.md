# Backend Setup Guide — Transactions Persistence

This guide walks your backend developer through wiring up Supabase + Prisma so that
Safaricom M-Pesa callbacks are saved to a database and exposed to the frontend.

---

## 1. Create a Supabase Project

1. Go to https://supabase.com and sign up (free tier is sufficient)
2. Create a new project — name it `milestone-chama`
3. Go to **Project Settings → Database → Connection string** and select **URI** mode
4. Copy the connection string — it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-REF].supabase.co:5432/postgres
   ```

---

## 2. Add Environment Variable on Render.com

1. Go to your Render.com backend service dashboard
2. Go to **Environment → Add Environment Variable**
3. Add:
   ```
   DATABASE_URL = postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
   ```

---

## 3. Install Prisma in the Backend

In your backend project root, run:

```bash
npm install @prisma/client
npm install --save-dev prisma
```

---

## 4. Copy the Generated Files

Prisma lives under `server/` in this repo (not `src/`) so the **Netlify static build** (`tsc -b && vite build`) only type-checks browser code under `src/` and never requires `@prisma/client`. Your Node backend on Render still uses the same module unchanged.

Copy these files from the frontend project root into your **backend** project:

| File | Destination |
|------|-------------|
| `prisma/schema.prisma` | `prisma/schema.prisma` |
| `server/transactionService.ts` | `server/transactionService.ts` |
| `mpesa.ts` | Replace your existing `mpesa.ts` |

---

## 5. Run Prisma Migration

```bash
npx prisma migrate dev --name init
npx prisma generate
```

This creates the `transactions` table in your Supabase database.

---

## 6. Add the GET /api/payments Endpoint

In your backend `app.ts` or `routes/payments.ts`, add:

```typescript
import { Router } from 'express'
import { getAllTransactions } from '../server/transactionService'

const router = Router()

// GET /api/payments
// Returns all transactions ordered by most recent first
// Requires: Authorization: Bearer <token>
router.get('/payments', async (req, res) => {
  try {
    const transactions = await getAllTransactions()
    res.json({ success: true, data: transactions })
  } catch (error) {
    console.error('Failed to fetch transactions:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' })
  }
})

export default router
```

Then mount it in `app.ts`:

```typescript
import paymentsRouter from './routes/payments'
app.use('/api', paymentsRouter)
```

---

## 7. Verify It Works

Once deployed to Render.com:

1. Run the **Simulate C2B Payment** request in Postman (after fixing the 403)
2. Check your Supabase dashboard → **Table Editor → transactions** — you should see a new row
3. Call `GET https://milestone-chama-backend.onrender.com/api/payments` in Postman — you should get the saved transaction back

---

## Data Flow Summary

```
Safaricom Sandbox
      │
      │  POST /confirmation
      ▼
Render.com Backend (mpesa.ts)
      │
      │  saveC2BTransaction(payload)
      ▼
Prisma ORM
      │
      │  upsert into transactions table
      ▼
Supabase PostgreSQL
      │
      │  GET /api/payments
      ▼
React Frontend (src/api/payments.ts)
      │
      │  fetchTransactions(token)
      ▼
Dashboard — Live Transactions Table
```

---

## Transaction Table Schema

| Column | Type | Description |
|--------|------|-------------|
| id | String (cuid) | Auto-generated primary key |
| transId | String (unique) | Safaricom TransID e.g. RKTQDM7W6S |
| transAmount | Float | Payment amount e.g. 1000.00 |
| msisdn | String | Payer phone number e.g. 254712345678 |
| billRefNumber | String | Account reference e.g. MSL |
| transTime | String | Safaricom timestamp e.g. 20260325140000 |
| firstName | String | Payer first name |
| lastName | String | Payer last name |
| businessShortCode | String | Paybill number e.g. 24798 |
| transType | String | "C2B" or "STKPush" |
| createdAt | DateTime | When the record was created |
