# AI Mock Interview Platform — Implementation Plan

## Overview

A full-stack, AI-powered mock interview platform built from scratch. Users upload a resume, provide job details, then conduct a live interview with an AI avatar using their webcam + microphone. The AI asks role-specific questions, evaluates spoken answers in real-time, and presents a scored report at the end.

---

## Architecture

```
Next.js 14 (App Router)
├── Frontend (React, Vanilla CSS, Web APIs)
│   ├── Setup Page — resume upload, job description form
│   ├── Permission Page — webcam / mic / screen grant
│   ├── Interview Page — AI avatar, STT, TTS, live Q&A
│   └── Results Page — per-question scores + overall feedback
├── Backend (Next.js API Routes)
│   ├── /api/parse-resume    — extract text from PDF/DOCX
│   ├── /api/generate-questions — Gemini AI question generation
│   ├── /api/evaluate-answer   — Gemini AI answer evaluation
│   └── /api/sessions          — MySQL CRUD for session storage
└── MySQL DB (root/root, no auth)
    ├── sessions table
    ├── questions table
    └── answers table
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Vanilla CSS (dark glassmorphism theme) |
| AI | Google Gemini 1.5 Pro (via `@google/generative-ai`) |
| Resume Parsing | `pdf-parse` + `mammoth` (DOCX) |
| Speech-to-Text | Web Speech API (browser-native) |
| Text-to-Speech | Web Speech API / SpeechSynthesis |
| AI Avatar | CSS animated avatar with lip-sync shimmer |
| Database | MySQL 8 (root/root) via `mysql2` |
| Screen/Video | MediaRecorder API |
| File Upload | Multer (via API route) |

---

## User Flow

```
1. Setup Page
   ├── Upload resume (PDF or DOCX)
   ├── Enter: Job Role, Job Description, Years of Experience
   └── Click "Continue" → Permission Page

2. Permission Page
   ├── Enable Webcam ✓
   ├── Enable Microphone ✓
   ├── Enable Screen Recording (optional) ✓
   └── Click "Start Interview" → Interview Page

3. Interview Page
   ├── AI avatar greets user by name (from resume)
   ├── AI asks question 1 (TTS spoken aloud)
   ├── User answers (STT captures speech → text)
   ├── "Next Question" → AI evaluates answer silently → asks Q2
   ├── Repeat for 5–8 questions
   └── "Finish Interview" → Results Page

4. Results Page
   ├── Overall Score (e.g. 78/100)
   ├── Per-question breakdown:
   │   ├── Question text
   │   ├── User's transcribed answer
   │   ├── AI score (0–10) + feedback
   │   └── Ideal answer hint
   └── Download PDF Report button
```

---

## Proposed File Structure

```
/
├── app/
│   ├── layout.tsx              — Root layout, fonts
│   ├── page.tsx                — Setup page (resume + job form)
│   ├── permissions/page.tsx    — Camera/mic/screen grant
│   ├── interview/page.tsx      — Live AI interview
│   └── results/page.tsx        — Scores & feedback
├── app/api/
│   ├── parse-resume/route.ts   — PDF/DOCX text extraction
│   ├── generate-questions/route.ts — Gemini question generation
│   ├── evaluate-answer/route.ts    — Gemini answer scoring
│   └── sessions/route.ts           — MySQL session management
├── components/
│   ├── AIAvatar.tsx            — Animated AI interviewer avatar
│   ├── SpeechRecorder.tsx      — Mic recording + STT
│   ├── QuestionCard.tsx        — Current question display
│   ├── ProgressBar.tsx         — Interview progress indicator
│   └── ResultCard.tsx          — Per-answer score card
├── lib/
│   ├── gemini.ts               — Gemini AI client
│   ├── db.ts                   — MySQL connection pool
│   └── resumeParser.ts         — Resume text extraction logic
├── styles/
│   └── globals.css             — Dark glassmorphism design system
└── package.json
```

---

## Database Schema

```sql
CREATE DATABASE interview_platform;

CREATE TABLE sessions (
  id VARCHAR(36) PRIMARY KEY,
  candidate_name VARCHAR(255),
  job_role VARCHAR(255),
  job_description TEXT,
  years_experience INT,
  resume_text TEXT,
  overall_score DECIMAL(5,2),
  status ENUM('pending','in_progress','completed'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(36),
  question_number INT,
  question_text TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

CREATE TABLE answers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT,
  session_id VARCHAR(36),
  answer_text TEXT,
  score DECIMAL(4,1),
  feedback TEXT,
  ideal_answer TEXT,
  FOREIGN KEY (question_id) REFERENCES questions(id)
);
```

---

## AI Integration Design

### Question Generation (Gemini)
Prompt: feeds resume text + job role + years of experience → returns 7 interview questions tailored to the candidate's background.

### Answer Evaluation (Gemini)
Prompt: receives question + candidate's transcribed answer → returns:
- `score` (0–10)
- `feedback` (2–3 sentence assessment)
- `ideal_answer` (what a great answer would include)

---

## UI Design Theme

- **Dark glassmorphism**: `backdrop-filter: blur`, semi-transparent panels
- **Color palette**: Deep navy (`#0a0e1a`) + electric indigo (`#6366f1`) + cyan accents (`#22d3ee`)
- **Typography**: Inter (Google Fonts)
- **AI Avatar**: CSS animated pulsing orb with waveform ring during speech
- **Microphone recording**: Animated pulse ring when active
- **Smooth transitions**: Page transitions + fade-ins

---

## Open Questions

> [!IMPORTANT]
> **Gemini API Key**: The AI question generation and evaluation requires a Google Gemini API key. Do you have one? If not, I can use a placeholder for now and it can be added later via an `.env.local` file.

> [!IMPORTANT]
> **Number of Questions**: How many interview questions should the AI ask per session? (Recommended: 5–7)

> [!NOTE]
> **Screen Recording**: Screen recording via `getDisplayMedia` requires user tab focus and a browser permission prompt — it's fully supported but the user will see a browser permission dialog. Should this be mandatory or truly optional (skip button)?

> [!NOTE]
> **Resume Parsing**: I'll support PDF and DOCX. Should other formats (plain text, .txt) be supported too?

---

## Verification Plan

### Automated
- `npm run build` — verify no TypeScript/build errors
- MySQL connection test on API startup

### Manual
- Walk through full flow: upload PDF resume → grant permissions → complete 3-question interview → view results
- Verify STT captures spoken text correctly
- Verify TTS reads questions aloud
- Verify MySQL rows are created for session/questions/answers
