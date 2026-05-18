import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Camera, MapPin, Ruler } from "lucide-react";

const AR_TOOLS_URL = "https://gbknnjidqpmjrwlooluw.supabase.co/functions/v1/ar-tools";

// ── Permission Screen ─────────────────────────────────────────────────────────
function PermissionScreen({ onEnable, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-950 px-8 text-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.1)" }}
      >
        <X className="w-5 h-5 text-white" />
      </button>

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
function SetbackOverlay({ zoning, property, propertyFound, permitHistory, zoningLoaded }) {
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

          {/* Property Card */}
          {propertyFound && property && (
            <div style={{
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(96,165,250,0.3)',
              borderRadius: '10px',
              padding: '12px',
              marginBottom: '14px'
            }}>
              <div style={{fontSize: '11px', color: '#60a5fa', fontWeight: '700', marginBottom: '6px'}}>
                📍 PROPERTY IDENTIFIED
              </div>
              <div style={{fontSize: '14px', fontWeight: '700', color: 'white', marginBottom: '4px'}}>
                {property.full_address}
              </div>
              <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '4px'}}>
                Folio: {property.folio_number}
              </div>
              <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.5)', display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                {property.use_type && <span>🏠 {property.use_type}</span>}
                {property.year_built && <span>📅 Built {property.year_built}</span>}
                {property.beds && <span>🛏 {property.beds}bd/{property.baths}ba</span>}
                {property.total_sqft && <span>📐 {property.total_sqft?.toLocaleString()} sqft</span>}
              </div>
              {permitHistory && permitHistory.length > 0 && (
                <div style={{marginTop: '8px', fontSize: '12px', color: '#4ade80'}}>
                  ✅ {permitHistory.length} permit{permitHistory.length !== 1 ? 's' : ''} on file
                </div>
              )}
              {permitHistory && permitHistory.length === 0 && property.city_name === 'Weston' && (
                <div style={{marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.4)'}}>
                  No permits on file
                </div>
              )}
            </div>
          )}

          {!propertyFound && zoningLoaded && (
            <div style={{fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '10px', textAlign: 'center'}}>
              📍 Property not matched in BCPA database
            </div>
          )}

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
function PermitCheckOverlay({ onCapture, analyzing, showResults, analysis, capturedImage, onCloseResults, property, permitHistory, lat, lng }) {
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

            {/* FIX 1: GPS coordinates always at top */}
            <div style={{fontSize:'12px', color:'#60a5fa', fontFamily:'monospace', marginBottom:'12px'}}>
              📍 GPS: {lat?.toFixed(6)}, {lng?.toFixed(6)}
            </div>

            {/* FIX 2: Full image, not cropped */}
            {capturedImage && (
              <img
                src={capturedImage}
                alt="Captured photo"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '12px',
                  marginBottom: '16px',
                  display: 'block',
                }}
              />
            )}

            {/* FIX 3: Google address + property info */}
            {analysis?.google_address && (
              <div style={{
                background:'rgba(59,130,246,0.12)',
                border:'1px solid rgba(96,165,250,0.25)',
                borderRadius:'10px', padding:'12px', marginBottom:'14px'
              }}>
                <div style={{fontSize:'11px', color:'#60a5fa', fontWeight:'700', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px'}}>
                  📍 Location Identified
                </div>
                <div style={{fontSize:'13px', color:'rgba(255,255,255,0.8)', marginBottom:'6px'}}>
                  {analysis.google_address}
                </div>
                {analysis.property ? (
                  <div>
                    <div style={{fontSize:'14px', fontWeight:'700', color:'white'}}>
                      {analysis.property.full_address}
                    </div>
                    <div style={{fontSize:'12px', color:'rgba(255,255,255,0.5)', marginTop:'4px', display:'flex', flexWrap:'wrap', gap:'8px'}}>
                      <span>Folio: {analysis.property.folio_number}</span>
                      <span>{analysis.property.city_name}</span>
                      {analysis.property.year_built && <span>Built {analysis.property.year_built}</span>}
                      {analysis.property.total_sqft && <span>{Number(analysis.property.total_sqft).toLocaleString()} sqft</span>}
                    </div>
                    {analysis.permit_history?.length > 0 && (
                      <div style={{marginTop:'8px', fontSize:'12px', color:'#4ade80'}}>
                        ✅ {analysis.permit_history.length} permit{analysis.permit_history.length !== 1 ? 's' : ''} on file for this property
                      </div>
                    )}
                    {analysis.permit_history?.length === 0 && (
                      <div style={{marginTop:'8px', fontSize:'12px', color:'rgba(255,255,255,0.4)'}}>
                        No permit history found
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{fontSize:'12px', color:'rgba(255,255,255,0.4)'}}>
                    Property not matched in BCPA database
                  </div>
                )}
              </div>
            )}

            {analyzing ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-300 text-sm">AI is analyzing structures... (5–10 seconds)</p>
              </div>
            ) : analysis?.error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-red-400 text-center">{analysis.error}</p>
                <button onClick={onCloseResults} className="px-5 py-2 rounded-xl bg-white/10 text-white text-sm font-medium">
                  Try Again
                </button>
              </div>
            ) : analysis ? (
              (() => {
                const hasAnalysis = analysis.analysis && !analysis.analysis.ai_error;
                const hasError = !!analysis.analysis?.ai_error;
                return (
              <div className="space-y-4">
                {/* AI results — only when Claude succeeded */}
                {hasAnalysis && (
                  <div>
                    {analysis.analysis.what_i_see && (
                      <div style={{fontSize:'14px', color:'rgba(255,255,255,0.7)', marginBottom:'16px', fontStyle:'italic'}}>
                        "{analysis.analysis.what_i_see}"
                      </div>
                    )}

                    {/* Structures */}
                    {analysis.analysis.structures?.length > 0 && analysis.analysis.structures.map((s, i) => (
                      <div key={i} style={{
                        background:'rgba(255,255,255,0.06)',
                        border:`1px solid ${s.permit_required ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                        borderRadius:'12px', padding:'14px', marginBottom:'10px'
                      }}>
                        <div style={{fontSize:'15px', fontWeight:'700', color:'white', marginBottom:'8px'}}>
                          {s.visual_label || s.name}
                        </div>
                        <span style={{
                          display:'inline-block', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:'700',
                          background: s.permit_required ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
                          color: s.permit_required ? '#f87171' : '#4ade80',
                          border:`1px solid ${s.permit_required ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)'}`
                        }}>
                          {s.permit_required ? '🔴 Permit Required' : '🟢 No Permit Needed'}
                        </span>
                        {s.hvhz_requirement && (
                          <span style={{display:'inline-block', marginLeft:'6px', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:'700', background:'rgba(234,179,8,0.2)', color:'#facc15', border:'1px solid rgba(234,179,8,0.4)'}}>
                            ⚡ HVHZ
                          </span>
                        )}
                        {s.permit_required && s.permit_name && (
                          <div style={{fontSize:'13px', fontWeight:'600', color:'white', marginTop:'8px'}}>{s.permit_name}</div>
                        )}
                        {s.fee_explanation && (
                          <div style={{fontSize:'13px', color:'rgba(255,255,255,0.6)', marginTop:'4px'}}>💰 {s.fee_explanation}</div>
                        )}
                        {s.hvhz_requirement && (
                          <div style={{fontSize:'12px', color:'#facc15', marginTop:'4px'}}>⚡ {s.hvhz_requirement}</div>
                        )}
                        {s.noc_required && (
                          <div style={{fontSize:'12px', color:'rgba(255,255,255,0.5)', marginTop:'4px'}}>📋 NOC required if over {s.noc_threshold || '$2,500'}</div>
                        )}
                        {s.already_permitted && (
                          <div style={{fontSize:'12px', color:'#4ade80', marginTop:'4px'}}>✅ {s.permit_history_note || 'This work appears to already have a permit on file'}</div>
                        )}
                        {s.notes && (
                          <div style={{fontSize:'12px', color:'rgba(255,255,255,0.4)', marginTop:'6px'}}>{s.notes}</div>
                        )}
                      </div>
                    ))}

                    {/* No permit needed */}
                    {analysis.analysis.no_permit_needed?.length > 0 && (
                      <div style={{background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.2)', borderRadius:'10px', padding:'12px', marginBottom:'12px'}}>
                        <div style={{fontSize:'13px', fontWeight:'700', color:'#4ade80', marginBottom:'8px'}}>✅ No Permit Needed For:</div>
                        {analysis.analysis.no_permit_needed.map((item, i) => (
                          <div key={i} style={{fontSize:'13px', color:'rgba(255,255,255,0.6)', padding:'2px 0'}}>• {item}</div>
                        ))}
                      </div>
                    )}

                    {/* Red flags */}
                    {analysis.analysis.red_flags?.length > 0 && (
                      <div style={{background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'10px', padding:'12px', marginBottom:'12px'}}>
                        <div style={{fontSize:'13px', fontWeight:'700', color:'#f87171', marginBottom:'8px'}}>⚠️ Concerns:</div>
                        {analysis.analysis.red_flags.map((flag, i) => (
                          <div key={i} style={{fontSize:'13px', color:'rgba(255,255,255,0.6)', padding:'2px 0'}}>• {flag}</div>
                        ))}
                      </div>
                    )}

                    {/* Next steps */}
                    {analysis.analysis.next_steps && (
                      <div style={{background:'rgba(255,255,255,0.05)', borderRadius:'10px', padding:'12px', marginBottom:'12px'}}>
                        <div style={{fontSize:'13px', fontWeight:'700', color:'white', marginBottom:'4px'}}>📋 Next Steps:</div>
                        <div style={{fontSize:'13px', color:'rgba(255,255,255,0.7)'}}>{analysis.analysis.next_steps}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* AI error — only when ai_error actually exists */}
                {hasError && (
                  <div style={{background:'rgba(234,179,8,0.1)', border:'1px solid rgba(234,179,8,0.3)', borderRadius:'10px', padding:'14px', marginBottom:'14px'}}>
                    <div style={{fontSize:'13px', color:'#facc15', fontWeight:'700', marginBottom:'6px'}}>⚠️ AI Analysis Temporarily Unavailable</div>
                    <div style={{fontSize:'12px', color:'rgba(255,255,255,0.6)'}}>
                      Property identification worked. Contact the building department for permit requirements.
                    </div>
                  </div>
                )}

                {/* City contact — always show when available */}
                {analysis.city_phone && (
                  <a href={`tel:${analysis.city_phone}`} style={{display:'block', background:'rgba(59,130,246,0.15)', border:'1px solid rgba(96,165,250,0.3)', borderRadius:'10px', padding:'12px', textDecoration:'none', textAlign:'center', marginBottom:'12px'}}>
                    <div style={{fontSize:'14px', fontWeight:'700', color:'#60a5fa'}}>📞 {analysis.city} Building Dept</div>
                    <div style={{fontSize:'13px', color:'rgba(255,255,255,0.6)', marginTop:'4px'}}>{analysis.city_phone} — Tap to call</div>
                  </a>
                )}

                {/* Permit History */}
                {permitHistory && permitHistory.length > 0 && (
                  <div style={{marginTop:'8px'}}>
                    <div style={{fontSize:'14px', fontWeight:'700', color:'#60a5fa', marginBottom:'12px'}}>
                      📋 Permit History ({permitHistory.length} permit{permitHistory.length !== 1 ? 's' : ''} on file)
                    </div>
                    {permitHistory.map((p, i) => (
                      <div key={i} style={{
                        background:'rgba(255,255,255,0.05)', borderRadius:'10px', padding:'12px', marginBottom:'8px',
                        borderLeft: `3px solid ${p.status === 'finaled' ? '#22c55e' : p.status === 'expired' ? '#ef4444' : '#f59e0b'}`
                      }}>
                        <div style={{fontSize:'13px', fontWeight:'600', color:'white', marginBottom:'4px'}}>
                          {p.permit_type?.replace(/_/g, ' ').toUpperCase()}
                        </div>
                        <div style={{fontSize:'12px', color:'rgba(255,255,255,0.5)', marginBottom:'4px'}}>
                          {p.permit_description}
                        </div>
                        <div style={{display:'flex', gap:'12px', fontSize:'11px', color:'rgba(255,255,255,0.4)'}}>
                          <span style={{color: p.status === 'finaled' ? '#4ade80' : '#f87171', fontWeight:'600'}}>
                            {p.status?.toUpperCase()}
                          </span>
                          {p.issued_date && <span>Issued: {p.issued_date}</span>}
                          {p.job_value && <span>Value: ${Number(p.job_value).toLocaleString()}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {permitHistory && permitHistory.length === 0 && property?.city_name === 'Weston' && (
                  <div style={{padding:'12px', background:'rgba(234,179,8,0.1)', border:'1px solid rgba(234,179,8,0.3)', borderRadius:'10px', fontSize:'13px', color:'#facc15'}}>
                    ⚠️ No permits found in records for this property. Verify with Weston Building Department.
                  </div>
                )}

                <div style={{background:'rgba(255,255,255,0.05)', borderRadius:'10px', padding:'10px', marginTop:'8px'}}>
                  <p style={{fontSize:'10px', color:'rgba(255,255,255,0.3)', textAlign:'center'}}>AI estimates only — always verify with your local building department before starting work.</p>
                </div>
              </div>
                );
              })()
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
  const navigate = useNavigate();
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
  const [property, setProperty] = useState(null);
  const [propertyFound, setPropertyFound] = useState(false);
  const [permitHistory, setPermitHistory] = useState([]);
  const [zoningLoaded, setZoningLoaded] = useState(false);

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
      if (data.success) {
        setZoning(data);
        setProperty(data.property || null);
        setPropertyFound(data.property_found || false);
        setPermitHistory(data.permit_history || []);
        setZoningLoaded(true);
      }
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

    // BUG 2: Check video is actually ready with real frames
    if (!video) {
      alert("Camera not ready. Please wait a moment.");
      return;
    }
    if (video.readyState < 2) {
      alert("Camera still loading. Please wait.");
      return;
    }
    if (video.videoWidth === 0) {
      alert("No camera feed detected. Please allow camera access.");
      return;
    }

    // BUG 1: Show loading state BEFORE any async work
    setAnalyzing(true);
    setShowResults(true);
    setAnalysis(null);
    setCapturedImage(null);

    try {
      // BUG 1: Capture image synchronously FIRST, before any API call
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      const base64 = dataUrl.replace("data:image/jpeg;base64,", "");

      // BUG 1: Guard — don't call API if capture failed
      if (!base64 || base64.length < 100) {
        console.error("Image capture failed — base64 too small:", base64?.length);
        setAnalysis({ error: "Could not capture image. Please try again." });
        setAnalyzing(false);
        return;
      }

      // Set preview now that we have valid image data
      setCapturedImage(dataUrl);

      // BUG 1: NOW call API with confirmed base64
      const res = await fetch(AR_TOOLS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkPermit", image_base64: base64, lat, lng }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("AR tools API error:", res.status, errText);
        setAnalysis({ error: "Analysis failed. Please try again." });
        setAnalyzing(false);
        return;
      }

      // BUG 3: Store full data object so results overlay can read data.analysis, data.property, etc.
      const data = await res.json();
      setAnalysis(data);
      setProperty(prev => data.property || prev);
      setPermitHistory(data.permit_history || []);
    } catch (err) {
      console.error("Capture/analyze error:", err);
      setAnalysis({ error: "Something went wrong. Please try again." });
    }

    setAnalyzing(false);
  };

  const handleClose = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    navigate(-1);
  };

  if (!permitted) {
    return <PermissionScreen onEnable={handleEnable} onClose={() => navigate(-1)} />;
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
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 999, background: "rgba(0,0,0,0.55)", border: "none", cursor: "pointer" }}
        >
          <X style={{ width: 18, height: 18, color: "#fff" }} />
        </button>

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
      {tab === "setback" && <SetbackOverlay zoning={zoning} property={property} propertyFound={propertyFound} permitHistory={permitHistory} zoningLoaded={zoningLoaded} />}
      {tab === "permit" && (
        <PermitCheckOverlay
          onCapture={captureAndAnalyze}
          analyzing={analyzing}
          showResults={showResults}
          analysis={analysis}
          capturedImage={capturedImage}
          onCloseResults={() => { setShowResults(false); setAnalysis(null); setCapturedImage(null); }}
          property={property}
          permitHistory={permitHistory}
          lat={lat}
          lng={lng}
        />
      )}
    </div>
  );
}