// Design Ref: §2.1, §9.4 Infrastructure — Gemini Vision OCR(권리 추출) + 설명문 생성. 계산은 비개입.
import type { Right, TenantInfo } from '@/types/analysis-report';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

export interface RegistryExtraction {
  rights: Right[];
  tenantInfo: TenantInfo | null;
  expectedBidRange: { low: number; mid: number; high: number } | null;
  explanationText: string;
}

const EXTRACTION_PROMPT = `다음은 등기부등본 이미지/PDF입니다. 등기목적(갑구/을구) 권리 목록과 임차인 정보를 추출해 아래 JSON 형식으로만 응답하세요. 설명이나 마크다운 없이 순수 JSON만 출력합니다.

{
  "rights": [{ "type": "mortgage|seizure|provisional_seizure|lease_right|auction_registration", "label": "등기목적 원문", "registeredAt": "YYYY-MM-DD", "amount": 숫자(원), "priority": 접수순위(1부터 정수) }],
  "tenantInfo": { "moveInDate": "YYYY-MM-DD 또는 null", "confirmedDate": "YYYY-MM-DD 또는 null", "deposit": 숫자 또는 null } 또는 null(정보 없음),
  "expectedBidRange": { "low": 숫자, "mid": 숫자, "high": 숫자 } 또는 null(추정 불가),
  "explanationText": "권리관계와 리스크를 요약하는 한국어 설명 3~5문장"
}

권리 목록이 비어 있거나 판독이 불가능하면 "rights": [] 로 응답하세요.`;

const VALID_RIGHT_TYPES = new Set<string>([
  'mortgage',
  'seizure',
  'provisional_seizure',
  'lease_right',
  'auction_registration',
]);

// D-02: OCR이 반환한 JSON을 그대로 신뢰하지 않고, 허용된 type과 숫자 필드만 통과시킨다.
function isValidRight(value: unknown): value is Right {
  if (typeof value !== 'object' || value === null) return false;
  const right = value as Record<string, unknown>;
  return (
    typeof right.type === 'string' &&
    VALID_RIGHT_TYPES.has(right.type) &&
    Number.isFinite(right.amount) &&
    Number.isFinite(right.priority)
  );
}

function parseJsonResponse(raw: string): RegistryExtraction | null {
  try {
    const jsonText = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(jsonText);
    return {
      rights: Array.isArray(parsed.rights) ? parsed.rights.filter(isValidRight) : [],
      tenantInfo: parsed.tenantInfo ?? null,
      expectedBidRange: parsed.expectedBidRange ?? null,
      // G-04 ponytail: explanationText는 말소기준권리 판단(determineBaseRightIndex) 이전인
      // 이 OCR 호출에서 함께 생성됨 — Design §2.2는 결정적 계산 이후 생성을 기대.
      // 업그레이드 경로: baseRight/assumedBurdens 계산 후 결과를 프롬프트에 주입하는 2차 호출 분리.
      explanationText: typeof parsed.explanationText === 'string' ? parsed.explanationText : '',
    };
  } catch {
    return null;
  }
}

export async function extractRegistryDocument(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<RegistryExtraction | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY');

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: EXTRACTION_PROMPT },
            { inlineData: { mimeType, data: fileBuffer.toString('base64') } },
          ],
        },
      ],
    }),
  });

  // G-05: Gemini API/쿼터/인증 오류는 "OCR 판독 실패"(422)와 다른 장애이므로 throw하여
  // 호출부에서 500 INTERNAL_ERROR로 분류되게 한다. null은 200 응답의 JSON 파싱 실패 전용.
  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const json = await response.json();
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  return parseJsonResponse(raw);
}
