import { useState, useEffect, useRef } from "react";
import { X, Camera, MapPin, Ruler, Search, ScanLine } from "lucide-react";

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
      <div className="absolute inset-0 pointer-events-none">
        {/* Front setback line */}
        <div className="absolute left-0 right-0" style={{ top: "28%" }}>
          <div className="w-full h-0.5 bg-blue-400 opacity-80" />
          <div className="absolute left-3 -top-6 bg-black/70 text-blue-300 text-xs px-2 py-1 rounded-lg font-medium">
            Front Setback: {frontFt} ft
          </div>
        </div>
        {/* Rear setback line */}
        <div className="absolute left-0 right-0" style={{ top: "65%" }}>
          <div className="w-full h-0.5 bg-blue-400 opacity-80" />
          <div className="absolute right-3 -top-6 bg-black/70 text-blue-300 text-xs px-2 py-1 rounded-lg font-medium">
            Rear Setback: {rearFt} ft
          </div>
        </div>
        {/* Side markers */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1 h-24 bg-blue-400 opacity-60 rounded-r" />
        <div className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/70 text-blue-300 text-[10px] px-1.5 py-1 rounded-lg" style={{ writingMode: "vertical-rl" }}>
          Side {sideFt} ft
        </div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-24 bg-blue-400 opacity-60 rounded-l" />
      </div>

      {/* Bottom panel */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-transform duration-300"
        style={{ transform: panelOpen ? "translateY(0)" : "translateY(calc(100% - 56px))" }}
      >
        <button
          onClick={() => setPanelOpen(p => !p)}
          className="w-full flex items-center justify-between px-5 py-4 rounded-t-2xl"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
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
                <p className="text-white font-bold text-lg">{item.value}<span className="text-gray-400 text-xs ml-0.5">{item.value !== "—" ? " ft" : ""}</span></p>
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
      {/* Scanning animation */}
      {!showResults && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute left-0 right-0 h-0.5"
            style={{
              background: "linear-gradient(90deg, transparent, #2563eb, transparent)",
              animation: "scanline 3s linear infinite",
            }}
          />
        </div>
      )}

      {/* Capture button */}
      {!showResults && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center">
          <button
            onClick={onCapture}
            className="w-18 h-18 rounded-full bg-white flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
            style={{ width: 72, height: 72, border: "4px solid rgba(255,255,255,0.5)" }}
          >
            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-2xl">📸</div>
          </button>
        </div>
      )}

      {/* Results overlay */}
      {showResults && (
        <div className="absolute inset-0 overflow-y-auto" style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}>
          <div className="min-h-full px-5 pt-12 pb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Permit Analysis</h2>
              <button onClick={onCloseResults} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Captured image preview */}
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
                {/* Structures */}
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
                      {s.hvhz_concern && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium">⚠ HVHZ Concern</span>
                      )}
                      {s.may_be_unpermitted && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">🚨 May Be Unpermitted</span>
                      )}
                    </div>
                    {s.notes && <p className="text-gray-400 text-xs mb-1">{s.notes}</p>}
                    {s.recommended_action && <p className="text-blue-300 text-xs font-medium">→ {s.recommended_action}</p>}
                  </div>
                ))}

                {/* Red flags */}
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
  const watchIdRef = useRef(null);

  const [permitted, setPermitted] = useState(false);
  const [tab, setTab] = useState("setback");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [zoning, setZoning] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    }
  };

  const startGPS = () => {
    watchIdRef.current = navigator.geolocation.watchPosition(
      pos => { setLat(pos.coords.latitude); setLng(pos.coords.longitude); },
      err => console.log("GPS error", err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  };

  const handleEnable = async () => {
    await startCamera();
    startGPS();
    setPermitted(true);
  };

  // Load zoning when GPS available
  useEffect(() => {
    if (!lat || !lng) return;
    const load = async () => {
      try {
        const res = await fetch(AR_TOOLS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getZoning", lat, lng }),
        });
        const data = await res.json();
        if (data.success) setZoning(data);
      } catch (e) {
        console.log("Zoning load failed", e);
      }
    };
    load();
  }, [lat, lng]);

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
    <div className="fixed inset-0 bg-black overflow-hidden" style={{ zIndex: 40 }}>
      <style>{`
        @keyframes scanline {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}</style>

      {/* Camera feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pb-3"
        style={{
          paddingTop: "calc(env(safe-area-inset-top) + 12px)",
          background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
        }}
      >
        {/* GPS indicator */}
        <div className="flex items-center gap-1.5 bg-black/50 rounded-full px-3 py-1.5">
          <MapPin className={`w-3.5 h-3.5 ${lat ? "text-green-400" : "text-gray-500"}`} />
          <span className="text-xs text-white font-medium">
            {lat ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : "Locating..."}
          </span>
        </div>

        {/* Tabs */}
        <div className="flex bg-black/60 rounded-full p-1" style={{ backdropFilter: "blur(8px)" }}>
          <button
            onClick={() => setTab("setback")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${tab === "setback" ? "bg-blue-600 text-white" : "text-gray-300"}`}
          >
            📐 Setback
          </button>
          <button
            onClick={() => { setTab("permit"); setShowResults(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${tab === "permit" ? "bg-blue-600 text-white" : "text-gray-300"}`}
          >
            🔍 Permit
          </button>
        </div>
      </div>

      {/* Mode overlays */}
      {tab === "setback" && (
        <SetbackOverlay zoning={zoning} />
      )}
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