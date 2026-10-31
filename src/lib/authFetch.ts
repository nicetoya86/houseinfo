'use client';
// SEC-1: 세션이 없으면 Supabase 익명 로그인 후 Bearer 토큰을 붙여 fetch.
import { supabase } from '@/lib/supabase';

export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  let { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    session = data.session;
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session?.access_token}`);
  return fetch(input, { ...init, headers });
}
