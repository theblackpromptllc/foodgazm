# FOODGAZM

Order-collection web app for the FOODGAZM weekend plate-sale business. Customers place orders on their phones at `/`, and the owner watches live orders come in on the private `/admin` page.

## Stack

React, Vite, Supabase, Vercel.

## Local setup

```bash
npm install
cp .env.example .env
```

Fill in `.env` with your Supabase project URL and anon key, then run:

```bash
npm run dev
```

## Supabase setup

1. Create a Supabase project.
2. Open the SQL editor in the Supabase dashboard.
3. Paste and run the contents of [`supabase.sql`](./supabase.sql). This creates the `orders` table, enables row level security, and turns on realtime.
4. Go to Project Settings, API, and copy the Project URL and anon public key into your `.env` and into Vercel's environment variables.

## Admin passcode

The admin passcode is hardcoded in [`src/pages/Admin.jsx`](./src/pages/Admin.jsx) as `ADMIN_PASSCODE`. Change it there before sharing the admin link.

## Deployment

Deployed on Vercel. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables in the Vercel project settings, then deploy.

- `/` is the public customer order link.
- `/admin` is the private admin dashboard, behind the passcode gate.
