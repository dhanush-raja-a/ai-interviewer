import { NextRequest, NextResponse } from 'next/server';
import { generateQuestions } from '@/lib/gemini';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, resumeText, jobRole, yearsExperience } = await req.json();

    if (!sessionId || !resumeText || !jobRole) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const questions = await generateQuestions(resumeText, jobRole, yearsExperience || 0);

    const questionObjects = [];
    for (let i = 0; i < questions.length; i++) {
      const [result] = await pool.execute(
        `INSERT INTO questions (session_id, question_number, question_text) VALUES (?, ?, ?)`,
        [sessionId, i + 1, questions[i]]
      );
      questionObjects.push({
        id: (result as any).insertId,
        question_number: i + 1,
        question_text: questions[i]
      });
    }

    await pool.execute(
      `UPDATE sessions SET status = 'in_progress' WHERE id = ?`,
      [sessionId]
    );

    return NextResponse.json({ sessionId, questions: questionObjects });
  } catch (error: any) {
    console.error('Generate questions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}