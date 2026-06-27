// Open-vocabulary object grounding (Grounding DINO via Replicate). Given the
// photo and a list of object terms, returns an accurate bounding box per
// detected object so the UI can place each permit marker on the real item
// instead of an LLM-estimated point.
//
// STATUS: prototype. Requires a REPLICATE_API_TOKEN secret on the Supabase
// project. The Replicate model + input/output mapping below MUST be verified
// against the live API on first run (they're isolated in the marked
// constants/helpers). The client treats any failure as "keep the LLM points",
// so a wrong guess degrades gracefully.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

// ── Replicate config — VERIFY against the chosen model's schema ───────────────
// A Grounding DINO model version hash (e.g. adirik/grounding-dino). Set via env.
const MODEL_VERSION = Deno.env.get("REPLICATE_GROUNDING_VERSION") || "";

// Grounding DINO takes a single "query" string of terms; conventions vary
// (comma vs period separated). Adjust once verified.
function buildInput(imageDataUrl: string, queries: string[]) {
  return {
    image: imageDataUrl,
    query: queries.join(" . "),
    box_threshold: 0.3,
    text_threshold: 0.25,
  };
}

// Normalize the model output into [{label, box:{x,y,w,h} 0-1, score}]. Different
// forks return pixel boxes [x0,y0,x1,y1] or normalized; this handles both when
// image dimensions are present, else assumes already-normalized fractions.
function parseDetections(output: unknown): Array<{ label: string; box: { x: number; y: number; w: number; h: number }; score: number }> {
  const out = output as Record<string, unknown> | undefined;
  const raw = (out?.detections || out?.predictions || output) as unknown;
  if (!Array.isArray(raw)) return [];
  const imgW = Number(out?.width) || 0;
  const imgH = Number(out?.height) || 0;
  const norm = (v: number, dim: number) => (dim > 1 ? v / dim : v);
  const res: Array<{ label: string; box: { x: number; y: number; w: number; h: number }; score: number }> = [];
  for (const d of raw as Array<Record<string, unknown>>) {
    const label = String(d.label ?? d.text ?? d.class ?? "");
    const score = Number(d.score ?? d.confidence ?? 0);
    const bb = (d.box ?? d.bbox ?? d.bounding_box) as number[] | Record<string, number> | undefined;
    if (!bb) continue;
    let x0: number, y0: number, x1: number, y1: number;
    if (Array.isArray(bb)) {
      [x0, y0, x1, y1] = bb;
    } else {
      x0 = Number(bb.x0 ?? bb.xmin ?? bb.left);
      y0 = Number(bb.y0 ?? bb.ymin ?? bb.top);
      x1 = Number(bb.x1 ?? bb.xmax ?? bb.right);
      y1 = Number(bb.y1 ?? bb.ymax ?? bb.bottom);
    }
    const nx0 = norm(x0, imgW), ny0 = norm(y0, imgH), nx1 = norm(x1, imgW), ny1 = norm(y1, imgH);
    res.push({ label, score, box: { x: nx0, y: ny0, w: nx1 - nx0, h: ny1 - ny0 } });
  }
  return res;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const token = Deno.env.get("REPLICATE_API_TOKEN");
    if (!token) return json({ success: false, error: "REPLICATE_API_TOKEN not configured" }, 200);
    if (!MODEL_VERSION) return json({ success: false, error: "REPLICATE_GROUNDING_VERSION not configured" }, 200);

    const { image_base64, image_media_type, queries } = await req.json();
    if (!image_base64 || !Array.isArray(queries) || !queries.length) {
      return json({ success: false, error: "image_base64 and queries required" }, 400);
    }
    const imageDataUrl = `data:${image_media_type || "image/jpeg"};base64,${image_base64}`;

    const create = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: { Authorization: `Token ${token}`, "Content-Type": "application/json", Prefer: "wait" },
      body: JSON.stringify({ version: MODEL_VERSION, input: buildInput(imageDataUrl, queries) }),
    });
    let pred = await create.json();
    if (!create.ok) throw new Error(pred?.detail || "Replicate create failed");

    let tries = 0;
    while (pred.status && !["succeeded", "failed", "canceled"].includes(pred.status) && tries < 40) {
      await new Promise((r) => setTimeout(r, 1000));
      const poll = await fetch(pred.urls.get, { headers: { Authorization: `Token ${token}` } });
      pred = await poll.json();
      tries++;
    }
    if (pred.status !== "succeeded") throw new Error(`Replicate status: ${pred.status}`);

    return json({ success: true, detections: parseDetections(pred.output) });
  } catch (error) {
    return json({ success: false, error: (error as Error).message }, 500);
  }
});
