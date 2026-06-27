import { supabase } from "@/lib/supabaseClient";

// Whether object-grounding refinement is enabled. Off unless the build sets
// VITE_USE_GROUNDING=true AND the ground-objects function has a Replicate token.
export const GROUNDING_ENABLED = String(import.meta.env.VITE_USE_GROUNDING || "").toLowerCase() === "true";

// Permit category -> a concrete object noun a detector can actually localize.
const TERMS = {
  "Roof / Re-Roof": "roof",
  "Solar Panels": "solar panel",
  "Window Replacement": "window",
  "Door Replacement": "door",
  "Garage Door": "garage door",
  "A/C Replacement": "air conditioner",
  "Electrical Service": "electrical panel",
  "Pool & Spa": "swimming pool",
  "Pool Equipment": "pool pump",
  "Driveway / Walkway": "driveway",
  "Walkway / Sidewalk": "walkway",
  "Fence / Gate": "fence",
  "Patio / Slab": "patio",
  "Covered Patio": "patio cover",
  "Pergola": "pergola",
  "Residential Remodel": "kitchen cabinet",
  "Residential Addition": "house",
  "Plumbing": "sink",
};

const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0));

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

/**
 * Refine each zone's marker position using a real object-grounding model (via
 * the `ground-objects` Edge Function → Replicate Grounding DINO). Replaces the
 * LLM's estimated `point` with the detected object's box center. Best-effort:
 * on any failure the zones are returned unchanged (keeps the LLM points).
 *
 * @param {File} file
 * @param {Array} zones  Output of detectPermitZones().
 * @returns {Promise<Array>}
 */
export async function groundZones(file, zones) {
  if (!GROUNDING_ENABLED || !file || !zones?.length) return zones;
  try {
    const { base64, mediaType } = await fileToBase64WithType(file);
    const terms = [...new Set(zones.map((z) => TERMS[z.label]).filter(Boolean))];
    if (!terms.length) return zones;

    const { data, error } = await supabase.functions.invoke("ground-objects", {
      body: { image_base64: base64, image_media_type: mediaType, queries: terms },
    });
    if (error || !data?.success || !Array.isArray(data.detections)) return zones;

    // Group detections by term, best score first.
    const byTerm = {};
    for (const d of data.detections) {
      const t = String(d.label || "").toLowerCase();
      (byTerm[t] = byTerm[t] || []).push(d);
    }
    Object.values(byTerm).forEach((arr) => arr.sort((a, b) => (b.score || 0) - (a.score || 0)));

    // Assign detections to zones of the same term in order (handles duplicates
    // like several windows getting distinct boxes).
    const used = {};
    return zones.map((z) => {
      const term = String(TERMS[z.label] || "").toLowerCase();
      const arr = byTerm[term];
      if (!arr || !arr.length) return z;
      const idx = (used[term] = (used[term] ?? -1) + 1);
      const d = arr[idx] || arr[arr.length - 1];
      const b = d.box;
      if (!b || b.x == null) return z;
      return { ...z, point: { x: clamp01(b.x + b.w / 2), y: clamp01(b.y + b.h / 2) } };
    });
  } catch {
    return zones;
  }
}
