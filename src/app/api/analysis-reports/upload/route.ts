// Design Ref: §4.2, §6, §7 — POST /api/analysis-reports/upload (등기부등본 업로드 + OCR + 캐싱)
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { requireUser } from '@/lib/requireUser';
import { extractRegistryDocument } from '@/lib/gemini';
import { determineBaseRightIndex, getAssumedBurdens } from '@/features/analysis-report/lib/baseRight';
import { upsertAnalysisReport } from '@/features/analysis-report/queries';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? 'registry-documents';
const MIME_EXTENSIONS: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

// D-01: Storage 키는 ASCII만 허용되므로 원본 file.name(한글 등 비ASCII 가능) 대신
// MIME 타입 또는 파일명 확장자에서 안전하게 추출한 확장자만 사용한다.
function getFileExtension(file: File): string {
  if (MIME_EXTENSIONS[file.type]) return MIME_EXTENSIONS[file.type];
  const match = /\.([a-zA-Z0-9]+)$/.exec(file.name);
  return match ? match[1].toLowerCase() : 'bin';
}

export async function POST(request: NextRequest) {
  const denied = await requireUser(request);
  if (denied) return denied;

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json(
      { error: { code: 'INVALID_UPLOAD', message: 'multipart/form-data 요청이 필요합니다' } },
      { status: 400 },
    );
  }
  const propertyId = form.get('propertyId');
  const file = form.get('file');

  if (typeof propertyId !== 'string' || !propertyId || !(file instanceof File)) {
    return NextResponse.json(
      { error: { code: 'INVALID_UPLOAD', message: 'propertyId와 file은 필수입니다' } },
      { status: 400 },
    );
  }
  if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: { code: 'INVALID_UPLOAD', message: 'PDF/JPG/PNG, 10MB 이하 파일만 업로드 가능합니다' } },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = `${propertyId}/${Date.now()}.${getFileExtension(file)}`;

  let uploaded = false;
  try {
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: file.type });
    if (uploadError) throw uploadError;
    uploaded = true;

    const extraction = await extractRegistryDocument(buffer, file.type);

    if (!extraction || extraction.rights.length === 0) {
      await upsertAnalysisReport({
        propertyId,
        sourceFilePath: filePath,
        rights: [],
        baseRightIndex: null,
        tenantInfo: null,
        assumedBurdens: [],
        expectedBidRange: null,
        explanationText: '',
        qualityFlag: 'needs_review',
      });
      return NextResponse.json(
        {
          error: {
            code: 'OCR_EXTRACTION_FAILED',
            message: '등기부등본에서 권리 정보를 추출하지 못했습니다',
            details: {},
          },
        },
        { status: 422 },
      );
    }

    const baseRightIndex = determineBaseRightIndex(extraction.rights);
    const assumedBurdens = getAssumedBurdens(extraction.rights, baseRightIndex);

    const report = await upsertAnalysisReport({
      propertyId,
      sourceFilePath: filePath,
      rights: extraction.rights,
      baseRightIndex,
      tenantInfo: extraction.tenantInfo,
      assumedBurdens,
      expectedBidRange: extraction.expectedBidRange,
      explanationText: extraction.explanationText,
      qualityFlag: 'ok',
    });

    return NextResponse.json({ data: report }, { status: 201 });
  } catch (error) {
    console.error('[analysis-reports/upload] failed:', error);
    // 고아 객체 방지: DB에 참조되지 않은 업로드 파일 삭제 (best-effort)
    if (uploaded) {
      await supabaseAdmin.storage.from(BUCKET).remove([filePath]).catch(() => {});
    }
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal error' } },
      { status: 500 },
    );
  }
}
