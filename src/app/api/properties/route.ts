// Design Ref: §4.1 — GET /api/properties
import { NextRequest, NextResponse } from 'next/server';
import { fetchProperties } from '@/features/properties/queries';
import { parsePropertyFilter } from '@/features/properties/parseFilter';

export async function GET(request: NextRequest) {
  try {
    const filter = parsePropertyFilter(request.nextUrl.searchParams);
    const result = await fetchProperties(filter);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch properties' } },
      { status: 500 },
    );
  }
}
