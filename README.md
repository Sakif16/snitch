# snitch.

## Intro
A hobby-project, a platform where verified university students share honest experiences about working with groupmates, so a person can choose his/her teammates wisely.

---

## Description
snitch is a full-stack web application for university students who want more transparency before starting a group project. Students sign up with their official university email, find a classmate by name or student ID, and read or post experiences about teamwork, communication, reliability and behaviour.

Every account is tied to one university through its email domain, and email verification is required before anyone can sign in or post. Reviews carry the author's name, so the platform is built around accountability rather than anonymity.

---

## Website
Live at: https://snitch-qbku.onrender.com

---

### What you can do:
- Sign up with your official university email (the university is detected automatically from the email domain)
- Verify your email through a link sent to your inbox before signing in
- Accept the Terms and Conditions during signup
- Browse by university and search for students by name or student ID
- Post a new snitch for a student at your own university
- Rate a groupmate from 1 to 5 on teamwork, communication, reliability and behaviour, with a written description
- Add your own experience to an existing snitch (one review per user per snitch, same university only)
- Edit your review once, with a confirmation step before saving
- See averaged ratings for each student across all reviews
- Reveal a reviewer's email on demand with "show email" (logged-in, verified users only)
- Contact support through a form that emails the team directly
- Switch between light and dark mode, with no flash on page load

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

## Tech Stack
- **TanStack Start** (React 19, TanStack Router with file-based routing, server functions)
- **TypeScript**
- **Tailwind CSS v4** and **shadcn/ui** (Radix UI, Lucide icons)
- **Better Auth** (email and password authentication, email verification, sessions)
- **PostgreSQL** on **Neon** (serverless database)
- **Drizzle ORM** and **drizzle-kit** (schema and migrations)
- **Mailjet** (transactional email over its HTTP API: verification emails and support messages)
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
| `BETTER_AUTH_URL` | Yes | The app's URL, for example `http://localhost:3000`. In production, set it to your deployed URL or verification links will point to localhost |
| `MAILJET_API_KEY` | Yes, for email | Mailjet API key |
| `MAILJET_SECRET_KEY` | Yes, for email | Mailjet secret key |
| `MAIL_FROM` | Yes, for email | Sender address. Must be verified as a sender in Mailjet |
| `SUPPORT_EMAIL` | Optional | Inbox that receives support form messages. Defaults to `snitch.business1@gmail.com` |

Without the Mailjet variables the app still runs, but verification emails and support messages will fail (the error is printed in the server log) and new users will not be able to verify their accounts.

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

### Useful scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview the production build |
| `pnpm test` | Run tests with Vitest |
| `pnpm check` | Lint and format check with Biome |
| `pnpm db:generate` | Generate a migration after changing `src/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Open Drizzle Studio to browse the database |

---

## Deployment
1. Build the app with `pnpm build`.
2. Start it with `node .output/server/index.mjs`.
3. Set every variable from the table above in your host's environment settings, including `BETTER_AUTH_URL` set to your public URL.
4. Run `pnpm db:migrate` against your production database.

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
- Verification emails can land in the spam folder, because the sender address has no custom domain authentication
- Without a verified email domain, deliverability depends on the provider's sender verification
- On free hosting tiers, the first request after a period of inactivity can be slow
- There is no "forgot password" or "resend verification email" flow yet
- Student ID matching is exact, so IDs that differ only in letter case count as different students
- Creating a snitch and its first review are two separate database inserts, because the Neon HTTP driver does not support multi-statement transactions. In the rare case the second insert fails, a snitch can exist with zero reviews
- Search runs on every keystroke without a debounce and returns at most 10 results
- All posts are unverified personal opinions. The platform does not check the accuracy of anything users write

---

## Disclaimer
snitch. is an independent project and is not affiliated with any university. All reviews are the personal opinions of the users who post them. The operator does not verify content and is not responsible for disputes, false information or any resulting harm. Users must accept the Terms and Conditions at signup.

---

## Future Development
- Forgot password and resend verification email
- Report button on reviews, plus moderation tools
- Debounced search, pagination and sorting or filtering of results
- Storing which version of the Terms each user accepted, and a standalone Terms page
- Case-insensitive student ID matching
- Account deletion and data export
- Support for more universities
- Better loading, empty and error states across the app

---

### Fun fact?
The worse the experience, the better the app..?
