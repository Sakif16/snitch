# snitch.

## Intro
A hobby-project, a platform where verified university students share honest experiences about working with groupmates, so a person can choose his/her teammates wisely.

---

## Description
snitch is a full-stack web application for university students who want more transparency before starting a group project. Students sign up with their official university email, find a classmate by name or student ID, and read or post experiences about teamwork, communication, reliability and behaviour.

Every account is tied to one university through its email domain, and email verification is required before anyone can sign in or post. Reviews carry the author's name, so the platform is built around accountability. Each user also gets a single, one-time anonymous post for life.

---

## Website
Live at: https://snitch-w8az.onrender.com

---

### What you can do:
- Sign up with your official university email (the university is detected automatically from the email domain)
- Verify your email through a link sent to your inbox before signing in
- Accept the Terms and Conditions during signup
- Show or hide your password while typing it
- Reset a forgotten password through an emailed, single-use link
- Browse by university and search for students by name or student ID
- Post a new snitch for a student at your own university
- Rate a groupmate from 1 to 5 on teamwork, communication, reliability and behaviour, with a written description
- Post one snitch anonymously, once, ever (toggle in the post modal)
- Add your own experience to an existing snitch (one review per user per snitch, same university only)
- Edit your review once, with a confirmation step before saving
- See averaged ratings for each student across all reviews
- Reveal a reviewer's email on demand with "show email" (logged-in, verified users only, never for anonymous reviews)
- Contact support through a form that emails the team directly
- Switch between light and dark mode, with no flash on page load
- Enjoy subtle animations: cards rise into view and lift on hover, and buttons lift on hover (all disabled for visitors who prefer reduced motion)

### Supported universities

| Tag | University | Accepted email domains |
|---|---|---|
| BRACU | BRAC University | `g.bracu.ac.bd`|
| NSU | North South University | `northsouth.edu` |
| UIU | United International University | `uiu.ac.bd` |
| AUST | Ahsanullah University of Science & Technology | `aust.edu` |
| EWU | East West University | `ewubd.edu` |
| DIU | Daffodil International University | `diu.edu.bd` |

To add another university, update the `university` enum in `src/db/schema.ts`, generate a migration, and add its domain to `src/lib/universities.ts`.

---

## Anonymous posts and privacy
- **One per user, for life.** Anonymous posting is enforced by the database: an `anonymous_post` table has the user id as its primary key, so a second anonymous post is impossible, even with simultaneous requests. The snitch, the claim and the first review are written in one atomic transaction, so a failed post never uses up the slot.
- **The toggle fails with an error** if the slot has already been used, and the server re-checks on submit, so a tampered request is rejected too.
- **Authors are never exposed.** For anonymous reviews the public page data contains no author name, no author id and no creator id, and "show email" is refused. Only a server-computed `isMine` flag tells the author which review is theirs.
- **Anonymity applies to other users only.** The operator can link an anonymous post to its account and may disclose that where required by law or to investigate misuse.
- **Plus-addressed emails** (`name+tag@domain`) are rejected at signup, so one mailbox can't be turned into many accounts.
- **Password resets are locked down.** The reset page is unreachable without a valid token (checked on the server before anything renders), tokens are single-use and expire after 1 hour, all sessions are signed out after a reset, and the "forgot password" screen answers identically whether or not an account exists.
- **Analytics** sends only page paths, never query strings, so reset tokens are never reported.

---

## Tech Stack
- **TanStack Start** (React 19, TanStack Router with file-based routing, server functions)
- **TypeScript**
- **Tailwind CSS v4** and **shadcn/ui** (Radix UI, Lucide icons)
- **Better Auth** (email and password authentication, email verification, password reset, sessions)
- **PostgreSQL** on **Neon** (serverless database)
- **Drizzle ORM** and **drizzle-kit** (schema and migrations)
- **Mailjet** (transactional email over its HTTP API: verification, password reset and support messages)
- **Google Analytics 4** (page view tracking)
- **Vite**, **Nitro** (production server build)
- **Biome** (linting and formatting)
- **Vitest** (testing)

---

## Local Setup

### Requirements
- Node.js 22 or later
- pnpm
- A PostgreSQL database (for example, a free Neon project)
- A Mailjet account with a verified sender address (only needed to send real emails)

### 1) Install dependencies
```bash
pnpm install
```

### 2) Create your `.env.local`
Create a file named `.env.local` in the project root and fill in the values below. Never commit this file.

| Variable | Required | What it's for |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon) |
| `BETTER_AUTH_SECRET` | Yes | Random string used to sign sessions (for example `openssl rand -base64 32`) |
| `BETTER_AUTH_URL` | Yes | The app's public URL, for example `http://localhost:3000`. In production, set it to your deployed URL or verification and password reset links will point to the wrong address |
| `MAILJET_API_KEY` | Yes, for email | Mailjet API key |
| `MAILJET_SECRET_KEY` | Yes, for email | Mailjet secret key |
| `MAIL_FROM` | Yes, for email | Sender address. Must be verified as a sender in Mailjet |
| `SUPPORT_EMAIL` | Optional | Inbox that receives support form messages. Defaults to `snitch.business1@gmail.com` |
| `VITE_GA_ID` | Optional | Google Analytics 4 Measurement ID (`G-XXXXXXXXXX`). Read at **build time**, so set it before building. Analytics is off if unset |

Without the Mailjet variables the app still runs, but verification emails, password reset emails and support messages will fail (the error is printed in the server log) and new users will not be able to verify their accounts.

### 3) Set up the database
Apply the schema to your database:

```bash
pnpm db:migrate
```

(For quick experiments you can use `pnpm db:push` instead, which syncs the schema without migration files.)

### 4) Start the app
```bash
pnpm dev
```
Then open http://localhost:3000.

The route tree (`src/routeTree.gen.ts`) regenerates automatically when the dev server starts. If you add a route and TypeScript doesn't recognise it, restart `pnpm dev` (or run `pnpm generate-routes`) and restart the TS server in your editor.

### Useful scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview the production build |
| `pnpm test` | Run tests with Vitest |
| `pnpm check` | Lint and format check with Biome |
| `pnpm generate-routes` | Regenerate the TanStack route tree |
| `pnpm db:generate` | Generate a migration after changing `src/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Open Drizzle Studio to browse the database |

---

## Deployment
1. Set every variable from the table above in your host's environment settings, including `BETTER_AUTH_URL` set to your public URL and `VITE_GA_ID` (it must exist before the build step).
2. Build the app with `pnpm build`.
3. Start it with `node .output/server/index.mjs`.
4. Run `pnpm db:migrate` against your production database.

If you change `VITE_GA_ID` later, trigger a fresh build (on Render, "Clear build cache & deploy"), since a plain restart won't pick it up.

Many free hosts block outbound SMTP ports. That is why email goes through Mailjet's HTTP API, which works over port 443 on any host.

---

## Contributions
Contributions are welcome!

### You can contribute by:
- Reporting bugs or issues
- Suggesting new features or improvements
- Refactoring code for better performance or readability
- Improving the UI or making it more responsive
- Enhancing documentation and onboarding

### How to contribute:

### 1) Fork the repository

### 2) Clone your fork
```bash
git clone https://github.com/YOUR_USERNAME/snitch.git
```

### 3) Create a new branch
```bash
git checkout -b feature-name
```

### 4) Make your changes and commit
```bash
git commit -m "Add: your feature description"
```

### 5) Push to your fork
```bash
git push origin feature-name
```

### 6) Open a Pull Request on GitHub

---

## ⚠️ Known Issues
- Verification and password reset emails can land in the spam folder, because the sender address has no custom domain authentication
- On free hosting tiers, the first request after a period of inactivity can be slow
- There is no "resend verification email" option yet
- Student ID matching is exact, so IDs that differ only in letter case count as different students
- Someone with two genuine university mailboxes can still create two accounts, and so claim two anonymous posts. The app can't tell they are the same person
- Search runs on every keystroke without a debounce and returns at most 10 results
- Analytics ad blockers hide some visitors from the numbers
- All posts are unverified personal opinions. The platform does not check the accuracy of anything users write

---

## Disclaimer
snitch. is an independent project and is not affiliated with any university. All reviews are the personal opinions of the users who post them. The operator does not verify content and is not responsible for disputes, false information or any resulting harm. Users must accept the Terms and Conditions at signup.

---

## Future Development
- Resend verification email
- Report button on reviews, plus moderation tools
- Debounced search, pagination and sorting or filtering of results
- Storing which version of the Terms each user accepted, and a standalone Terms page
- Privacy policy and cookie notice for analytics
- Case-insensitive student ID matching
- Account deletion and data export
- A custom domain with authenticated email sending
- Support for more universities
- Better loading, empty and error states across the app

---

### Fun fact?
The worse the experience, the better the app..?
