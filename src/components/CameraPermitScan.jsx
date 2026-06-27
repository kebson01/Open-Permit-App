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
        body: { image, mediaType: "image/jpeg", ...(coords.current || {}) },
      });
      if (error) throw error;
      setResult(data);
    } catch (e) {
      setError(e.message || "Lookup failed. Try again.");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [captureBase64]);

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
        <button
          onClick={scan}
          disabled={!ready || loading}
          className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Scanning…" : "Scan item"}
        </button>
        <p className="mt-2 text-center text-xs text-gray-500">
          Point at an item, then tap to identify it and see permit info for your location.
        </p>
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {result && <Results result={result} lowConfidence={lowConfidence} />}
    </div>
  );
}

function Results({ result, lowConfidence }) {
  const { detected, city, supported, permits = [], message, contractor_category } = result;

  // Contractor contacts are opt-in — fetched only when the user asks.
  const [pros, setPros] = useState(null); // null = not requested yet
  const [proExt, setProExt] = useState(null);
  const [proLoading, setProLoading] = useState(false);

  const loadContractors = async () => {
    setProLoading(true);
    try {
      const { data } = await supabase.functions.invoke("camera-permit-lookup", {
        body: { mode: "contractors", city, contractor_category },
      });
      setPros(data?.contractors || []);
      setProExt(data?.external_contractor_lookup || null);
    } catch {
      setPros([]);
    } finally {
      setProLoading(false);
    }
  };

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

      {/* Contractors — opt-in: ask before showing contact info */}
      {detected?.work_type && contractor_category && (
        <div className="rounded-xl border border-gray-200 p-4">
          <h4 className="font-semibold">Licensed contractors</h4>
          {pros === null ? (
            <>
              <p className="mt-1 text-sm text-gray-600">
                Want to see {contractor_category.toLowerCase()} contractors who can do this work?
              </p>
              <button
                onClick={loadContractors}
                disabled={proLoading}
                className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {proLoading ? "Loading…" : "See contractor contacts"}
              </button>
            </>
          ) : pros.length > 0 ? (
            pros.map((c, i) => (
              <div key={i} className="mt-2 border-b border-gray-100 pb-2">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-gray-500">{c.license_type} {c.license} · {c.city} · exp {c.expires}</p>
              </div>
            ))
          ) : (
            <p className="mt-2 text-sm text-gray-700">{proExt || "No contractors on file yet."}</p>
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
