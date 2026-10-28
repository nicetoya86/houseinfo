// Design Ref: §3.1 — AnalysisReport domain entity (no external dependencies)

export type RightType = 'mortgage' | 'seizure' | 'provisional_seizure' | 'lease_right' | 'auction_registration';

export interface Right {
  type: RightType;
  label: string;
  registeredAt: string;
  amount: number;
  priority: number;
}

export interface TenantInfo {
  moveInDate: string | null;
  confirmedDate: string | null;
  deposit: number | null;
}

export interface AnalysisReport {
  id: string;
  propertyId: string;
  sourceFilePath: string;
  rights: Right[];
  baseRightIndex: number | null;
  tenantInfo: TenantInfo | null;
  assumedBurdens: Right[];
  expectedBidRange: { low: number; mid: number; high: number } | null;
  explanationText: string;
  qualityFlag: 'ok' | 'needs_review';
  createdAt: string;
}

export interface DistributionEntry {
  right: Right;
  claimedAmount: number;
  paidAmount: number;
  shortfall: number;
}
