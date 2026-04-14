import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { NEXT_AUTH_OPTIONS } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(NEXT_AUTH_OPTIONS);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    const [sessions] = await pool.execute<RowDataPacket[]>(
      "SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("List sessions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
