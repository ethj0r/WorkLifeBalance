// Shared types untuk Next.js dan FastAPI integration

// ─────────────────────────────────────────────────────────────
// Domain entities
// ─────────────────────────────────────────────────────────────

export type PlotStatus = 'pending' | 'verifying' | 'verified' | 'credit_issued';

export type OwnershipType = 'self' | 'on_behalf';

export type LandType =
  | 'agroforestri'
  | 'kebun_campur'
  | 'kebun_monokultur'
  | 'sawah_pohon_penyangga'
  | 'hutan_adat'
  | 'lainnya';

export type RelationshipType =
  | 'orang_tua'
  | 'kakek_nenek'
  | 'saudara'
  | 'anggota_koperasi'
  | 'tetangga'
  | 'lainnya';

export type TransactionType = 'credit_issued' | 'credit_sold' | 'withdrawal';

export type DocumentType = 'sertifikat' | 'sppt' | 'surat_keterangan_tanah' | 'lainnya';

// ─────────────────────────────────────────────────────────────
// Database tables
// ─────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone_number: string;
  display_name: string;
  province: string | null;
  regency: string | null;
  created_at: string;
}

export interface UserIdentity {
  user_id: string;
  full_name: string;
  nik: string;
  ktp_photo_url: string | null;
  verified_at: string | null;
}

export interface LandOwner {
  id: string;
  full_name: string;
  nik: string;
  ktp_photo_url: string | null;
  phone_number: string | null;
  created_by_user_id: string;
  created_at: string;
}

export interface Plot {
  id: string;
  account_holder_id: string;
  land_owner_id: string;
  name: string;
  polygon_geojson: GeoJSON.Polygon | null;
  area_hectares: number;
  address: string | null;
  land_type: LandType | null;
  managed_since_year: number | null;
  dominant_tree_types: string[];
  estimated_tree_count: number | null;
  ownership_type: OwnershipType;
  consent_acknowledged: boolean;
  status: PlotStatus;
  created_at: string;
}

export interface PlotDocument {
  id: string;
  plot_id: string;
  document_type: DocumentType;
  file_url: string;
  uploaded_at: string;
}

export interface PlotPhoto {
  id: string;
  plot_id: string;
  file_url: string;
  ai_analysis_result: PhotoAnalysisResult | null;
  uploaded_at: string;
}

export interface Verification {
  id: string;
  plot_id: string;
  ndvi_score: number | null;
  tree_count_satellite: number | null;
  tree_count_photo: number | null;
  confidence_score: number | null;
  verified_at: string;
}

export interface CarbonEstimate {
  id: string;
  plot_id: string;
  annual_sequestration_tco2e: number;
  total_stored_tco2e: number;
  confidence_range_low: number;
  confidence_range_high: number;
  methodology: string;
  calculated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  plot_id: string | null;
  transaction_type: TransactionType;
  amount_idr: number;
  tco2e_amount: number | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

// ─────────────────────────────────────────────────────────────
// Aggregated views
// ─────────────────────────────────────────────────────────────

export interface PlotWithDetails extends Plot {
  land_owner: LandOwner;
  verification: Verification | null;
  carbon_estimate: CarbonEstimate | null;
  annual_earnings_idr: number;
  photos: PlotPhoto[];
}

// ─────────────────────────────────────────────────────────────
// API Request/Response types
// ─────────────────────────────────────────────────────────────

export interface PhotoAnalysisRequest {
  photo_url: string;
  plot_id: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface PhotoAnalysisResult {
  tree_count: number;
  bounding_boxes: BoundingBox[];
  avg_canopy_diameter_m: number | null;
  processed_at: string;
  model_version: string;
}

export interface SatelliteAnalysisRequest {
  polygon_geojson: GeoJSON.Polygon;
  plot_id: string;
}

export interface SatelliteAnalysisResult {
  ndvi_score: number;
  ndvi_classification: 'low' | 'medium' | 'high';
  estimated_tree_count: number;
  imagery_date: string;
  imagery_source: 'sentinel-2';
}

export interface CarbonEstimationRequest {
  area_hectares: number;
  land_type: LandType;
  dominant_tree_types: string[];
  managed_since_year: number | null;
  tree_count: number | null;
}

export interface CarbonEstimationResult {
  annual_sequestration_tco2e: number;
  total_stored_tco2e: number;
  confidence_range_low: number;
  confidence_range_high: number;
  methodology: string;
  five_year_projection_tco2e: number[];
}

export interface VerificationPipelineResult {
  satellite: SatelliteAnalysisResult;
  photo_analysis: PhotoAnalysisResult[];
  cross_validation_confidence: number;
  carbon_estimate: CarbonEstimationResult;
}

// ─────────────────────────────────────────────────────────────
// Form state
// ─────────────────────────────────────────────────────────────

export interface AddLahanFormState {
  ownership: OwnershipType | null;
  owner_full_name?: string;
  owner_nik?: string;
  owner_birthdate?: string;
  owner_relationship?: RelationshipType;
  owner_ktp_photo_url?: string;
  owner_phone_number?: string;
  registrant_full_name: string;
  registrant_nik: string;
  registrant_ktp_photo_url?: string;
  plot_name: string;
  address: string;
  center_lat?: number;
  center_lng?: number;
  polygon_geojson?: GeoJSON.Polygon;
  area_hectares?: number;
  land_type?: LandType;
  managed_since_year?: number;
  dominant_tree_types: string[];
  estimated_tree_count?: number;
  legal_documents: { url: string; type: DocumentType }[];
  photos: string[];
  consent_acknowledged: boolean;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

export const TREE_TYPES = [
  'Kopi', 'Kakao', 'Karet', 'Sengon', 'Jati', 'Mahoni',
  'Durian', 'Mangga', 'Petai', 'Cengkeh', 'Kemiri', 'Kelapa',
  'Pinang', 'Lainnya',
] as const;

export const IDR_PER_TCO2E = 70_000;
export const USD_PER_TCO2E_INTL = 8;
export const MIN_AREA_HA = 0.1;
export const MAX_AREA_HA = 50;