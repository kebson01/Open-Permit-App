// src/components/CameraPermitScan.jsx
//
// Open Permit — Live Camera Permit Lookup (frontend)
// Point the rear camera at an item -> identify it -> show permit info for the
// user's GPS city + licensed contractors. Calls the `camera-permit-lookup`
// Supabase Edge Function. No Base44 dependency.
//
// Adjust the import below to wherever your Supabase client lives.
import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

const MIN_CONFIDENCE = 0.45;

export default function CameraPermitScan() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const inFlight = useRef(false);
  const coords = useRef(null);

  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [hint, setHint] = useState("");

  // Start camera + grab location once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch {
        setError("Camera access was denied. Enable camera permission to scan.");
      }
      navigator.geolocation?.getCurrentPosition(
        (p) => (coords.current = { lat: p.coords.latitude, lng: p.coords.longitude }),
        () => (coords.current = null),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const captureBase64 = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || !v.videoWidth) return null;
    const maxW = 1024;
    const scale = Math.min(1, maxW / v.videoWidth);
    c.width = v.videoWidth * scale;
    c.height = v.videoHeight * scale;
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.7).split(",")[1]; // strip data: prefix
  }, []);

  const scan = useCallback(async () => {
    if (inFlight.current) return;
    const image = captureBase64();
    if (!image) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("camera-permit-lookup", {
        body: { image, mediaType: "image/jpeg", hint: hint.trim() || undefined, ...(coords.current || {}) },
      });
      if (error) throw error;
      setResult(data);
    } catch (e) {
      setError(e.message || "Lookup failed. Try again.");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [captureBase64, hint]);

  const lowConfidence = result?.detected && result.detected.confidence < MIN_CONFIDENCE;

  return (
    <div className="mx-auto max-w-md p-4">
      <div className="relative overflow-hidden rounded-2xl bg-black aspect-[3/4]">
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-black/40 text-white">
            <div className="animate-pulse text-sm">Identifying…</div>
          </div>
        )}
        {/* viewfinder reticle */}
        <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-white/70" />
      </div>

      <div className="mt-3">
        <label htmlFor="scan-hint" className="mb-1 block text-xs font-medium text-gray-600">
          What are you planning? <span className="font-normal text-gray-400">(optional, improves accuracy)</span>
        </label>
        <input
          id="scan-hint"
          type="text"
          value={hint}
          onChange={(e) => setHint(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") scan(); }}
          placeholder="e.g. window replacement, replace glass door…"
          className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="mt-3">
        <button
          onClick={scan}
          disabled={!ready || loading}
          className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Scanning…" : "Scan item"}
        </button>
        <p className="mt-2 text-center text-xs text-gray-500">
          Point at the item and tap. Add a note above (like “replace glass door”) so the AI focuses on the right thing.
        </p>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {result && <Results result={result} lowConfidence={lowConfidence} />}
    </div>
  );
}

function Results({ result, lowConfidence }) {
  const { detected, city, supported, permits = [], contractors = [], verified_contractors = [], external_contractor_lookup, message } = result;

  return (
    <div className="mt-4 space-y-4">
      {detected?.work_type ? (
        <div className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-baseline justify-between">
            <h3 className="text-lg font-semibold capitalize">{detected.item_label}</h3>
            <span className="text-xs text-gray-500">{Math.round((detected.confidence || 0) * 100)}% sure</span>
          </div>
          <p className="text-sm text-gray-600">{detected.work_type}{city ? ` · ${city}` : ""}</p>
          {lowConfidence && (
            <p className="mt-2 text-sm text-amber-700">Not fully sure this is right — try moving closer or rescanning.</p>
          )}
        </div>
      ) : (
        <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{message || "No permit-relevant item identified."}</p>
      )}

      {supported === false && message && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{message}</p>
      )}

      {permits.map((p) => (
        <div key={p.permit_type_id} className="rounded-xl border border-gray-200 p-4">
          <h4 className="font-semibold">{p.name}</h4>
          {p.description && <p className="mt-1 text-sm text-gray-600">{p.description}</p>}
          {p.typical_timeline && <p className="mt-1 text-xs text-gray-500">Typical timeline: {p.typical_timeline}</p>}

          <List title="Documents needed" items={p.documents_needed} />
          <List title="Requirements" items={p.typical_requirements} />
          <List title="Inspections" items={p.inspections_required} />

          {p.fee_rules?.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">{p.fee_rules.length} fee rule(s) apply — see the Fee Calculator for an exact estimate.</p>
          )}
        </div>
      ))}

      {(contractors.length > 0 || verified_contractors.length > 0 || external_contractor_lookup) && (
        <div className="rounded-xl border border-gray-200 p-4">
          <h4 className="font-semibold">Licensed contractors</h4>

          {verified_contractors.map((c, i) => (
            <div key={`v${i}`} className="mt-2 flex items-center justify-between border-b border-gray-100 pb-2">
              <div>
                <p className="text-sm font-medium">{c.company_name} <span className="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-[10px] text-green-700">Verified</span></p>
                <p className="text-xs text-gray-500">{c.license_type} {c.license_number}</p>
              </div>
              {c.phone && <a href={`tel:${c.phone}`} className="text-sm text-blue-600">Call</a>}
            </div>
          ))}

          {contractors.map((c, i) => (
            <div key={`c${i}`} className="mt-2 border-b border-gray-100 pb-2">
              <p className="text-sm font-medium">{c.name}</p>
              <p className="text-xs text-gray-500">{c.license_type} {c.license} · {c.city} · exp {c.expires}</p>
            </div>
          ))}

          {external_contractor_lookup && (
            <p className="mt-2 text-sm text-gray-700">{external_contractor_lookup}</p>
          )}
        </div>
      )}
    </div>
  );
}

function List({ title, items }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
      <ul className="mt-1 list-disc pl-5 text-sm text-gray-700">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </div>
  );
}
