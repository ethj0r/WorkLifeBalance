export type CarbonEstimateInput = {
  areaHa: number;
  treeDensityScore: number;
  ndvi: number;
  pricePerTon?: number;
};

export function estimateCarbonIncome(input: CarbonEstimateInput) {
  const pricePerTon = input.pricePerTon ?? 70000;
  const densityMultiplier = 0.8 + input.treeDensityScore * 0.4;
  const ndviMultiplier = Math.max(0.65, Math.min(1.25, input.ndvi + 0.35));
  const tonsCO2e = input.areaHa * 10.2 * densityMultiplier * ndviMultiplier;
  const annualIncome = Math.round(tonsCO2e * pricePerTon);
  return {
    tonsCO2e: Number(tonsCO2e.toFixed(1)),
    annualIncome,
  };
}
