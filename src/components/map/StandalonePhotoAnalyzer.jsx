import React, { useState, useRef } from "react";
import { Camera, Loader2, Sparkles, X, ChevronRight, RotateCcw } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function StandalonePhotoAnalyzer({ onClose, permits = [] }) {
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setPhoto(ev.target.result);
    reader.readAsDataURL(file);

    setLoading(true);
    setAnalysis(null);

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const permitNames = [...new Set(permits.map(p => p.name))].join(", ");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert building permit consultant for South Florida (Broward County, Florida).

A homeowner or contractor has uploaded a photo of their property. Analyze it and provide permit guidance.

Known permit types in the system: ${permitNames || "Roof/Re-Roof, Window Replacement, A/C Replacement, Electrical Service, Pool & Spa, Solar Panels, Fence/Gate, Driveway, Door Replacement, Patio/Slab, Covered Patio, Pergola, Garage Door, Plumbing, Residential Remodel"}

Respond with:
1. **What you see**: Brief description of what's in the photo
2. **Likely permit type(s)**: Which permit(s) from the list above are most relevant — pick the best match(es)
3. **Condition**: Current condition assessment
4. **Permit required?**: Yes/No and why
5. **Next steps**: 2-3 concrete action items

Be concise and practical. If the image is unclear, say so.`,
      file_urls: [file_url],
      model: "claude_sonnet_4_6",
      response_json_schema: {
        type: "object",
        properties: {
          what_you_see: { type: "string" },
          permit_types: { type: "array", items: { type: "string" } },
          condition: { type: "string" },
          permit_required: { type: "boolean" },
          permit_required_reason: { type: "string" },
          next_steps: { type: "array", items: { type: "string" } },
          image_clear: { type: "boolean" }
        }
      }
    });

    setAnalysis(result);
    setLoading(false);
  };

  const reset = () => {
    setPhoto(null);
    setAnalysis(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center gap-3 py-8 border-2 border-dashed border-blue-200 rounded-2xl text-blue-500 hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Camera className="w-7 h-7 text-blue-600" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-blue-700">Take or Upload a Photo</p>
              <p className="text-xs text-blue-400 mt-1">Roof, window, A/C, pool, fence, or any home area</p>
            </div>
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

        {/* Photo preview */}
        {photo && (
          <div className="relative rounded-xl overflow-hidden">
            <img src={photo} alt="Uploaded" className="w-full h-48 object-cover" />
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

        {/* Results */}
        {analysis && !loading && (
          <div className="space-y-4">
            {!analysis.image_clear && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700">
                The image was a bit unclear — results may be approximate.
              </div>
            )}

            {/* What AI sees */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">What we see</p>
              <p className="text-sm text-gray-700">{analysis.what_you_see}</p>
            </div>

            {/* Permit types */}
            {analysis.permit_types?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Likely Permit Type(s)</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.permit_types.map((pt, i) => (
                    <span key={i} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                      {pt}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Permit required */}
            <div className={`rounded-xl px-4 py-3 flex items-start gap-3 ${analysis.permit_required ? "bg-red-50 border border-red-100" : "bg-green-50 border border-green-100"}`}>
              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${analysis.permit_required ? "bg-red-500" : "bg-green-500"}`} />
              <div>
                <p className={`font-bold text-sm ${analysis.permit_required ? "text-red-700" : "text-green-700"}`}>
                  {analysis.permit_required ? "Permit Required" : "Permit May Not Be Required"}
                </p>
                <p className={`text-xs mt-0.5 ${analysis.permit_required ? "text-red-600" : "text-green-600"}`}>
                  {analysis.permit_required_reason}
                </p>
              </div>
            </div>

            {/* Condition */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Condition Assessment</p>
              <p className="text-sm text-gray-700">{analysis.condition}</p>
            </div>

            {/* Next steps */}
            {analysis.next_steps?.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide mb-2">Next Steps</p>
                <ul className="space-y-2">
                  {analysis.next_steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-indigo-800">
                      <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-400" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={reset}
              className="w-full py-2.5 border border-blue-200 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Analyze Another Photo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}