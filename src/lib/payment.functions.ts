// TALKSWAHILI uses the Velasite FimiPay implementation in /api/fimipay.ts.
// This file is kept only for compatibility with older imports.
export const PAYMENT_AMOUNT = Number(import.meta.env.VITE_ACTIVATION_FEE || 16000);
export const PAYMENT_CURRENCY = "TZS";
