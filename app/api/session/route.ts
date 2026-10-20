import { NextRequest, NextResponse } from 'next/server';
import { sessionExpiry } from '../_lib';
export async function GET(req: NextRequest) {
  const expiresAt = sessionExpiry(req);
  return expiresAt ? NextResponse.json({ok:true,expiresAt}) : NextResponse.json({ok:false},{status:401});
}
