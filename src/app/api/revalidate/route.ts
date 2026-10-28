// Design Ref: §4.1/§4.2 — n8n → ISR revalidate webhook (secret 헤더 인증)
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');
  if (!secret || secret !== process.env.ISR_REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Invalid revalidate secret' } },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const propertyId = body?.propertyId as string | undefined;
  if (!propertyId) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'propertyId is required' } },
      { status: 400 },
    );
  }

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath('/properties');

  return NextResponse.json({ revalidated: true, propertyId });
}
