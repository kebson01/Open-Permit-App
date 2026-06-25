import { supabase } from "@/lib/supabaseClient";

// Whether the SAM segmentation refinement is enabled. Off unless the build
// sets VITE_USE_SAM=true AND the segment-zones function has a Replicate token.
export const SAM_ENABLED = String(import.meta.env.VITE_USE_SAM || "").toLowerCase() === "true";

function fileToBase64WithType(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || "";
      resolve({ base64: String(result).split(",")[1] || "", mediaType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Axis-aligned bounding box (normalized 0-1) of a zone's polygon.
function bboxOf(polygon = []) {
  const xs = polygon.map((p) => p.x);
  const ys = polygon.map((p) => p.y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
}

/**
 * Refine rough LLM zones into pixel-accurate masks using box-prompted SAM
 * (via the `segment-zones` Edge Function → Replicate). Each returned zone gains
 * a `mask` data URL the overlay renders as a molded fill. Best-effort: on any
 * failure the original zones are returned unchanged so the UI falls back to
 * polygons.
 *
 * @param {File} file
 * @param {Array} zones  Output of detectPermitZones().
 * @returns {Promise<Array>}
 */
export async function segmentZones(file, zones) {
  if (!SAM_ENABLED || !file || !zones?.length) return zones;
  try {
    const { base64, mediaType } = await fileToBase64WithType(file);
    const boxes = zones.map((z) => bboxOf(z.polygon));
    const { data, error } = await supabase.functions.invoke("segment-zones", {
      body: { image_base64: base64, image_media_type: mediaType, boxes },
    });
    if (error || !data?.success || !Array.isArray(data.masks)) return zones;
    // data.masks is index-aligned with zones; each entry may be a base64 PNG.
    return zones.map((z, i) => {
      const png = data.masks[i];
      return png ? { ...z, mask: `data:image/png;base64,${png}` } : z;
    });
  } catch {
    return zones;
  }
}
