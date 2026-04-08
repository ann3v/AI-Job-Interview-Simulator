https://ai-interview-seven-gold.vercel.app/


🤖 AI Job Interview Simulator

An interactive AI-powered web application that simulates real technical job interviews.
Built to help users practice, improve, and get structured feedback using modern AI models.

🚀 Overview

The AI Job Interview Simulator allows users to:

Select a role (e.g., Frontend Developer, Backend Developer, etc.)
Start a simulated interview session
Answer AI-generated technical questions
Receive structured feedback on their answers
Progress through a dynamic interview flow

The system adapts to the user's skill level and provides realistic interview experiences.

✨ Features
🎯 Core Interview Flow
Role selection (preset + custom input)
AI-generated questions (one at a time)
Answer submission with validation
Loading states & error handling
Progressive interview experience
🧠 AI Evaluation
Structured evaluation of answers:
Correctness
Clarity
Depth
Feedback only after answering (no spoilers)
"What I'm looking for" guidance
Strong answer examples (shown at the right time)
🖥️ UI/UX
Clean, modern interface
Interview-style layout:
Header (role + progress)
Question card
Answer composer
Feedback panel
Progressive disclosure (no clutter before start)
Prevention of duplicate submissions
⚙️ Architecture
Component-based frontend
Custom hook for session state management
Separation of concerns (UI, logic, API)
🏗️ Tech Stack
Frontend
Next.js (App Router)
React
TypeScript
Tailwind CSS
Backend
Next.js API Routes
Groq API (LLM integration)
Auth (Planned / Optional)
Supabase Auth
📂 Project Structure
app/
  api/
    interview/
      route.ts        # AI interview endpoint

  page.tsx            # Main entry page

components/
  interview/
    InterviewSetup.tsx
    RoleSelector.tsx
    CurrentQuestionCard.tsx
    AnswerComposer.tsx
    EvaluationSummary.tsx
    InterviewFeedbackPanel.tsx
    InterviewHeader.tsx

hooks/
  useInterviewSession.ts

lib/
  interview.ts
  interview-client.ts

public/
🔁 How It Works
User selects a role and starts interview
Frontend calls /api/interview
Backend sends request to Groq LLM with system prompt
AI returns structured response:
question
evaluation
feedback
UI updates based on interview state
Process repeats for next questions
🧠 AI Response Structure

Example:

{
  "interview_state": {
    "status": "in_progress",
    "question_number": 1,
    "difficulty": "easy",
    "topic": "React"
  },
  "question": "Explain useEffect in React.",
  "what_im_looking_for": [...],
  "evaluation": {
    "score": 8,
    "correctness": "Good",
    "clarity": "Clear",
    "depth": "Moderate"
  },
  "feedback": "...",
  "ideal_answer": "...",
  "next_action": "next_question"
}
🔐 Environment Variables

Create a .env.local file:

GROQ_API_KEY=your_api_key_here
▶️ Getting Started
1. Install dependencies
npm install
2. Run development server
npm run dev
3. Open app
http://localhost:3000
🧪 Future Improvements
Authentication (Supabase)
Save interview history
Dashboard with past sessions
Difficulty selection
Real-time voice interviews
Code editor for coding questions
Full-screen interview mode + shortcuts
Analytics for performance tracking
🎯 Goal of the Project

This project is designed as a real-world, production-style application that demonstrates:

Full-stack architecture
AI integration in modern apps
Clean UI/UX design principles
Scalable and maintainable code structure
👨‍💻 Author

Built by Ardit as part of a university project.