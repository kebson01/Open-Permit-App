// Box-prompted segmentation (SAM 2 via Replicate). Turns the rough boxes from
// the LLM zone detection into pixel-accurate masks so the overlay can render a
// "molded" fill that hugs each object.
//
// STATUS: prototype. Requires a REPLICATE_API_TOKEN secret on the Supabase
// project. The exact Replicate model + input/output mapping below MUST be
// verified against the live API on first run — they are isolated in the clearly
// marked constants/helpers so they're easy to adjust. The client treats any
// failure as "fall back to polygons", so a wrong guess degrades gracefully.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

// ── Replicate config — VERIFY against the chosen model's schema ───────────────
// Pick a box-promptable SAM 2 image model and paste its version hash here.
const REPLICATE_MODEL_VERSION = Deno.env.get("REPLICATE_SAM_VERSION") || "";

// Build the model input for a single normalized box {x,y,w,h} over the image.
// Different SAM forks name this differently (box vs bbox, normalized vs pixel) —
// adjust here once verified.
function buildInput(imageDataUrl: string, box: { x: number; y: number; w: number; h: number }) {
  return {
    image: imageDataUrl,
    // Many forks accept a pixel box [x0,y0,x1,y1]; we send normalized and let the
    // model/scale be confirmed during testing.
    box: [box.x, box.y, box.x + box.w, box.y + box.h],
  };
}

// Extract a mask image URL from the model output (shape varies by model).
function maskUrlFromOutput(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output)) return (output.find((o) => typeof o === "string") as string) || null;
  const o = output as Record<string, unknown>;
  for (const k of ["mask", "masks", "output"]) {
    const v = o[k];
    if (typeof v === "string") return v;
    if (Array.isArray(v) && typeof v[0] === "string") return v[0] as string;
  }
  return null;
}

async function runReplicate(token: string, imageDataUrl: string, box: { x: number; y: number; w: number; h: number }) {
  const create = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: { Authorization: `Token ${token}`, "Content-Type": "application/json", Prefer: "wait" },
    body: JSON.stringify({ version: REPLICATE_MODEL_VERSION, input: buildInput(imageDataUrl, box) }),
  });
  let pred = await create.json();
  if (!create.ok) throw new Error(pred?.detail || "Replicate create failed");

  // Poll if the `Prefer: wait` header didn't resolve it synchronously.
  let tries = 0;
  while (pred.status && !["succeeded", "failed", "canceled"].includes(pred.status) && tries < 40) {
    await new Promise((r) => setTimeout(r, 1000));
    const poll = await fetch(pred.urls.get, { headers: { Authorization: `Token ${token}` } });
    pred = await poll.json();
    tries++;
  }
  if (pred.status !== "succeeded") throw new Error(`Replicate status: ${pred.status}`);
  return maskUrlFromOutput(pred.output);
}

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const buf = new Uint8Array(await res.arrayBuffer());
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return btoa(bin);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const token = Deno.env.get("REPLICATE_API_TOKEN");
    if (!token) return json({ success: false, error: "REPLICATE_API_TOKEN not configured" }, 200);
    if (!REPLICATE_MODEL_VERSION) return json({ success: false, error: "REPLICATE_SAM_VERSION not configured" }, 200);

    const { image_base64, image_media_type, boxes } = await req.json();
    if (!image_base64 || !Array.isArray(boxes)) return json({ success: false, error: "image_base64 and boxes required" }, 400);

    const imageDataUrl = `data:${image_media_type || "image/jpeg"};base64,${image_base64}`;

    // Segment each box; index-aligned with the input. Failures become null so
    // the client keeps that zone's polygon fallback.
    const masks = await Promise.all(
      boxes.map(async (box: { x: number; y: number; w: number; h: number }) => {
        try {
          const url = await runReplicate(token, imageDataUrl, box);
          return url ? await fetchAsBase64(url) : null;
        } catch (e) {
          console.error("segment box failed:", (e as Error).message);
          return null;
        }
      }),
    );

    return json({ success: true, masks });
  } catch (error) {
    return json({ success: false, error: (error as Error).message }, 500);
  }
});
