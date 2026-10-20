import { NextRequest, NextResponse } from 'next/server';
import { hasSession } from '../_lib';
export async function GET(req: NextRequest) { return hasSession(req)?NextResponse.json({ok:true}):NextResponse.json({ok:false},{status:401}); }
