import React, { useState, useRef } from "react";
import { Camera, Loader2, Sparkles, X, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ZonePhotoAnalyzer({ permitName, permitDescription }) {
  const [photo, setPhoto] = useState(null); // base64 data URL
  const [photoUrl, setPhotoUrl] = useState(null); // uploaded URL
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    setLoading(true);
    setAnalysis(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPhotoUrl(file_url);
      await analyzePhoto(file_url, permitName, permitDescription);
    } catch (err) {
      setAnalysis({ error: "Upload failed. Please try again." });
    }
    setLoading(false);
  };

  const analyzePhoto = async (url, name, desc) => {
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert building permit consultant for South Florida (Broward County). 
A user has uploaded a photo related to a "${name}" permit (${desc}).

Analyze the photo and provide:
1. **Condition Assessment**: What is the current condition of what's visible?
2. **Permit Recommendation**: Based on what you see, do they likely need a full replacement/new install permit or just a repair? Be specific.
3. **Potential Issues**: Any visible code concerns or things to flag for the building department?
4. **Next Steps**: 1-2 concrete action items for the homeowner.

Keep it concise and practical. If the image doesn't clearly show the relevant area, say so politely.`,
      file_urls: [url],
      model: "claude_sonnet_4_6",
      response_json_schema: {
        type: "object",
        properties: {
          condition: { type: "string" },
          permit_recommendation: { type: "string" },
          potential_issues: { type: "string" },
          next_steps: { type: "string" },
          image_relevant: { type: "boolean" }
        }
      }
    });
    setAnalysis(result);
  };

  const reset = () => {
    setPhoto(null);
    setPhotoUrl(null);
    setAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="border border-blue-100 rounded-xl bg-blue-50/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-blue-600" />
        <span className="text-sm font-semibold text-blue-700">AI Photo Analysis</span>
        <span className="text-xs text-blue-400 ml-auto">Upload your property photo</span>
      </div>

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

      {analysis && !analysis.error && (
        <div className="space-y-2.5 text-sm">
          {!analysis.image_relevant && (
            <p className="text-amber-600 text-xs bg-amber-50 px-3 py-2 rounded-lg">
              Note: The image may not clearly show the {permitName} area. Results may be limited.
            </p>
          )}
          <div>
            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-1">Condition</p>
            <p className="text-gray-600 leading-relaxed">{analysis.condition}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-1">Permit Needed</p>
            <p className="text-gray-600 leading-relaxed">{analysis.permit_recommendation}</p>
          </div>
          {analysis.potential_issues && (
            <div>
              <p className="font-semibold text-gray-700 text-xs uppercase tracking-wide mb-1">Potential Issues</p>
              <p className="text-gray-600 leading-relaxed">{analysis.potential_issues}</p>
            </div>
          )}
          <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2">
            <p className="font-semibold text-green-700 text-xs uppercase tracking-wide mb-1">Next Steps</p>
            <p className="text-green-700 leading-relaxed">{analysis.next_steps}</p>
          </div>
          <button onClick={reset} className="text-xs text-blue-500 underline">Analyze a different photo</button>
        </div>
      )}

      {analysis?.error && (
        <p className="text-red-500 text-sm">{analysis.error}</p>
      )}
    </div>
  );
}