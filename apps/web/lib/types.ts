export type PlotStatus = "pending" | "verifying" | "verified" | "credit_issued";

export type Plot = {
  id: string;
  name: string;
  location: string;
  area: number;
  status: PlotStatus;
  annualEarnings: number;
  carbonTons: number;
  confidence: number;
  ndvi: number;
  trees: string[];
  polygon: string;
  owner: string;
};
