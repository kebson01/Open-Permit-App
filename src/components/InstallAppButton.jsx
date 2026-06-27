import React, { useState, useEffect } from "react";
import { Download, X, Share, MoreVertical } from "lucide-react";

const PRIMARY = "#003466";

// A visible "Install App" affordance. On Chrome/Edge/Android it triggers the
// browser's native install prompt; everywhere else (notably iOS Safari, which
// blocks programmatic install) it shows short manual instructions. Hides itself
// when the app is already installed / running standalone.
export default function InstallAppButton({ className = "" }) {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const ua = (navigator.userAgent || "").toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(ua) || (/macintosh/.test(ua) && "ontouchend" in document);
  const isAndroid = /android/.test(ua);

  const handleClick = async () => {
    if (deferred) {
      deferred.prompt();
      try {
        const { outcome } = await deferred.userChoice;
        if (outcome === "accepted") setInstalled(true);
      } catch { /* dismissed */ }
      setDeferred(null);
    } else {
      setShowHelp(true);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors hover:bg-[#eaf1f8] ${className}`}
        style={{ color: PRIMARY }}
      >
        <Download className="w-4 h-4" /> Install App
      </button>

      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-900">Install Open Permit</p>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            {isIOS ? (
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2"><span className="font-bold text-[#003466]">1.</span> Make sure you're in <b>Safari</b> (not Chrome).</li>
                <li className="flex items-start gap-2"><span className="font-bold text-[#003466]">2.</span> Tap the <Share className="inline w-4 h-4 mx-0.5" /> <b>Share</b> button.</li>
                <li className="flex items-start gap-2"><span className="font-bold text-[#003466]">3.</span> Scroll down and tap <b>Add to Home Screen</b>.</li>
              </ol>
            ) : isAndroid ? (
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2"><span className="font-bold text-[#003466]">1.</span> Tap the <MoreVertical className="inline w-4 h-4 mx-0.5" /> menu (top-right).</li>
                <li className="flex items-start gap-2"><span className="font-bold text-[#003466]">2.</span> Tap <b>Install app</b> or <b>Add to Home screen</b>.</li>
              </ol>
            ) : (
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2"><span className="font-bold text-[#003466]">1.</span> Look for the install icon <Download className="inline w-4 h-4 mx-0.5" /> at the right of the address bar.</li>
                <li className="flex items-start gap-2"><span className="font-bold text-[#003466]">2.</span> Or open the browser menu and choose <b>Install Open Permit…</b></li>
                <li className="text-xs text-gray-400">In Safari, use <b>File → Add to Dock</b>.</li>
              </ol>
            )}
          </div>
        </div>
      )}
    </>
  );
}
