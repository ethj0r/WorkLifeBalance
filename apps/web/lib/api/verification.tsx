import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fastapi } from '@/lib/api/fastapi';
import type {
  PlotWithDetails,
  VerificationPipelineResult,
  PhotoAnalysisResult,
  SatelliteAnalysisResult,
  CarbonEstimationResult,
} from '@karbonkredit/types';

export interface VerificationStageResult {
  stage: 'satellite' | 'photo' | 'cross_validation' | 'carbon';
  status: 'success' | 'failed';
  data?: any;
  error?: string;
}

/**
 * Trigger satellite analysis untuk plot tertentu.
 * Server-side function — call dari Server Action atau API route.
 */
export async function runSatelliteAnalysis(
  plotId: string
): Promise<SatelliteAnalysisResult> {
  const supabase = createSupabaseServerClient();

  const { data: plot, error } = await supabase
    .from('plots')
    .select('polygon_geojson')
    .eq('id', plotId)
    .single();

  if (error || !plot?.polygon_geojson) {
    throw new Error('Plot tidak ditemukan atau polygon tidak valid');
  }

  return fastapi.analyzeSatellite({
    plot_id: plotId,
    polygon_geojson: plot.polygon_geojson,
  });
}

/**
 * Run photo analysis untuk semua foto di plot.
 * Aggregated tree count = sum dari semua foto.
 */
export async function runPhotoAnalysis(plotId: string): Promise<{
  total_tree_count: number;
  per_photo_results: PhotoAnalysisResult[];
}> {
  const supabase = createSupabaseServerClient();

  const { data: photos, error } = await supabase
    .from('plot_photos')
    .select('id, file_url')
    .eq('plot_id', plotId);

  if (error || !photos || photos.length === 0) {
    throw new Error('Tidak ada foto untuk dianalisis');
  }

  // Run analysis untuk semua foto secara paralel
  const results = await Promise.all(
    photos.map(async (photo) => {
      const result = await fastapi.analyzePhoto({
        plot_id: plotId,
        photo_url: photo.file_url,
      });

      // Save analysis result ke plot_photos
      await supabase
        .from('plot_photos')
        .update({ ai_analysis_result: result })
        .eq('id', photo.id);

      return result;
    })
  );

  const total = results.reduce((sum, r) => sum + r.tree_count, 0);
  return { total_tree_count: total, per_photo_results: results };
}

/**
 * Cross-validate antara satellite dan photo analysis.
 * Menghitung confidence score berdasarkan agreement antara dua metode.
 */
export function calculateCrossValidationConfidence(
  satelliteTreeCount: number,
  photoTreeCount: number
): number {
  if (satelliteTreeCount === 0 && photoTreeCount === 0) return 50;

  const max = Math.max(satelliteTreeCount, photoTreeCount);
  const min = Math.min(satelliteTreeCount, photoTreeCount);
  const agreement = max > 0 ? min / max : 0;

  // Confidence formula: 60% baseline + 40% based on agreement
  // Kalau agreement 100%, confidence 100%
  // Kalau agreement 50%, confidence 80%
  // Kalau agreement 0%, confidence 60%
  const confidence = Math.round(60 + agreement * 40);
  return Math.min(99, Math.max(50, confidence));
}

/**
 * Run carbon stock estimation berdasarkan plot detail + verification result.
 */
export async function runCarbonEstimation(
  plotId: string,
  treeCount: number
): Promise<CarbonEstimationResult> {
  const supabase = createSupabaseServerClient();

  const { data: plot, error } = await supabase
    .from('plots')
    .select(
      'area_hectares, land_type, dominant_tree_types, managed_since_year'
    )
    .eq('id', plotId)
    .single();

  if (error || !plot) {
    throw new Error('Plot tidak ditemukan');
  }

  return fastapi.estimateCarbon({
    area_hectares: plot.area_hectares,
    land_type: plot.land_type,
    dominant_tree_types: plot.dominant_tree_types || [],
    managed_since_year: plot.managed_since_year,
    tree_count: treeCount,
  });
}

/**
 * Run full verification pipeline dan persist results ke database.
 * Update plot status: pending → verifying → verified.
 *
 * Dipanggil dari verify page sebagai single Server Action.
 */
export async function runFullVerificationPipeline(
  plotId: string
): Promise<VerificationPipelineResult> {
  const supabase = createSupabaseServerClient();

  // Update status to verifying
  await supabase
    .from('plots')
    .update({ status: 'verifying' })
    .eq('id', plotId);

  // ─── Stage 1: Satellite analysis ───
  const satellite = await runSatelliteAnalysis(plotId);

  // ─── Stage 2: Photo analysis (parallel for all photos) ───
  const { total_tree_count: photoTreeCount, per_photo_results } =
    await runPhotoAnalysis(plotId);

  // ─── Stage 3: Cross-validation ───
  const confidence = calculateCrossValidationConfidence(
    satellite.estimated_tree_count,
    photoTreeCount
  );

  // ─── Stage 4: Carbon estimation ───
  const carbon = await runCarbonEstimation(
    plotId,
    Math.max(satellite.estimated_tree_count, photoTreeCount)
  );

  // ─── Persist verification record ───
  await supabase.from('verifications').upsert(
    {
      plot_id: plotId,
      ndvi_score: satellite.ndvi_score,
      tree_count_satellite: satellite.estimated_tree_count,
      tree_count_photo: photoTreeCount,
      confidence_score: confidence,
      verified_at: new Date().toISOString(),
    },
    { onConflict: 'plot_id' }
  );

  // ─── Persist carbon estimate ───
  await supabase.from('carbon_estimates').upsert(
    {
      plot_id: plotId,
      annual_sequestration_tco2e: carbon.annual_sequestration_tco2e,
      total_stored_tco2e: carbon.total_stored_tco2e,
      confidence_range_low: carbon.confidence_range_low,
      confidence_range_high: carbon.confidence_range_high,
      methodology: carbon.methodology,
      calculated_at: new Date().toISOString(),
    },
    { onConflict: 'plot_id' }
  );

  // ─── Update plot status to verified ───
  await supabase.from('plots').update({ status: 'verified' }).eq('id', plotId);

  return {
    satellite,
    photo_analysis: per_photo_results,
    cross_validation_confidence: confidence,
    carbon_estimate: carbon,
  };
}