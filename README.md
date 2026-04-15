# AI Job Interview Simulator

Live demo: https://ai-interview-seven-gold.vercel.app/

AI Job Interview Simulator is a university project that helps users practice technical job interviews. A signed-in user chooses a target role, answers one AI-generated question at a time, receives structured feedback, and can review saved sessions later.

## Demo-Ready Summary

In about 20 seconds: this app is a Next.js interview practice dashboard. Supabase handles authentication and stores interview sessions. Groq generates the next interview question and evaluates the latest answer. The UI is built to fail gracefully with clear loading, empty, and error states.

## Key Features

- Supabase sign up, login, protected dashboard, and session restore.
- Role selection with preset roles and a custom role input.
- AI-generated interview questions for software engineering roles.
- One-answer-at-a-time submission with duplicate-submit protection.
- Structured review after each answer: score, correctness, clarity, depth, feedback, follow-up, and strong answer example.
- Saved interview history with session details and recorded turns.
- Helpful empty states for no active interview, no history, and no recorded turns.
- Graceful error handling for invalid input, missing services, network failures, slow requests, and malformed AI responses.

## Tech Stack

- Next.js 16.2.1 with the App Router
- React 19
- TypeScript
- Tailwind CSS
- Supabase Auth and Supabase database tables
- Groq API for interview generation and evaluation

## Project Structure

```text
app/
  api/interview/route.ts        Groq-backed interview route handler
  dashboard/page.tsx            Protected interview dashboard
components/interview/           Interview UI components
context/AuthContext.tsx         Supabase auth/session state
hooks/useInterviewSession.ts    Interview state, restore, submit, persistence
lib/interview.ts                Shared parsing and display helpers
lib/interview-client.ts         Client request wrapper for /api/interview
lib/interview-store.ts          Supabase persistence helpers
lib/supabase.ts                 Supabase browser client
```

## Environment Variables

Create a `.env.local` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Notes:

- `GROQ_API_KEY` is used only by the server route at `app/api/interview/route.ts`.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used by the browser Supabase client for auth and persistence.
- Supabase persistence expects interview session and turn tables that match the fields used in `lib/interview-store.ts`.

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Add the environment variables listed above to `.env.local`.

3. Start the development server:

```bash
npm run dev
```

4. Open the app:

```text
http://localhost:3000
```

Useful checks:

```bash
npm run lint
npx tsc --noEmit
```

## How The Interview Flow Works

1. The user signs in with Supabase and opens the protected dashboard.
2. The app checks Supabase for the latest in-progress interview session.
3. The user selects or types a target role and starts the interview.
4. The frontend calls `POST /api/interview`.
5. The route handler sends the role, latest answer, and compact conversation history to Groq.
6. Groq returns JSON with the next question and, after an answer, a review of the previous answer.
7. The UI renders the active question and opens feedback when a new review arrives.
8. Supabase stores the session summary in `interview_sessions` and answered turns in `interview_turns`.

## Where Data Is Stored

- Supabase Auth stores user accounts and sessions.
- `interview_sessions` stores each saved interview session, current question, status, role, progress count, and compact conversation history.
- `interview_turns` stores submitted answers and per-question feedback.
- The profile avatar preview is stored in browser local storage for the signed-in user.

## Graceful Error Handling

- Buttons are disabled while interview requests are in flight to avoid duplicate submissions and stale reset behavior.
- Empty answers, long roles, long answers, and oversized history are rejected with readable messages.
- The client has offline, timeout, and network-failure messages for interview requests.
- The API returns friendly JSON errors for missing Groq configuration, invalid payloads, empty AI responses, invalid AI JSON, and incomplete AI output.
- Supabase restore/history failures show retryable messages instead of crashing the dashboard.
- Empty states explain when there is no active interview, no saved sessions, or no saved turns yet.

## Known Constraints And Notes

- The app depends on valid Groq and Supabase credentials.
- AI feedback quality depends on the model response returned by Groq.
- The current project focuses on text-based interviews, not voice interviews or live coding.
- Persistence requires the Supabase tables expected by `lib/interview-store.ts`.
- If Groq or Supabase is slow or unavailable, the UI keeps the user in the current safe state and shows a retry-oriented error.

## Author

Built by Ardit Avdiu as part of a university project.
