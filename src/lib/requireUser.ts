// SEC-1: Bearer JWT(Supabase 익명/일반 세션)를 검증한다. 실패 시 401 Response 반환.
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function requireUser(request: Request): Promise<NextResponse | null> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (token) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user) return null;
  }
  return NextResponse.json(
    { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다' } },
    { status: 401 },
  );
}
