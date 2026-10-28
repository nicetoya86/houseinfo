// Design Ref: §3.1 — Property domain entity (no external dependencies)

export type PropertyType = 'auction' | 'public_sale';

export type PropertyCategory =
  | 'apartment'
  | 'villa'
  | 'officetel'
  | 'commercial'
  | 'land'
  | 'factory'
  | 'etc';

export type PropertyStatus = 'active' | 'sold' | 'cancelled';

export interface Property {
  id: string;
  caseNumber: string;
  type: PropertyType;
  category: PropertyCategory;
  sido: string;
  sigungu: string;
  eupmyeondong: string | null;
  address: string;
  appraisalValue: number;
  minBid: number;
  failCount: number;
  saleDate: string;
  zoneType: string | null;
  status: PropertyStatus;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

// Design Ref: §4.1 — GET /api/properties query params
export interface PropertyFilter {
  sido?: string[];
  sigungu?: string[];
  category?: PropertyCategory[];
  minAppraisal?: number;
  maxAppraisal?: number;
  minBidFloor?: number;
  minBidCeil?: number;
  minFailCount?: number;
  maxFailCount?: number;
  saleDateFrom?: string;
  saleDateTo?: string;
  zoneType?: string;
  page?: number;
  pageSize?: number;
}

export interface PropertyListResponse {
  data: Property[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
  };
}
