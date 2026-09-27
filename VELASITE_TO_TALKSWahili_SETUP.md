# TALKSWAHILI — Velasite Payment + Database Integration

## What was changed

TALKSWAHILI now uses the working Velasite backend pattern:

- Supabase authentication + `profiles`
- Velasite Automatic Push through `/api/fimipay`
- Velasite FimiPay order-status checking
- Velasite Lipa Namba/manual payment flow
- Velasite `/admin` panel
- Activation/deactivation and ban controls
- Withdrawals + admin approval/rejection
- Notifications + admin broadcast
- Balance ledger
- Server-side chat rewards after a completed 10-message session
- One shared Supabase database can be used by both TALKSWAHILI and Velasite

## 1. Shared database

Use:

`supabase/TALKSWAHILI_VELASITE_SHARED.sql`

If Velasite already works against the same Supabase project, this SQL is intended as a compatibility/upgrade script. Back up the database first.

The important shared tables include:

- `profiles`
- `admin_users`
- `payment_requests`
- `automatic_payments`
- `withdrawal_requests`
- `chat_reward_transactions`
- `notifications`
- `balance_transactions`

## 2. Environment variables for TALKSWAHILI

Copy the values from the working Velasite deployment.

Required:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SECRET_KEY

FIMIPAY_API_KEY=YOUR_LIVE_SECRET_KEY
FIMIPAY_AMOUNT=16000
FIMIPAY_CURRENCY=TZS
```

FimiPay endpoint variables used by the working Velasite implementation:

```env
FIMIPAY_CREATE_PAYMENT_URL=https://fimipay.com/api/v1/payment/create_order
FIMIPAY_ORDER_STATUS_URL=https://fimipay.com/api/v1/payment/order_status
```

Optional frontend amount:

```env
VITE_ACTIVATION_FEE=16000
```

### Important

Do not put `FIMIPAY_API_KEY` or `SUPABASE_SECRET_KEY` into any `VITE_*` variable.

For Vercel, add the variables to the TALKSWAHILI project under Settings → Environment Variables, then redeploy.

## 3. Payment details copied from Velasite

Automatic:

- FimiPay
- Amount: TZS 16,000
- Currency: TZS
- Create-order endpoint: `/api/v1/payment/create_order`
- Order-status endpoint: `/api/v1/payment/order_status`

Manual/Lipa Namba:

- Lipa Namba: `251226427`
- Jina: `INNOCENT EDWARD`
- Amount: TZS 16,000

## 4. Admin

The admin page is:

`/admin`

Admin authorization comes from:

```sql
public.admin_users
```

To make an existing Supabase Auth user an admin:

```sql
INSERT INTO public.admin_users (user_id)
SELECT id
FROM auth.users
WHERE email = 'YOUR_ADMIN_EMAIL@example.com'
ON CONFLICT (user_id) DO NOTHING;
```

## 5. Both projects using the same database

If Velasite and TALKSWAHILI are supposed to use exactly the same user accounts, payments and balances, set both projects to the same:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- Supabase service/secret key on the server side

Do not create a second Supabase project for TALKSWAHILI if the goal is one shared database.

## 6. Important deployment note

The uploaded Velasite project was treated as the working reference. TALKSWAHILI received its payment/API/database/admin integration from that implementation using the working FimiPay flow.

The local `src/lib/payment.functions.ts` is now only a compatibility constants file; it contains no legacy payment-provider integration. The actual payment implementation is:

`api/fimipay.ts`

## 7. Verification

Before going live:

1. Confirm both apps point to the same Supabase project.
2. Confirm the FimiPay secret is the same working secret used by Velasite.
3. Register a test account in TALKSWAHILI.
4. Confirm a `profiles` row is created.
5. Open `/payment`.
6. Test Automatic Push.
7. Check that `automatic_payments` receives the order.
8. Confirm successful status activates `profiles.activated`.
9. Test Lipa Namba/manual flow and approve it from `/admin`.
10. Test a withdrawal and approve/reject it from `/admin`.
11. Test a 10-message chat session and verify the reward appears once in the balance ledger.

