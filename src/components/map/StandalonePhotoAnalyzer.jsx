import React, { useState, useRef } from "react";
import { Camera, Loader2, Sparkles, X, RotateCcw, Upload } from "lucide-react";
import { analyzePermitPhoto } from "@/lib/permitPhotoAnalysis";
import { detectPermitZones, identifyPointPermit } from "@/lib/permitZoneDetection";
import PhotoAnalysisResults from "./PhotoAnalysisResults";
import PhotoZoneOverlay from "./PhotoZoneOverlay";

export default function StandalonePhotoAnalyzer({ onClose, permits = [], city }) {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [zones, setZones] = useState(null);
  const [error, setError] = useState(null);
  const cameraInputRef = useRef(null);
  const uploadInputRef = useRef(null);
  const fileRef = useRef(null); // kept so edit-mode can re-query areas of this photo

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    fileRef.current = file;

    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);

    setLoading(true);
    setAnalysis(null);
    setZones(null);
    setError(null);
    // Auto-detect markers and run the full analysis in parallel; each is
    // best-effort so one failing doesn't block the other.
    const [analysisRes, zonesRes] = await Promise.allSettled([
      analyzePermitPhoto(file, city),
      detectPermitZones(file, city, permits),
    ]);
    if (zonesRes.status === "fulfilled") setZones(zonesRes.value.zones);
    if (analysisRes.status === "fulfilled") {
      setAnalysis(analysisRes.value);
    } else if (zonesRes.status !== "fulfilled") {
      setError(analysisRes.reason?.message || "Could not analyze photo. Please try again.");
    }
    setLoading(false);
  };

  const reset = () => {
    setPhoto(null);
    setAnalysis(null);
    setZones(null);
    setError(null);
    fileRef.current = null;
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  };

  // Edit mode: identify whatever is under a dropped/added marker.
  const identifyArea = (point) => identifyPointPermit(fileRef.current, point, city, permits);

  return (
    <div className="bg-white rounded-xl border border-[#c3d3e2] shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-[#003466] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">Photo analysis</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
              Upload a photo and we&rsquo;ll suggest what it likely needs
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Upload area */}
        {!photo && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#e7eef6] flex items-center justify-center mx-auto mb-3">
              <Camera className="w-7 h-7 text-[#003466]" />
            </div>
            <p className="font-semibold text-[#003466] mb-1">Take or Upload a Photo</p>
            <p className="text-xs text-[#5c6b7a] mb-4">Roof, window, A/C, pool, fence, or any home area</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#c3d3e2] bg-[#e7eef6] hover:bg-[#d8e4ef] text-[#003466] font-semibold text-sm transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
              <button
                onClick={() => uploadInputRef.current?.click()}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#c3d3e2] bg-[#e7eef6] hover:bg-[#d8e4ef] text-[#003466] font-semibold text-sm transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Upload Photo
              </button>
            </div>
          </div>
        )}

        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        <input ref={uploadInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

        {/* Plain preview while detecting; replaced by the interactive overlay after */}
        {photo && (loading || zones === null) && (
          <div className="relative rounded-xl overflow-hidden bg-gray-900">
            <img src={photo} alt="Uploaded" className="block w-full max-h-72 object-contain" />
            {!loading && (
              <button
                onClick={reset}
                className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1.5 bg-black/60 backdrop-blur-sm rounded-lg text-white text-xs font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                New Photo
              </button>
            )}
          </div>
        )}

        {/* Feature 1 (auto markers) + Feature 2 (drag/add to check an area) */}
        {photo && !loading && zones !== null && (
          <PhotoZoneOverlay photo={photo} zones={zones} city={city} onIdentifyArea={identifyArea} />
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-[#e7eef6] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#003466]" />
              </div>
              <Loader2 className="absolute inset-0 w-12 h-12 animate-spin text-[#5c6b7a]" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 text-sm">Analyzing your photo...</p>
              <p className="text-xs text-gray-400 mt-1">AI is reviewing permit requirements</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Detailed analysis cards */}
        {analysis && !loading && <PhotoAnalysisResults analysis={analysis} city={city} />}

        {!loading && (analysis || zones !== null) && (
          <button
            onClick={reset}
            className="w-full py-2.5 border border-[#c3d3e2] text-[#003466] rounded-xl text-sm font-medium hover:bg-[#e7eef6] transition-colors flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Analyze Another Photo
          </button>
        )}
      </div>
    </div>
  );
}
