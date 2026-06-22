import React, { useState, useRef } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { analyzePermitPhoto } from "@/lib/permitPhotoAnalysis";
import PhotoAnalysisResults from "./PhotoAnalysisResults";

export default function ZonePhotoAnalyzer({ permitName, permitDescription, cityName }) {
  const [photo, setPhoto] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

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
      const data = await analyzePermitPhoto(file, cityName);
      setAnalysis(data);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-blue-500">Upload a photo of your {permitName} area for personalized guidance</p>

      {!photo && (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm font-medium"
        >
          <Camera className="w-4 h-4" />
          Take or Upload Photo
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {photo && (
        <div className="relative">
          <img src={photo} alt="Uploaded" className="w-full h-36 object-cover rounded-xl" />
          {!loading && (
            <button
              onClick={reset}
              className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-blue-600 text-sm py-1">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing your photo with AI...
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {analysis && !loading && (
        <>
          <PhotoAnalysisResults analysis={analysis} city={cityName} />
          <button onClick={reset} className="text-xs text-blue-500 underline">Analyze a different photo</button>
        </>
      )}
    </div>
  );
}