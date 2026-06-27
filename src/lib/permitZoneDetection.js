import { invokeLLM } from "@/lib/ai";

// Permit categories the model may use — kept in sync with the static HouseView
// diagram so detected items look and behave consistently.
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
  // Interior / finish items (common in kitchen & remodel photos)
  "Flooring",
  "Ceiling / Drywall",
  "Recessed Lighting",
  "Kitchen Cabinets",
  "Countertop",
  "Appliance Install",
  "Water Heater",
  "HVAC / Ductwork",
  "Bathroom Remodel",
];

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

const clamp01 = (n) => Math.min(1, Math.max(0, Number(n) || 0));

const DETECT_SCHEMA = {
  type: "object",
  properties: {
    what_i_see: { type: "string", description: "One short sentence describing the property in the photo." },
    zones: {
      type: "array",
      description: "Each distinct visible item that maps to a permit category.",
      items: {
        type: "object",
        properties: {
          item_name: { type: "string", description: "What the item is, in plain words (e.g. 'Kitchen window', 'Tile flooring', 'Recessed ceiling lights')." },
          label: { type: "string", description: "Closest permit category, or 'Other'.", enum: [...PERMIT_ZONE_LABELS, "Other"] },
          permit_required: { type: "boolean" },
          note: { type: "string", description: "Brief reason a permit is (or isn't) needed." },
          point: {
            type: "object",
            description: "Center point of the item on the photo, as fractions (x: 0=left..1=right, y: 0=top..1=bottom).",
            properties: { x: { type: "number" }, y: { type: "number" } },
            required: ["x", "y"],
          },
        },
        required: ["item_name", "label", "permit_required", "point"],
      },
    },
  },
  required: ["zones"],
};

/**
 * Auto-detect permit-relevant items in a photo, each with a center point so the
 * UI can drop a marker on it.
 * @returns {Promise<{ what_i_see?: string, zones: Array }>}
 */
export async function detectPermitZones(file, cityName, permitTypes = []) {
  if (!file) return { zones: [] };
  const { base64, mediaType } = await fileToBase64WithType(file);

  const names = [...new Set((permitTypes || []).map((p) => p?.name).filter(Boolean))].slice(0, 80);
  const permitContext = names.length
    ? `These are the permits ${cityName || "this city"} issues — only flag an item if it matches one of these: ${names.join(", ")}.`
    : `Use typical Florida/${cityName || "Broward County"} permit rules (Broward is a High Velocity Hurricane Zone).`;

  const prompt = `You are a Florida (${cityName || "Broward County"}) building-permit assistant.
Scan the ENTIRE photo (interior or exterior) and find ONLY the items that REQUIRE a building permit in ${cityName || "this city"}. ${permitContext}
Do NOT include anything that does not need a permit — skip flooring, cabinets, countertops, paint, decor, furniture, and plug-in appliances. Look carefully so you don't miss permit-relevant items like windows, doors, roofing, A/C, water heaters, electrical panels, recessed lighting, sinks/plumbing fixtures, pools, fences, etc.
For each qualifying item return: item_name (plain words), the closest permit category from this list or "Other" (${PERMIT_ZONE_LABELS.join(", ")}), permit_required (always true), a one-sentence note on why it needs a permit, and its center POINT as fractions of the image (x: 0 far left..1 far right; y: 0 top..1 bottom) located on the item. Only include items you can actually see; one entry per instance. Return an empty list if nothing in the photo needs a permit.`;

  const result = await invokeLLM({
    prompt,
    response_json_schema: DETECT_SCHEMA,
    image_base64: base64,
    image_media_type: mediaType,
    max_tokens: 2048,
  });

  const zones = (Array.isArray(result?.zones) ? result.zones : [])
    .filter((z) => z && z.label && z.permit_required && z.point && z.point.x != null && z.point.y != null)
    .map((z) => ({
      item_name: z.item_name || z.label,
      label: z.label,
      permit_required: true,
      note: z.note || "",
      point: { x: clamp01(z.point.x), y: clamp01(z.point.y) },
    }));

  return { what_i_see: result?.what_i_see || "", zones };
}

const POINT_SCHEMA = {
  type: "object",
  properties: {
    item_name: { type: "string", description: "What the thing at this point is, in plain words." },
    label: { type: "string", description: "Closest permit category, or 'Other'.", enum: [...PERMIT_ZONE_LABELS, "Other"] },
    permit_required: { type: "boolean" },
    note: { type: "string", description: "One short sentence on why a permit is (or isn't) needed." },
  },
  required: ["item_name", "label", "permit_required"],
};

/**
 * Identify whatever building feature is at a given point in the photo and
 * whether it needs a permit. Powers the "drag a marker onto an area" edit mode.
 * @param {File} file
 * @param {{x:number,y:number}} point  Normalized 0-1 coordinates.
 * @param {string} [cityName]
 * @returns {Promise<{item_name:string,label:string,permit_required:boolean,note:string}>}
 */
export async function identifyPointPermit(file, point, cityName, permitTypes = []) {
  const { base64, mediaType } = await fileToBase64WithType(file);
  const px = clamp01(point?.x).toFixed(3);
  const py = clamp01(point?.y).toFixed(3);
  const names = [...new Set((permitTypes || []).map((p) => p?.name).filter(Boolean))].slice(0, 80);
  const permitContext = names.length ? ` Permits ${cityName || "this city"} issues: ${names.join(", ")}.` : "";

  const prompt = `You are a Florida (${cityName || "Broward County"}) building-permit assistant.
A user dropped a marker on this photo at the point x=${px}, y=${py} (fractions of the image: x 0=left..1=right, y 0=top..1=bottom). Look closely at exactly that spot and identify the building feature/item located there. Return what it is (item_name), the closest permit category (label, or "Other" if none fits), whether replacing or installing it requires a permit in ${cityName || "Broward County"} (a High Velocity Hurricane Zone), and a one-sentence note.${permitContext} Base permit_required on this city's rules. If there is no clear permit-relevant item at that point, or it's cosmetic (flooring, paint, cabinets, decor), set permit_required false and say so in the note.`;

  const r = await invokeLLM({
    prompt,
    response_json_schema: POINT_SCHEMA,
    image_base64: base64,
    image_media_type: mediaType,
    max_tokens: 512,
  });

  return {
    item_name: r?.item_name || "Unknown item",
    label: r?.label || "Other",
    permit_required: !!r?.permit_required,
    note: r?.note || "",
  };
}
