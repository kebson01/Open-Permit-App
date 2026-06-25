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
          box: {
            type: "object",
            description:
              "Bounding box around the feature, as fractions of the image (0=left/top, 1=right/bottom).",
            properties: {
              x: { type: "number", description: "Left edge, 0-1." },
              y: { type: "number", description: "Top edge, 0-1." },
              w: { type: "number", description: "Width, 0-1." },
              h: { type: "number", description: "Height, 0-1." },
            },
            required: ["x", "y", "w", "h"],
          },
        },
        required: ["label", "permit_required", "box"],
      },
    },
  },
  required: ["zones"],
};

/**
 * Detect permit-relevant zones in a photo and return them with normalized
 * bounding boxes, so the UI can draw interactive highlights directly on the
 * user's own image (the AI equivalent of the static HouseView diagram).
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

For each one, return a tight bounding box around it using fractions of the image width and height (x, y are the top-left corner; w, h are the size — all between 0 and 1). Only include features you can actually see in the photo. Do not invent zones. If a feature type appears multiple times (e.g. several windows), return a separate entry for each instance. Set permit_required based on typical Florida/${cityName || "Broward County"} rules (remember Broward is a High Velocity Hurricane Zone). Keep notes to one short sentence.`;

  const result = await invokeLLM({
    prompt,
    response_json_schema: ZONE_SCHEMA,
    image_base64: base64,
    image_media_type: mediaType,
    max_tokens: 2048,
  });

  const zones = Array.isArray(result?.zones) ? result.zones : [];
  // Defensively clamp boxes into [0,1] so a stray value can't break the overlay.
  const clamp = (n) => Math.min(1, Math.max(0, Number(n) || 0));
  const cleaned = zones
    .filter((z) => z && z.box && z.label)
    .map((z) => ({
      label: z.label,
      permit_required: !!z.permit_required,
      note: z.note || "",
      box: {
        x: clamp(z.box.x),
        y: clamp(z.box.y),
        w: clamp(z.box.w),
        h: clamp(z.box.h),
      },
    }))
    .filter((z) => z.box.w > 0.01 && z.box.h > 0.01);

  return { what_i_see: result?.what_i_see || "", zones: cleaned };
}
