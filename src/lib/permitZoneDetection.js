import { invokeLLM } from "@/lib/ai";

// The permit zone labels the model is allowed to use — kept in sync with the
// static HouseView diagram so detected zones look and behave the same way.
export const PERMIT_ZONE_LABELS = [
  "Roof / Re-Roof",
  "Solar Panels",
  "Window Replacement",
  "Door Replacement",
  "Garage Door",
  "A/C Replacement",
  "Electrical Service",
  "Pool & Spa",
  "Pool Equipment",
  "Driveway / Walkway",
  "Walkway / Sidewalk",
  "Fence / Gate",
  "Patio / Slab",
  "Covered Patio",
  "Pergola",
  "Residential Remodel",
  "Residential Addition",
  "Plumbing",
];

// Convert a File to { base64, mediaType } (base64 strips the data URL prefix).
function fileToBase64WithType(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || "";
      const base64 = String(result).split(",")[1] || "";
      const mediaType = file.type || "image/jpeg";
      resolve({ base64, mediaType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const ZONE_SCHEMA = {
  type: "object",
  properties: {
    what_i_see: {
      type: "string",
      description: "One short sentence describing the property in the photo.",
    },
    zones: {
      type: "array",
      description: "Each distinct structure/feature in the photo that maps to a permit type.",
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description: "Permit category label.",
            enum: PERMIT_ZONE_LABELS,
          },
          permit_required: {
            type: "boolean",
            description: "Whether replacing/installing this feature typically requires a permit.",
          },
          note: {
            type: "string",
            description: "Brief, plain-language reason a permit is (or isn't) needed.",
          },
          polygon: {
            type: "array",
            description:
              "Ordered points tracing the OUTLINE of the feature as you see it, going clockwise. Each point is a fraction of the image (x: 0=left, 1=right; y: 0=top, 1=bottom). Use 6-16 points placed ON the object's actual edges, with extra points along curved or angled edges so the outline hugs the real silhouette. Do NOT draw a loose rectangle or a convex outline that bulges past the object, and do NOT include surrounding sky, wall, grass, or neighboring objects.",
            minItems: 4,
            maxItems: 18,
            items: {
              type: "object",
              properties: {
                x: { type: "number", description: "Horizontal position, 0-1." },
                y: { type: "number", description: "Vertical position, 0-1." },
              },
              required: ["x", "y"],
            },
          },
        },
        required: ["label", "permit_required", "polygon"],
      },
    },
  },
  required: ["zones"],
};

/**
 * Detect permit-relevant zones in a photo and return them with normalized
 * outline polygons, so the UI can draw interactive highlights that hug the
 * shape of each feature directly on the user's own image (the AI equivalent of
 * the static HouseView diagram).
 *
 * @param {File} file  The image captured/uploaded by the user.
 * @param {string} [cityName]  City used to scope wording (defaults to Broward County).
 * @returns {Promise<{ what_i_see?: string, zones: Array }>}
 */
export async function detectPermitZones(file, cityName) {
  if (!file) return { zones: [] };

  const { base64, mediaType } = await fileToBase64WithType(file);

  const prompt = `You are a Florida (${cityName || "Broward County"}) building-permit assistant.
Look at this photo of a property and identify every visible structure or feature that maps to one of these permit categories: ${PERMIT_ZONE_LABELS.join(", ")}.

For each one, trace a TIGHT polygon that hugs the feature's actual visible outline, using points expressed as fractions of the image width and height (x and y between 0 and 1, ordered clockwise). Put every point directly on the object's edge and add extra points along curved or angled edges (e.g. follow the slope of a roofline, the waterline of a pool, or the frame of a window). Use 6-16 points per feature. Do NOT draw a loose rectangle, do NOT draw a convex outline that bulges past the object, and do NOT include any surrounding sky, wall, grass, or neighboring objects inside the polygon. Only include features you can actually see in the photo. Do not invent zones. If a feature type appears multiple times (e.g. several windows), return a separate entry for each instance. Set permit_required based on typical Florida/${cityName || "Broward County"} rules (remember Broward is a High Velocity Hurricane Zone). Keep notes to one short sentence.`;

  const result = await invokeLLM({
    prompt,
    response_json_schema: ZONE_SCHEMA,
    image_base64: base64,
    image_media_type: mediaType,
    max_tokens: 3072,
  });

  const zones = Array.isArray(result?.zones) ? result.zones : [];
  const clamp = (n) => Math.min(1, Math.max(0, Number(n) || 0));

  const cleaned = zones
    .filter((z) => z && z.label)
    .map((z) => {
      // Prefer a traced polygon; fall back to a rectangle derived from a box
      // so a zone never disappears if the model returns the older shape.
      let points = Array.isArray(z.polygon)
        ? z.polygon.filter((p) => p && p.x != null && p.y != null).map((p) => ({ x: clamp(p.x), y: clamp(p.y) }))
        : [];
      if (points.length < 3 && z.box) {
        const x = clamp(z.box.x), y = clamp(z.box.y), w = clamp(z.box.w), h = clamp(z.box.h);
        points = [
          { x, y },
          { x: x + w, y },
          { x: x + w, y: y + h },
          { x, y: y + h },
        ];
      }
      return { label: z.label, permit_required: !!z.permit_required, note: z.note || "", polygon: points };
    })
    .filter((z) => z.polygon.length >= 3);

  return { what_i_see: result?.what_i_see || "", zones: cleaned };
}
