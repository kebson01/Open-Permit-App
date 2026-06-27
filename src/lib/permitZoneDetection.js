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
          point: {
            type: "object",
            description:
              "The exact CENTER POINT of this item on the photo, as fractions of the image (x: 0=left, 1=right; y: 0=top, 1=bottom). The point MUST sit directly on the item itself, not near it.",
            properties: {
              x: { type: "number", description: "Horizontal position, 0-1." },
              y: { type: "number", description: "Vertical position, 0-1." },
            },
            required: ["x", "y"],
          },
        },
        required: ["label", "permit_required", "point"],
      },
    },
  },
  required: ["zones"],
};

/**
 * Detect permit-relevant items in a photo and return each with a precise center
 * POINT (fractions of the image), so the UI can drop a marker directly on the
 * item.
 *
 * @param {File} file  The image captured/uploaded by the user.
 * @param {string} [cityName]  City used to scope wording (defaults to Broward County).
 * @returns {Promise<{ what_i_see?: string, zones: Array }>}
 */
export async function detectPermitZones(file, cityName) {
  if (!file) return { zones: [] };

  const { base64, mediaType } = await fileToBase64WithType(file);

  const prompt = `You are a Florida (${cityName || "Broward County"}) building-permit assistant.
Look at this photo of a property and identify every visible item or feature that maps to one of these permit categories: ${PERMIT_ZONE_LABELS.join(", ")}.

For each one, return its precise CENTER POINT — the (x, y) location of the item, as fractions of the image width and height (x: 0 is the far left, 1 is the far right; y: 0 is the top, 1 is the bottom). The point MUST land directly ON the item itself (for example, on the actual window glass, the actual A/C unit, the center of the cabinet run or the roof section) — never in empty space, on a blank wall, or merely near it. Study the image carefully and be as accurate as possible. Only include items you can actually see. Do not invent items. If an item type appears multiple times (e.g. several windows), return a separate entry for each instance, each with its own point. Set permit_required based on typical Florida/${cityName || "Broward County"} rules (remember Broward is a High Velocity Hurricane Zone). Keep notes to one short sentence.`;

  const result = await invokeLLM({
    prompt,
    response_json_schema: ZONE_SCHEMA,
    image_base64: base64,
    image_media_type: mediaType,
    max_tokens: 2048,
  });

  const zones = Array.isArray(result?.zones) ? result.zones : [];
  const clamp = (n) => Math.min(1, Math.max(0, Number(n) || 0));

  const cleaned = zones
    .filter((z) => z && z.label && z.point && z.point.x != null && z.point.y != null)
    .map((z) => {
      const x = clamp(z.point.x);
      const y = clamp(z.point.y);
      // Keep a small box around the point so downstream consumers that expect a
      // polygon (e.g. the optional SAM step) still work.
      const d = 0.03;
      const polygon = [
        { x: clamp(x - d), y: clamp(y - d) },
        { x: clamp(x + d), y: clamp(y - d) },
        { x: clamp(x + d), y: clamp(y + d) },
        { x: clamp(x - d), y: clamp(y + d) },
      ];
      return { label: z.label, permit_required: !!z.permit_required, note: z.note || "", point: { x, y }, polygon };
    });

  return { what_i_see: result?.what_i_see || "", zones: cleaned };
}
