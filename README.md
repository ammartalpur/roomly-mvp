## Roomly

Foundation for a multi-tenant coworking management SaaS.

### Included

- Local email/password authentication with signed, HTTP-only sessions
- Organization onboarding and business profile management
- Owner, admin, and staff memberships with pending invitations
- Locations, optional floors/zones, and active status controls
- Workspace categories, resources, amenities, pricing, photos, and visibility controls
- Organization-scoped reads and writes
- Per-workspace weekly hours, date overrides, notice windows, duration limits, increments, and buffers
- Manual and maintenance blocks
- Centralized available-slot calculation and booking validation
- Staff booking creation, rescheduling, cancellation, confirmation, check-in, completion, and no-show handling
- Customer records, confirmation numbers, internal notes, and booking activity history
- PostgreSQL exclusion constraint preventing concurrent overlapping active bookings
- Live operations overview with today, occupancy, availability, upcoming bookings, and exceptions
- Day, week, and month operations calendar with workspace, location, and status filters
- Resource timeline, manual blocks, searchable booking management, and customer histories
- Operational utilization reports for 7, 30, and 90-day periods

### Local setup

1. Copy `.env.example` to `.env` and set a PostgreSQL connection string and strong session secret.
2. Run `npx prisma migrate dev --name foundation`.
3. Run `npm run dev` and open `http://localhost:3000`.

Run `npm run verify:phase2` to verify database-level overlap protection without leaving test data behind.

This implementation currently includes Foundation, the Core Engine, and Phase 3 Operations.

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
