import React, { useState, useRef } from "react";
import { Camera, Loader2, Sparkles, X, RotateCcw, Upload } from "lucide-react";
import { analyzePermitPhoto } from "@/lib/permitPhotoAnalysis";
import PhotoAnalysisResults from "./PhotoAnalysisResults";

export default function StandalonePhotoAnalyzer({ onClose, permits = [], city }) {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
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
    setError(null);
    try {
      setAnalysis(await analyzePermitPhoto(file, city));
    } catch (err) {
      setError(err.message || "Could not analyze photo. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setPhoto(null);
    setAnalysis(null);
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

        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        <input ref={uploadInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

        {/* Photo preview — context only; the value is the info below */}
        {photo && (
          <div className="relative rounded-xl overflow-hidden bg-gray-900">
            <img src={photo} alt="Uploaded" className="block w-full max-h-64 object-contain" />
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

        {/* Results — the permit-item info list */}
        {analysis && !loading && <PhotoAnalysisResults analysis={analysis} city={city} />}

        {analysis && !loading && (
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
