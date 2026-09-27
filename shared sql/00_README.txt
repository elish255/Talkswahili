TALKSWAHILI + VELASITE SHARED SQL

ORDER
Run PART_01 through PART_15 in order in the Supabase SQL Editor.
Copy one part at a time. Do not skip parts. Run PART_15 last because it applies the final business rules (TZS 16,000 activation, TZS 10,000 bonus, admin-only withdrawal).

IMPORTANT
- FimiPay is used for activation/deposit payments only.
- Withdrawals are admin-managed only. No FimiPay payout is used.
- The withdrawal request reserves the user's balance; admin approves or rejects it.
- If admin rejects, the reserved balance is returned.
- The withdrawal compatibility fields provider_reference/provider_status are NOT used for FimiPay. They remain only so the current TALKSWAHILI UI does not break.
- Run each part separately and wait for "Success" before the next part.
- If Supabase says an object already exists, the script is designed to use IF NOT EXISTS / CREATE OR REPLACE where applicable.
