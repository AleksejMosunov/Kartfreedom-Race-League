This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin Auth & Roles

Authentication is stored in MongoDB (`admin_users` collection).

Required variable in `.env.local`:

```bash
ADMIN_SESSION_SECRET=your_strong_random_secret
```

Optional bootstrap organizer credentials (used only to create the first organizer user automatically on first login):

```bash
ADMIN_USERNAME=organizer_login
ADMIN_PASSWORD=organizer_password
```

Available roles:

- `organizer` — full access
- `marshal` — stage results only
- `editor` — reserved (no permissions yet)

## Telegram Notifications (Admin)

You can send league news to Telegram directly from the admin panel.

Add these variables to `.env.local`:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
NEXT_PUBLIC_SPONSOR_CONTACT_URL=https://t.me/your_username_or_channel
```

Available admin actions:

- Send start-of-championship news
- Send "new stage added" news
- Send stage results with winner and podium congratulation
- Send championship finish news with final podium

## Health Check & Uptime Monitor

Public health endpoint:

- `GET /api/health`

Example local check:

```bash
curl -s http://localhost:3000/api/health
```

For basic uptime monitoring, configure UptimeRobot with:

- URL: `https://your-domain.com/api/health`
- Method: `GET`
- Interval: 5 minutes
- Expected status: `200`

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Local commands

- Start development server: `npm run dev`
- Run production build: `npm run build`
- Lint: `npm run lint`

## Calendar component notes

- The calendar countdown now targets the season start at 05.04.2026 10:00 (local time).
- Countdown UI uses fixed-width digits and vertically aligned separators to avoid jitter on updates.
- Image export was temporarily disabled in the UI. To re-enable the "Download calendar" button and export functionality:
  1.  Re-enable the button in `app/components/championship/Calendar.tsx` header.
  2.  Install `html-to-image` (`npm i html-to-image`) and restore the `downloadCalendar` implementation.
  3.  The export should wait for fonts to be ready and use a `pixelRatio` (2–4) for higher-quality PNGs.

If you want, I can re-enable and improve the export flow (wait-for-fonts, cacheBust, DPR handling).
