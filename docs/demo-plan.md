# Final Demo Plan

## 1. Project Overview

AI Job Interview Simulator is a web application that helps users practice role-specific job interviews in a realistic, guided environment. A signed-in user types or selects a target role, receives one AI-generated interview question at a time, submits an answer, and gets structured feedback with a score, strengths, improvement areas, follow-up guidance, and a stronger sample answer.

The target users are university students, career changers, early-career professionals, and anyone preparing for entry-level or role-specific interviews. The project solves the problem of interview preparation being hard to practice consistently without another person present. It gives users immediate, role-specific feedback and saves practice sessions so progress can be reviewed later.

## 2. Demo Flow (5-7 Minutes Structured Timeline)

**0:00-0:45 - Introduction**

Introduce the problem: students and job seekers need realistic interview practice and fast feedback. Present the app as a focused interview practice dashboard with AI question generation, feedback, authentication, and saved history.

**0:45-1:30 - Landing Page and Login**

Open the live demo URL, briefly show the landing page value proposition, then log in with a prepared demo account. Mention that Supabase handles authentication and protected dashboard access.

**1:30-2:15 - Start a Role-Specific Interview**

On the dashboard, choose a strong demo role such as "Frontend Engineer", "Nurse", or "Sales Representative". Start the interview and show that the app generates a realistic first question with focus areas.

**2:15-3:45 - Submit an Answer and Receive Feedback**

Paste a prepared answer that is good but not perfect. Submit it, wait for the AI response, and highlight the strongest moment of the demo: the next question appears while the previous answer receives a structured review.

**3:45-4:45 - Explain the Feedback**

Open the feedback panel and briefly point out the score, correctness, clarity, depth, actionable feedback, follow-up, and strong answer example. Emphasize that the feedback is useful for improvement, not just grading.

**4:45-5:45 - Show Persistence and History**

Open Session History and Session Details. Show that sessions and answered turns are saved, including questions, answers, scores, and feedback. Mention that users can resume in-progress practice.

**5:45-6:30 - Technical Wrap-Up**

Summarize the architecture: Next.js frontend and API route, Supabase auth/database, Groq-powered AI interview generation, and client-side state management for the active session.

**6:30-7:00 - Closing**

Close with the user value: the app helps candidates practice consistently, learn from each answer, and track improvement over time. Avoid showing settings or less important secondary pages unless asked.

## 3. Key Technical Points

- **Architecture:** Next.js App Router powers the frontend, protected dashboard pages, and the `/api/interview` route. React components handle the interview UI, modals, loading states, and feedback panels.
- **Authentication:** Supabase Auth manages sign up, login, logout, session persistence, and protected dashboard access.
- **Database persistence:** Supabase stores interview sessions and turns, including target role, current question, progress count, submitted answers, scores, and feedback.
- **AI integration:** The interview API route calls Groq with a strict system prompt and expects structured JSON for the active question, interview metadata, and latest answer review.
- **Validation and reliability:** The backend validates role length, answer length, request history size, AI JSON shape, empty responses, malformed responses, and timeouts.
- **User experience:** The dashboard prevents duplicate submissions, restores in-progress sessions, shows clear empty/error/loading states, and separates the current question from feedback for the previous answer.

## 4. Pre-Demo Checklist

- App runs locally with `npm run dev`.
- Live URL works: `https://ai-interview-seven-gold.vercel.app/`.
- Demo account email and password are prepared and tested.
- Supabase project is reachable and contains the required interview session/turn tables.
- `GROQ_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured.
- Main flow tested: login, start interview, submit answer, view feedback, open history, view session details.
- Browser console checked for unexpected errors during the main demo flow.
- Internet connection checked before presenting.
- Prepared answer text is ready to paste to avoid slow typing.
- Performance is acceptable: page load, auth, AI response, and history restore complete within demo timing.
- Backup screenshots or screen recording are ready.

## 5. Plan B (Fallback Strategy)

- If the live URL fails, run the local version with `npm run dev` and present from `http://localhost:3000`.
- If authentication or Supabase is unavailable, use screenshots or a recorded walkthrough showing login, dashboard, feedback, and saved history.
- If the AI request is slow or unavailable, use pre-filled demo data or a previously saved session in Session History to explain the feedback flow.
- If the internet connection is unstable, switch immediately to the recorded video and narrate the same 5-7 minute flow.
- If only part of the app works, focus the walkthrough on landing page, dashboard structure, saved sessions, and the technical explanation of the API/Supabase/Groq architecture.
