# My Path — Personal Growth Journal

A private web app for reflecting on personal mistakes, identifying triggers, tracking recurring patterns, and turning each experience into a small practical commitment.

## Features

- Personal “My Today” dashboard
- Built-in and custom behavior patterns
- Reflection entries with feelings, triggers, notes, and lessons
- Automatic restorative commitments
- Growth journal and small wins
- Weekly trends and personal insights
- Searchable history, daily reminder settings, dark mode, and responsive UI
- Refresh-safe demo storage and a production-ready PostgreSQL/Prisma model

## Demo account

- Email: `me@example.com`
- Password: `MyJourney123!`

## Run locally

```bash
npm install
copy .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Configure PostgreSQL through `DATABASE_URL` before running migrations.

## Quality checks

```bash
npm test
npm run lint
npm run build
```
