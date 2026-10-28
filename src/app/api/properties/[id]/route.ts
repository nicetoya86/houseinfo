// Design Ref: §4.1 — GET /api/properties/:id
import { NextResponse } from 'next/server';
import { fetchPropertyById } from '@/features/properties/queries';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const property = await fetchPropertyById(id);
    if (!property) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Property not found' } },
        { status: 404 },
      );
    }
    return NextResponse.json({ data: property });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch property' } },
      { status: 500 },
    );
  }
}
