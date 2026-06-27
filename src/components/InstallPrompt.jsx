import React, { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

const DISMISS_KEY = "op-install-dismissed";
const PRIMARY = "#003466";
const FONT = "'Public Sans', system-ui, sans-serif";

// Themed, mobile-only "Install" banner. Detects a phone and proactively asks to
// add the app to the home screen. On Android/Chrome it fires the native install
// prompt; on iOS Safari (no programmatic install) it shows the Share → Add to
// Home Screen hint. Hides when already installed or recently dismissed.
export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferred, setDeferred] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = (navigator.userAgent || "").toLowerCase();
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (standalone) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < 14 * 864e5) return; // snooze 14 days

    const ios = /iphone|ipad|ipod/.test(ua);
    const android = /android/.test(ua);
    const isMobile = ios || android || window.innerWidth < 768;
    if (!isMobile) return;

    setIsIOS(ios);

    if (ios) {
      const t = setTimeout(() => setShow(true), 1200); // iOS has no install event
      return () => clearTimeout(t);
    }
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    const onInstalled = () => setShow(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch { /* dismissed */ }
    setDeferred(null);
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="md:hidden fixed inset-x-0 z-40 px-3"
      style={{ bottom: "calc(68px + env(safe-area-inset-bottom))", fontFamily: FONT }}
    >
      <div className="mx-auto max-w-md rounded-2xl bg-white border border-[#c3c6d1] shadow-2xl p-3.5">
        <div className="flex items-start gap-3">
          <img src="/favicon-64x64.png" alt="" className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#191c1e] text-sm">Install OpenPermit</p>
            {isIOS ? (
              <p className="text-xs text-[#737781] mt-0.5 leading-snug">
                Tap <Share className="inline w-3.5 h-3.5 mx-0.5 -mt-0.5" /> <b>Share</b>, then{" "}
                <b>Add to Home Screen</b> for a full-screen app.
              </p>
            ) : (
              <p className="text-xs text-[#737781] mt-0.5 leading-snug">
                Add it to your home screen for a faster, full-screen experience.
              </p>
            )}
          </div>
          <button onClick={dismiss} aria-label="Dismiss" className="text-[#9aa0a6] hover:text-[#424750] shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        {!isIOS && (
          <button
            onClick={install}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: PRIMARY }}
          >
            <Download className="w-4 h-4" /> Install App
          </button>
        )}
      </div>
    </div>
  );
}
