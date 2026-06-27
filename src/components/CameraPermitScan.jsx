// src/components/CameraPermitScan.jsx
//
// Open Permit — Live Camera Permit Lookup (frontend)
// Point the rear camera at an item -> identify it -> show permit info for the
// user's GPS city + licensed contractors. Calls the `camera-permit-lookup`
// Supabase Edge Function. No Base44 dependency.
//
// Adjust the import below to wherever your Supabase client lives.
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const MIN_CONFIDENCE = 0.45;

const hexA = (hex, a) => {
  const h = hex.replace("#", "");
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
};

export default function CameraPermitScan() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const inFlight = useRef(false);
  const coords = useRef(null);
  const frozenB64 = useRef(null); // the captured frame we query against

  const [ready, setReady] = useState(false);
  const [frozen, setFrozen] = useState(null); // dataURL still shown over the live feed
  const [marker, setMarker] = useState(null); // { x, y } normalized 0-1
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

  // Capture the current video frame (downscaled) as { dataUrl, base64 }.
  const captureFrame = () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || !v.videoWidth) return null;
    const maxW = 1024;
    const scale = Math.min(1, maxW / v.videoWidth);
    c.width = v.videoWidth * scale;
    c.height = v.videoHeight * scale;
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL("image/jpeg", 0.7);
    return { dataUrl, base64: dataUrl.split(",")[1] };
  };

  const runLookup = async (base64, point) => {
    inFlight.current = true;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("camera-permit-lookup", {
        body: { image: base64, mediaType: "image/jpeg", point, ...(coords.current || {}) },
      });
      if (error) throw error;
      setResult(data);
    } catch (e) {
      setError(e.message || "Lookup failed. Try again.");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  };

  // Tap the live view (or the frozen still) to drop a lightball on that item.
  const handleTap = (e) => {
    if (!ready || inFlight.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

    let base64 = frozenB64.current;
    if (!frozen) {
      const cap = captureFrame();
      if (!cap) return;
      frozenB64.current = cap.base64;
      base64 = cap.base64;
      setFrozen(cap.dataUrl); // freeze the frame so the marker stays put
    }
    setMarker({ x, y });
    runLookup(base64, { x, y });
  };

  const reset = () => {
    frozenB64.current = null;
    setFrozen(null);
    setMarker(null);
    setResult(null);
    setError(null);
  };

  const lowConfidence = result?.detected && result.detected.confidence < MIN_CONFIDENCE;
  const permitNeeded = (result?.permits?.length || 0) > 0;
  const ballColor = loading ? "#f59e0b" : result ? (permitNeeded ? "#ef4444" : "#22c55e") : "#f59e0b";

  return (
    <div className="mx-auto max-w-md p-4">
      <div
        onClick={handleTap}
        className="relative w-full overflow-hidden rounded-2xl bg-black select-none"
        style={{ cursor: ready ? "crosshair" : "default" }}
      >
        <video ref={videoRef} playsInline muted className="block w-full" />
        {frozen && <img src={frozen} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <canvas ref={canvasRef} className="hidden" />

        {/* Lightball marker */}
        {marker && (
          <span
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
          >
            <span className="relative block h-5 w-5">
              <span className="absolute inset-0 rounded-full animate-ping" style={{ background: hexA(ballColor, 0.55) }} />
              <span
                className="absolute inset-0 rounded-full border-2 border-white"
                style={{ background: ballColor, boxShadow: `0 0 14px 4px ${hexA(ballColor, 0.9)}` }}
              />
            </span>
          </span>
        )}

        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-black/30 text-white">
            <div className="animate-pulse text-sm">Identifying…</div>
          </div>
        )}

        {!frozen && ready && (
          <div className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-xs text-white/90 drop-shadow">
            Tap the item you want to check
          </div>
        )}
      </div>

      {frozen ? (
        <button
          onClick={reset}
          disabled={loading}
          className="mt-3 w-full rounded-xl border border-gray-300 py-3 font-medium text-gray-700 disabled:opacity-50"
        >
          Scan another item
        </button>
      ) : (
        <p className="mt-3 text-center text-xs text-gray-500">
          Point the camera, then tap an item to drop a lightball and see its permit info.
        </p>
      )}

      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      {result && !loading && <Results result={result} lowConfidence={lowConfidence} />}
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
