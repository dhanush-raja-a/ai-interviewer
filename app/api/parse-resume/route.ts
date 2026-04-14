import { NextRequest, NextResponse } from 'next/server';
import { parseResume, extractNameFromResume } from '@/lib/resumeParser';
import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';
import fs from 'fs';

import { getServerSession } from "next-auth/next";
import { NEXT_AUTH_OPTIONS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const sessionAuth = await getServerSession(NEXT_AUTH_OPTIONS);
    const userId = sessionAuth?.user ? (sessionAuth.user as any).id : null;

    const formData = await req.formData();
    const file = formData.get('resume') as File;
    const jobRole = formData.get('jobRole') as string;
    const jobDescription = formData.get('jobDescription') as string;
    const yearsExperience = parseInt(formData.get('yearsExperience') as string) || 0;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempPath = `/tmp/${uuidv4()}-${file.name}`;
    
    fs.writeFileSync(tempPath, buffer);

    const resumeText = await parseResume(tempPath);
    const candidateName = extractNameFromResume(resumeText);

    const sessionId = uuidv4();
    
    await pool.execute(
      `INSERT INTO sessions (id, user_id, candidate_name, job_role, job_description, years_experience, resume_text, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [sessionId, userId, candidateName, jobRole, jobDescription, yearsExperience, resumeText]
    );

    fs.unlinkSync(tempPath);


    return NextResponse.json({ 
      sessionId, 
      candidateName, 
      resumeText: resumeText.substring(0, 200) + '...' 
    });
  } catch (error: any) {
    console.error('Parse error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}