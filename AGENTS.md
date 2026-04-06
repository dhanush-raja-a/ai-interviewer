# Agent Guidance

## Commands
- `npm run dev` - Start dev server (http://localhost:3000)
- `npm run build` - Production build
- `npm run lint` - ESLint check

## Tech Stack
- Next.js 14 (App Router)
- TypeScript with strict mode
- MySQL (`lib/db.ts`)
- Google Gemini AI (`lib/gemini.ts`)
- File upload with multer (PDF/DOCX parsing)

## Path Alias
`@/*` maps to project root (e.g., `@/lib/db`)

## Server Actions
Configured with 2MB body size limit (`next.config.mjs`)

## Env Variables
- `GEMINI_API_KEY` - Required (currently in `.env` and `.env.local`)