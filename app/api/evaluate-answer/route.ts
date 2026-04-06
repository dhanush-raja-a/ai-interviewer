import { NextRequest, NextResponse } from 'next/server';
import { evaluateAnswer } from '@/lib/gemini';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, questionId, questionText, answerText } = await req.json();

    if (!sessionId || !questionId || !questionText || !answerText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const evaluation = await evaluateAnswer(questionText, answerText);

    await pool.execute(
      `INSERT INTO answers (question_id, session_id, answer_text, score, feedback, ideal_answer) VALUES (?, ?, ?, ?, ?, ?)`,
      [questionId, sessionId, answerText, evaluation.score, evaluation.feedback, evaluation.idealAnswer]
    );

    return NextResponse.json({ 
      questionId,
      score: evaluation.score,
      feedback: evaluation.feedback,
      idealAnswer: evaluation.idealAnswer
    });
  } catch (error: any) {
    console.error('Evaluate answer error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}