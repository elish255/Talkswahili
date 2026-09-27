# TALKSWAHILI — Vercel Environment Variables

The app uses the same Supabase project as Velasite. Put the values from the working Velasite deployment into the TALKSWAHILI Vercel project.

## Required client variables

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
VITE_ACTIVATION_FEE=16000
```

## Required server variables

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY=YOUR_SUPABASE_SECRET_KEY
FIMIPAY_API_KEY=YOUR_FIMIPAY_SECRET_KEY
FIMIPAY_AMOUNT=16000
FIMIPAY_CURRENCY=TZS
FIMIPAY_CREATE_PAYMENT_URL=https://fimipay.com/api/v1/payment/create_order
FIMIPAY_ORDER_STATUS_URL=https://fimipay.com/api/v1/payment/order_status
```

If Velasite uses `SUPABASE_SERVICE_ROLE_KEY` instead of `SUPABASE_SECRET_KEY`, set that too. The API accepts either.

## Vercel steps

1. Open the TALKSWAHILI project in Vercel.
2. Settings → Environment Variables.
3. Add each variable above to Production (and Preview/Development if needed).
4. Use the exact Supabase/FimiPay values from the working Velasite deployment.
5. Redeploy with a fresh deployment.

Never expose `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `FIMIPAY_API_KEY` as `VITE_*` variables.
