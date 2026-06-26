import React, { useState, useRef } from "react";
import { Camera, Loader2, Sparkles, X, RotateCcw, Upload } from "lucide-react";
import { analyzePermitPhoto } from "@/lib/permitPhotoAnalysis";
import { detectPermitZones } from "@/lib/permitZoneDetection";
import { segmentZones, SAM_ENABLED } from "@/lib/permitZoneSegmentation";
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);

    setLoading(true);
    setAnalysis(null);
    setZones(null);
    setError(null);
    // Detect zones (for the on-photo overlay) and run the full analysis in
    // parallel. Zone detection is best-effort — a failure there must not block
    // the textual results.
    const [analysisRes, zonesRes] = await Promise.allSettled([
      analyzePermitPhoto(file, city),
      detectPermitZones(file, city),
    ]);

    if (zonesRes.status === "fulfilled") {
      let detected = zonesRes.value.zones;
      setZones(detected);
      // Optionally refine the rough zones into pixel-accurate SAM masks. This is
      // best-effort and falls back to the polygons it was given.
      if (SAM_ENABLED && detected.length) {
        try { setZones(await segmentZones(file, detected)); } catch { /* keep polygons */ }
      }
    }
    if (analysisRes.status === "fulfilled") {
      setAnalysis(analysisRes.value);
    } else if (zonesRes.status !== "fulfilled") {
      // Only surface an error if neither call produced anything useful.
      setError(analysisRes.reason?.message || "Could not analyze photo. Please try again.");
    }
    setLoading(false);
  };

  const reset = () => {
    setPhoto(null);
    setAnalysis(null);
    setZones(null);
    setError(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (uploadInputRef.current) uploadInputRef.current.value = "";
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm">AI Photo Analysis</p>
            <p className="text-blue-200 text-xs">Upload a photo — AI identifies your permit needs</p>
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
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
              <Camera className="w-7 h-7 text-blue-600" />
            </div>
            <p className="font-semibold text-blue-700 mb-1">Take or Upload a Photo</p>
            <p className="text-xs text-blue-400 mb-4">Roof, window, A/C, pool, fence, or any home area</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm transition-colors disabled:opacity-50"
              >
                <Camera className="w-4 h-4" />
                Take Photo
              </button>
              <button
                onClick={() => uploadInputRef.current?.click()}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm transition-colors disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Upload Photo
              </button>
            </div>
          </div>
        )}

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Photo preview — plain image while loading or before zones resolve.
            Once zones are detected, the interactive overlay (below) shows the
            photo instead, so we hide this to avoid a duplicate image. */}
        {photo && (loading || zones === null) && (
          <div className="relative rounded-xl overflow-hidden">
            <img src={photo} alt="Uploaded" className="block w-full" />
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

        {/* Interactive AI zone overlay on the user's own photo */}
        {photo && !loading && zones !== null && (
          <PhotoZoneOverlay photo={photo} zones={zones} city={city} />
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-blue-600" />
              </div>
              <Loader2 className="absolute inset-0 w-12 h-12 animate-spin text-blue-400" />
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

        {/* Results */}
        {analysis && !loading && <PhotoAnalysisResults analysis={analysis} city={city} />}

        {!loading && (analysis || zones !== null) && (
          <button
            onClick={reset}
            className="w-full py-2.5 border border-blue-200 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Analyze Another Photo
          </button>
        )}
      </div>
    </div>
  );
}