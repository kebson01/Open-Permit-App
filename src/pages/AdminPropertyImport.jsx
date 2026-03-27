import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, Loader2, Trash2, Database, AlertCircle } from "lucide-react";

export default function AdminPropertyImport() {
  const [status, setStatus] = useState("idle"); // idle | uploading | processing | done | error
  const [log, setLog] = useState([]);
  const [clearing, setClearing] = useState(false);
  const [imported, setImported] = useState(0);
  const [progress, setProgress] = useState(0); // 0-100
  const fileRef = useRef();

  const addLog = (msg) => setLog(prev => [...prev.slice(-80), msg]);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setStatus("uploading");
    setLog([]);
    setImported(0);
    setProgress(0);

    addLog(`Uploading file: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`);
    addLog(`Step 1/2: Uploading to storage...`);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      addLog(`Upload complete. Step 2/2: Processing in chunks on server...`);
      setStatus("processing");

      let byteOffset = 0;
      let headersLine = null;
      let totalImported = 0;
      let chunkNum = 0;

      while (true) {
        chunkNum++;
        const payload = { file_url, byte_offset: byteOffset };
        if (headersLine) payload.headers_line = headersLine;

        const res = await base44.functions.invoke("importProperties", payload);
        const result = res.data;

        if (result.error) {
          addLog(`ERROR: ${result.error}`);
          setStatus("error");
          return;
        }

        totalImported += result.imported || 0;
        setImported(totalImported);
        headersLine = result.headers_line || headersLine;

        if (result.total_bytes > 0) {
          const pct = Math.min(100, Math.round((result.next_offset || result.total_bytes) / result.total_bytes * 100));
          setProgress(pct);
          addLog(`Chunk ${chunkNum}: +${result.imported} rows | total ${totalImported.toLocaleString()} | ${pct}% of file`);
        }

        if (result.done || !result.next_offset) break;
        byteOffset = result.next_offset;
      }

      addLog(`✅ Done! ${totalImported.toLocaleString()} properties imported successfully.`);
      setStatus("done");
      setProgress(100);
    } catch (err) {
      addLog(`ERROR: ${err.message}`);
      setStatus("error");
    }

    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClearAll = async () => {
    if (!window.confirm("This will DELETE ALL existing property records. Are you sure?")) return;
    setClearing(true);
    addLog("Clearing all existing property records...");
    try {
      const res = await base44.functions.invoke("clearAllProperties", {});
      addLog(`Cleared: ${res.data?.deleted || "all"} records removed.`);
    } catch {
      addLog(`Note: Could not auto-clear. Please use Admin → Database to clear manually.`);
    }
    setClearing(false);
  };

  const isProcessing = status === "uploading" || status === "processing";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Database className="w-7 h-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Property Data Import</h1>
          <p className="text-gray-500 text-sm">Upload the BCPA export file — processed in chunks, any size</p>
        </div>
      </div>

      {/* Clear existing */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="font-medium text-red-800 text-sm">Clear existing data before importing?</p>
          <p className="text-red-600 text-xs mt-0.5">Recommended if replacing last year's data with a new export</p>
        </div>
        <Button variant="destructive" size="sm" onClick={handleClearAll} disabled={clearing || isProcessing}>
          {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Clear All
        </Button>
      </div>

      {/* Upload */}
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center mb-6 transition-colors ${
          isProcessing
            ? "border-blue-400 bg-blue-50 cursor-not-allowed"
            : "border-blue-300 hover:bg-blue-50 cursor-pointer"
        }`}
        onClick={() => !isProcessing && fileRef.current?.click()}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-10 h-10 text-blue-500 mx-auto mb-3 animate-spin" />
            <p className="font-semibold text-blue-700">
              {status === "uploading" ? "Uploading to storage..." : "Processing chunks on server..."}
            </p>
            {status === "processing" && progress > 0 && (
              <div className="mt-4 mx-auto max-w-xs">
                <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-blue-500 mt-1">{progress}% complete · {imported.toLocaleString()} rows imported</p>
              </div>
            )}
            <p className="text-xs text-blue-400 mt-3">Please keep this tab open.</p>
          </>
        ) : (
          <>
            <Upload className="w-10 h-10 text-blue-400 mx-auto mb-3" />
            <p className="font-semibold text-gray-700">Click to select BCPA export file</p>
            <p className="text-sm text-gray-400 mt-1">Tab-delimited or CSV — any size (chunked server-side processing)</p>
          </>
        )}
        <input ref={fileRef} type="file" accept=".txt,.csv,.tsv" className="hidden" onChange={handleFile} />
      </div>

      {status === "done" && (
        <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">{imported.toLocaleString()} properties imported! Property search is now live.</span>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">Import failed. See log below for details.</span>
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="bg-gray-900 text-green-400 rounded-xl p-4 font-mono text-xs space-y-1 max-h-72 overflow-y-auto">
          {log.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}