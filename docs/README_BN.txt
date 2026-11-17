# Treasuryio Backend - আলাদা করা Source Files

এই প্যাকেজে রয়েছে:
- `sql/01_READ_ONLY_BACKEND_INVENTORY.sql` — বর্তমান Supabase schema, policies এবং SQL functions দেখার read-only query।
- `supabase/functions/submit-deposit-request/index.ts`
- `supabase/functions/submit-withdrawal/index.ts`

## গুরুত্বপূর্ণ
1. `submit-deposit-request` আপনার দেওয়া source অনুযায়ী রাখা হয়েছে।
2. `submit-withdrawal`-এ server-side minimum withdrawal validation `$100 USDT` করা হয়েছে। আপনার দেওয়া পুরোনো কোডে শুধু amount > 0 যাচাই হতো।
3. দুটো Edge Function-এর source-এ `telegram_sent: false` ফেরত দেওয়া হয়; এরা নিজেরা Telegram message পাঠায় না। আপনি বলেছেন Telegram notification বর্তমানে কাজ করছে, তাই এই প্যাকেজে Telegram trigger/webhook/bot integration পরিবর্তন করা হয়নি। Notification কোথা থেকে আসে তা শনাক্ত করতে Supabase Database Triggers, Database Webhooks, অথবা অন্য deployed function-এর configuration আলাদাভাবে পরীক্ষা করতে হবে।
4. `quick-action` function আপনার কাছে নেই বলে এখানে বানানো হয়নি।
5. SQL inventory query কেবল তথ্য পড়ে; কোনো schema বা balance পরিবর্তন করে না।
6. Service Role Key, Bot Token বা Chat ID এই ফাইলে নেই। এগুলো কখনো GitHub/frontend-এ রাখবেন না।

## Deploy করার আগে
- ZIP extract করে GitHub/private backup-এ রাখুন।
- Supabase Dashboard > Edge Functions-এ deployed function-এর বর্তমান source-এর সঙ্গে ফাইল মিলিয়ে নিন।
- `submit-withdrawal`-এর minimum `$100` পরিবর্তনটি চাইলে Deploy করুন; না চাইলে আপনার deployed code-এ পুরোনো validation অক্ষত রাখুন।
- Database schema পরিবর্তনের SQL এখানে দেওয়া হয়নি, কারণ পূর্ণ live schema dump যাচাই ছাড়া migration বানানো নিরাপদ নয়।
