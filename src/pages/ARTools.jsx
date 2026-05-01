import { useState, useEffect, useRef } from "react";
import { X, Camera, MapPin, Ruler } from "lucide-react";

const AR_TOOLS_URL = "https://gbknnjidqpmjrwlooluw.supabase.co/functions/v1/ar-tools";

// ── Permission Screen ─────────────────────────────────────────────────────────
function PermissionScreen({ onEnable }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 px-8 text-center">
      <div className="w-20 h-20 rounded-full bg-blue-600/20 flex items-center justify-center mb-6">
        <Camera className="w-10 h-10 text-blue-400" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-3">Camera & Location Access Needed</h1>
      <p className="text-gray-400 text-sm leading-relaxed mb-8">
        AR Tools uses your rear camera and GPS location to overlay setback lines and analyze structures for permit requirements. Your camera feed stays on your device.
      </p>
      <button
        onClick={onEnable}
        className="w-full max-w-xs py-3.5 rounded-2xl text-white font-semibold text-base"
        style={{ background: "#2563eb" }}
      >
        Enable AR Features
      </button>
    </div>
  );
}

// ── Setback Overlay ───────────────────────────────────────────────────────────
function SetbackOverlay({ zoning }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const z = zoning || {};

  const frontFt = z.front_setback_ft ?? "—";
  const rearFt = z.rear_setback_ft ?? "—";
  const sideFt = z.side_setback_ft ?? "—";
  const maxH = z.max_height_ft ?? "—";
  const poolRear = z.pool_rear_setback_ft ?? "—";
  const maxFence = z.max_fence_height_ft ?? "—";

  return (
    <>
      {/* Setback lines */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }}>
        <div className="absolute left-0 right-0" style={{ top: "28%" }}>
          <div className="w-full h-0.5 bg-blue-400 opacity-80" />
          <div className="absolute left-3 -top-6 bg-black/70 text-blue-300 text-xs px-2 py-1 rounded-lg font-medium">
            Front Setback: {frontFt} ft
          </div>
        </div>
        <div className="absolute left-0 right-0" style={{ top: "65%" }}>
          <div className="w-full h-0.5 bg-blue-400 opacity-80" />
          <div className="absolute right-3 -top-6 bg-black/70 text-blue-300 text-xs px-2 py-1 rounded-lg font-medium">
            Rear Setback: {rearFt} ft
          </div>
        </div>
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1 h-24 bg-blue-400 opacity-60 rounded-r" />
        <div className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/70 text-blue-300 text-[10px] px-1.5 py-1 rounded-lg" style={{ writingMode: "vertical-rl" }}>
          Side {sideFt} ft
        </div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-24 bg-blue-400 opacity-60 rounded-l" />
      </div>

      {/* Bottom panel */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-transform duration-300"
        style={{ zIndex: 4, transform: panelOpen ? "translateY(0)" : "translateY(calc(100% - 56px))" }}
      >
        <button
          onClick={() => setPanelOpen(p => !p)}
          className="w-full flex items-center justify-between px-5 rounded-t-2xl"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", minHeight: 64, paddingTop: 16, paddingBottom: 16 }}
        >
          <div className="text-left">
            <p className="text-white font-semibold text-sm">{z.zone_name || "Zoning Data"}</p>
            <p className="text-gray-400 text-xs">{z.city_name || "Tap to expand"}</p>
          </div>
          <Ruler className="w-5 h-5 text-blue-400" />
        </button>

        <div style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }} className="px-5 pb-8 pt-1">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: "Front", value: frontFt },
              { label: "Rear", value: rearFt },
              { label: "Side", value: sideFt },
              { label: "Max Height", value: maxH },
              { label: "Pool Rear", value: poolRear },
              { label: "Max Fence", value: maxFence },
            ].map(item => (
              <div key={item.label} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="text-white font-bold text-lg">
                  {item.value}
                  <span className="text-gray-400 text-xs ml-0.5">{item.value !== "—" ? " ft" : ""}</span>
                </p>
                <p className="text-gray-400 text-[10px] mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-[10px] text-center">Estimates based on zoning data — verify with city</p>
        </div>
      </div>
    </>
  );
}

// ── Permit Check Overlay ──────────────────────────────────────────────────────
function PermitCheckOverlay({ onCapture, analyzing, showResults, analysis, capturedImage, onCloseResults }) {
  return (
    <>
      {!showResults && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 3 }}>
          <div
            className="absolute left-0 right-0 h-0.5"
            style={{
              background: "linear-gradient(90deg, transparent, #2563eb, transparent)",
              animation: "scanline 3s linear infinite",
            }}
          />
        </div>
      )}

      {!showResults && (
        <div className="absolute bottom-16 left-0 right-0 flex justify-center" style={{ zIndex: 4 }}>
          <button
            onClick={onCapture}
            className="rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
            style={{ width: 96, height: 96, border: "5px solid rgba(255,255,255,0.5)" }}
          >
            <span className="text-4xl">📸</span>
          </button>
        </div>
      )}

      {showResults && (
        <div className="absolute inset-0 overflow-y-auto" style={{ zIndex: 5, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}>
          <div className="min-h-full px-5 pb-10" style={{ paddingTop: "calc(env(safe-area-inset-top) + 48px)" }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Permit Analysis</h2>
              <button onClick={onCloseResults} className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {capturedImage && (
              <img src={capturedImage} alt="Captured" className="w-full rounded-2xl mb-5 max-h-48 object-cover" />
            )}

            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-300 text-sm">AI is analyzing structures...</p>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                {Array.isArray(analysis.structures) && analysis.structures.map((s, i) => (
                  <div key={i} className="bg-white/10 rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-semibold">{s.name}</p>
                        <p className="text-gray-400 text-xs">{s.type}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.permit_required ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                        {s.permit_required ? "Permit Required" : "No Permit Needed"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {s.hvhz_concern && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium">⚠ HVHZ Concern</span>}
                      {s.may_be_unpermitted && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">🚨 May Be Unpermitted</span>}
                    </div>
                    {s.notes && <p className="text-gray-400 text-xs mb-1">{s.notes}</p>}
                    {s.recommended_action && <p className="text-blue-300 text-xs font-medium">→ {s.recommended_action}</p>}
                  </div>
                ))}

                {Array.isArray(analysis.red_flags) && analysis.red_flags.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                    <p className="text-red-400 font-semibold text-sm mb-2">🚩 Red Flags</p>
                    {analysis.red_flags.map((flag, i) => (
                      <p key={i} className="text-red-300 text-xs mb-1">• {flag}</p>
                    ))}
                  </div>
                )}

                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-gray-500 text-[10px] text-center">AI estimates only — always verify with your local building department before starting work.</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-12">No results yet.</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ARTools() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [permitted, setPermitted] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [tab, setTab] = useState("setback");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [zoning, setZoning] = useState(null);
  const [hasLoadedZoning, setHasLoadedZoning] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // BUG 3 FIX: Stop camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // BUG 2 FIX: Load zoning only ONCE when lat/lng first become available
  const loadZoning = async (latitude, longitude) => {
    try {
      const res = await fetch(AR_TOOLS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getZoning", lat: latitude, lng: longitude }),
      });
      const data = await res.json();
      if (data.success) setZoning(data);
    } catch (e) {
      console.log("Zoning error:", e);
    }
  };

  useEffect(() => {
    if (lat && lng && !hasLoadedZoning) {
      setHasLoadedZoning(true);
      loadZoning(lat, lng);
    }
  }, [lat, lng, hasLoadedZoning]);

  // Attach stream to video element once permitted (video element now exists in DOM)
  useEffect(() => {
    if (!permitted || !streamRef.current) return;
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = streamRef.current;
    video.play().catch(e => console.log("Play error:", e));
  }, [permitted]);

  // BUG 2 FIX: GPS watcher runs only once on mount (after permitted)
  const startGPS = () => {
    const watchId = navigator.geolocation.watchPosition(
      pos => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      err => console.log("GPS error", err),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
    return watchId;
  };

  const handleEnable = async () => {
    // Get the stream first, store it, then show the camera view
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError(true);
    }
    startGPS();
    setPermitted(true); // render the video element first
  };

  const captureAndAnalyze = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    const base64 = dataUrl.replace("data:image/jpeg;base64,", "");

    setAnalyzing(true);
    setShowResults(true);
    setAnalysis(null);

    try {
      const res = await fetch(AR_TOOLS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkPermit", image_base64: base64, lat, lng }),
      });
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (e) {
      setAnalysis({ structures: [], red_flags: ["Analysis failed — please try again."] });
    }
    setAnalyzing(false);
  };

  if (!permitted) {
    return <PermissionScreen onEnable={handleEnable} />;
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000", overflow: "hidden", zIndex: 40 }}>
      <style>{`
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>

      {/* BUG 1 FIX: Video with correct props and inline styles */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 1,
          backgroundColor: "#000",
        }}
      />

      {/* Camera error message */}
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center px-8 text-center" style={{ zIndex: 2 }}>
          <div className="bg-white/10 rounded-2xl p-6">
            <Camera className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">Camera Unavailable</p>
            <p className="text-gray-400 text-sm">Could not access camera. Please allow camera permission in your browser settings.</p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 5,
          paddingTop: "calc(env(safe-area-inset-top) + 12px)",
          paddingBottom: 12,
          paddingLeft: 16,
          paddingRight: 16,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* GPS indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.5)", borderRadius: 999, padding: "6px 12px" }}>
          <MapPin style={{ width: 14, height: 14, color: lat ? "#4ade80" : "#6b7280" }} />
          <span style={{ fontSize: 12, color: "#fff", fontWeight: 500 }}>
            {lat ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : "Locating..."}
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "rgba(0,0,0,0.6)", borderRadius: 999, padding: 4, backdropFilter: "blur(8px)" }}>
          <button
            onClick={() => setTab("setback")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "12px 18px", borderRadius: 999, fontSize: 15, fontWeight: 600,
              background: tab === "setback" ? "#2563eb" : "transparent",
              color: tab === "setback" ? "#fff" : "#d1d5db",
              border: "none", cursor: "pointer", minHeight: 48,
            }}
          >
            📐 Setback
          </button>
          <button
            onClick={() => { setTab("permit"); setShowResults(false); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "12px 18px", borderRadius: 999, fontSize: 15, fontWeight: 600,
              background: tab === "permit" ? "#2563eb" : "transparent",
              color: tab === "permit" ? "#fff" : "#d1d5db",
              border: "none", cursor: "pointer", minHeight: 48,
            }}
          >
            🔍 Permit
          </button>
        </div>
      </div>

      {/* Mode overlays */}
      {tab === "setback" && <SetbackOverlay zoning={zoning} />}
      {tab === "permit" && (
        <PermitCheckOverlay
          onCapture={captureAndAnalyze}
          analyzing={analyzing}
          showResults={showResults}
          analysis={analysis}
          capturedImage={capturedImage}
          onCloseResults={() => { setShowResults(false); setAnalysis(null); setCapturedImage(null); }}
        />
      )}
    </div>
  );
}