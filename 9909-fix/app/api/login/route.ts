import { NextRequest, NextResponse } from 'next/server';
import { setSession } from '../_lib';
export async function POST(req: NextRequest) {
  const { passcode } = await req.json().catch(()=>({}));
  const expected = process.env.APP_PASSCODE;
  if (!expected) return NextResponse.json({error:'APP_PASSCODE belum diatur di environment.'},{status:500});
  if (typeof passcode !== 'string' || passcode !== expected) return NextResponse.json({error:'Passcode tidak cocok. Coba lagi.'},{status:401});
  const res=NextResponse.json({ok:true}); setSession(res); return res;
}
