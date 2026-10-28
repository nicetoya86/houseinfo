// Design Ref: §3.1 — ViewingGuide domain entity (no external dependencies)

export interface NearbyPriceItem {
  complexName: string;
  dealDate: string;
  price: number;
  area: number;
}

export interface NearbyFacility {
  category: '지하철' | '버스' | '마트' | '병원' | '학교';
  name: string;
  distanceMeters: number;
}

export interface ViewingGuide {
  id: string;
  propertyId: string;
  infrastructureSummary: string;
  checklist: string[];
  nearbyPrices: NearbyPriceItem[];
  nearbyFacilities: NearbyFacility[];
  coordinates: { lat: number; lng: number } | null;
  generatedBy: string;
  qualityFlag: 'ok' | 'needs_regeneration';
  createdAt: string;
}
