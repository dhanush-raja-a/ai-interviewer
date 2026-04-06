# AI Mock Interview Platform

An AI-powered mock interview platform built with Next.js, integrating Google Gemini API for intelligent question generation and answer evaluation. The application allows users to upload their resumes to be asked tailored questions and have their spoken answers evaluated in real-time.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** MySQL
- **AI Model:** Google Gemini AI
- **File Parsing:** Multer, pdf-parse, mammoth

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MySQL Server

### Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env` or `.env.local` file in the project root and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(Ensure any required MySQL credentials are also properly set up in the `.env` or matching the configuration in `lib/db.ts`)*

3. **Set up the Database:**
   Ensure your MySQL service is running locally, and execute any required table schemas (e.g., sessions, questions, answers).

### Running the Project

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Deploying to GitHub

This repository is ready to be published. Follow these steps to push it to a new GitHub repository:

1. Create a new repository on [GitHub](https://github.com/new).
2. Run the following commands in your terminal to link and push your code:

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```
