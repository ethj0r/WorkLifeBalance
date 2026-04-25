export type CountTreesResponse = {
    tree_count: number;
    annotated_image_base64: string;
  };
  
  const API_URL =
    process.env.NEXT_PUBLIC_API_DETECTION_URL ?? "http://localhost:8000";
  
  export async function detectTreesFromFixedImage(
    polygonPoints: { x: number; y: number }[],
    scoreThreshold = 0.3
  ): Promise<CountTreesResponse> {
    const imageRes = await fetch("/demo/forest.jpg");
  
    if (!imageRes.ok) {
      throw new Error("Gagal memuat gambar demo /demo/forest.jpg");
    }
  
    const imageBlob = await imageRes.blob();
  
    const polygon = polygonPoints.map((point) => [point.x, point.y]);
  
    const formData = new FormData();
    formData.append("image", imageBlob, "forest.jpg");
    formData.append("polygon", JSON.stringify(polygon));
    formData.append("score_threshold", String(scoreThreshold));
  
    const res = await fetch(`${API_URL}/count-trees`, {
      method: "POST",
      body: formData,
    });
  
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Deteksi pohon gagal: ${text}`);
    }
  
    return res.json();
  }