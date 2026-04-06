import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const [sessions] = await pool.execute(
      'SELECT * FROM sessions WHERE id = ?',
      [sessionId]
    );

    const [questions] = await pool.execute(
      'SELECT * FROM questions WHERE session_id = ? ORDER BY question_number',
      [sessionId]
    );

    const [answers] = await pool.execute(
      'SELECT * FROM answers WHERE session_id = ?',
      [sessionId]
    );

    return NextResponse.json({ 
      session: (sessions as any[])[0],
      questions: questions as any[],
      answers: answers as any[]
    });
  } catch (error: any) {
    console.error('Get session error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { sessionId, overallScore } = await req.json();

    await pool.execute(
      'UPDATE sessions SET overall_score = ?, status = ? WHERE id = ?',
      [overallScore, 'completed', sessionId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update session error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}