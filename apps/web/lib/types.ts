export type PlotStatus =
  | "pending"
  | "verifying"
  | "verified"
  | "credit_issued";

export type LandType =
  | "Agroforestri"
  | "Kebun campur"
  | "Kebun monokultur"
  | "Hutan rakyat"
  | "Hutan adat"
  | "Mangrove"
  | "Lahan restorasi";

export const LAND_TYPE_OPTIONS: LandType[] = [
  "Agroforestri",
  "Kebun campur",
  "Kebun monokultur",
  "Hutan rakyat",
  "Hutan adat",
  "Mangrove",
  "Lahan restorasi",
];

export type PolygonPoint = {
  x: number;
  y: number;
};

export type LatLng = {
  lat: number;
  lng: number;
};

export type LandImageEntry = {
  file: File;
  previewUrl: string;
};

export type StepPhotosData = {
  legalDoc: File | null;
  landImages: LandImageEntry[];
};

export type Plot = {
  id: string;
  name: string;
  location: string;
  area: number;
  landType: LandType;
  status: PlotStatus;
  annualEarnings: number;
  carbonTons: number;
  confidence: number;
  ndvi: number;
  trees: string[];
  polygon: string;
  owner: string;
  polygonPoints?: PolygonPoint[];
  treeCount?: number | null;
};