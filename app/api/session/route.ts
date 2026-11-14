import { NextRequest, NextResponse } from 'next/server';
import { sessionExpiry, setSession, unauthorized } from '../_lib';
export async function GET(req: NextRequest) {
  const expiresAt = sessionExpiry(req);
  return expiresAt ? NextResponse.json({ok:true,expiresAt}) : NextResponse.json({ok:false},{status:401});
}
export async function POST(req: NextRequest) {
  if (!sessionExpiry(req)) return unauthorized();
  const body = await req.json().catch(() => ({}));
  const durationSeconds = body?.assessmentActive === true ? 24 * 60 * 60 : 5 * 60;
  const res = NextResponse.json({ ok: true, expiresAt: Date.now() + durationSeconds * 1000 });
  setSession(res, durationSeconds);
  return res;
}
