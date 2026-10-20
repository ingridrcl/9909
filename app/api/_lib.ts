import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

const cookieName = 'nine_session';
function secret() { return process.env.SESSION_SECRET || process.env.APP_PASSCODE || '9909-local-session-secret-change-before-deploy'; }
function signature(payload: string) { return createHmac('sha256', secret()).update(payload).digest('base64url'); }
export function sessionExpiry(req: NextRequest): number | null {
  const token = req.cookies.get(cookieName)?.value || '';
  const [payload, sig] = token.split('.'); if (!payload || !sig) return null;
  const expected = signature(payload);
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a,b)) return null;
  try {
    const exp = JSON.parse(Buffer.from(payload,'base64url').toString()).exp;
    return typeof exp === 'number' && exp > Date.now() ? exp : null;
  } catch { return null; }
}
export function hasSession(req: NextRequest) { return sessionExpiry(req) !== null; }
export function setSession(res: NextResponse) {
  const expiresAt = Date.now() + 5*60*1000;
  const payload = Buffer.from(JSON.stringify({ exp: expiresAt })).toString('base64url');
  res.cookies.set(cookieName, `${payload}.${signature(payload)}`, { httpOnly:true, secure:process.env.NODE_ENV==='production', sameSite:'strict', path:'/', maxAge:5*60 });
  return expiresAt;
}
export function clearSession(res: NextResponse) { res.cookies.set(cookieName,'',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:0}); }
export function unauthorized() { return NextResponse.json({error:'Sesi berakhir. Masukkan passcode kembali.'},{status:401}); }
export async function openAI(system: string, user: string, json = false) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY belum diatur. Tambahkan API key di Environment Variables Vercel.');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method:'POST', headers:{'Authorization':`Bearer ${key}`,'Content-Type':'application/json'},
    body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4o-mini',messages:[{role:'system',content:system},{role:'user',content:user}],temperature:0.2,...(json?{response_format:{type:'json_object'}}:{})}),
  });
  const data = await response.json();
  if (!response.ok) { const detail=data?.error?.message; throw new Error(detail ? `OpenAI: ${detail}` : 'Permintaan ke OpenAI gagal. Periksa API key dan saldo akun API.'); }
  return data.choices?.[0]?.message?.content || '';
}
