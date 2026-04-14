import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

export async function GET() {
  try {
    await initDatabase();
    return NextResponse.json({ message: "SUCCESS! All Database Tables were created correctly on TiDB!" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to build tables", details: error.message }, { status: 500 });
  }
}
