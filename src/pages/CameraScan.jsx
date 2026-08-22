// src/pages/CameraScan.jsx
// Live Camera Permit Lookup — point the camera at an item to get permit info
// for your GPS city plus licensed contractors who can do the work.
//
// The header stays deliberately short. The camera is the page, and every line
// above it is a line the viewfinder is pushed down by.
import CameraPermitScan from "@/components/CameraPermitScan";
import { C, F, T } from "@/lib/theme";

export default function CameraScan() {
  return (
    <div style={{ background: C.ground, fontFamily: F.body, color: C.ink }} className="min-h-screen">
      <div className="mx-auto max-w-[560px] px-4 pt-5">
        <h1 style={{ fontFamily: F.head, fontSize: T.title, fontWeight: 800, letterSpacing: "-0.02em" }}>
          Scan an item
        </h1>
        <p className="mt-1" style={{ color: C.muted, fontSize: T.small, lineHeight: 1.55 }}>
          Point your camera at it. We use your location to answer for the right city, and can
          find licensed contractors for the work.
        </p>
      </div>
      <CameraPermitScan />
    </div>
  );
}
