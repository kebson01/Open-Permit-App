// src/pages/CameraScan.jsx
// Live Camera Permit Lookup — point the camera at an item to get permit info
// for your GPS city plus licensed contractors who can do the work.
import { Camera } from "lucide-react";
import CameraPermitScan from "@/components/CameraPermitScan";

export default function CameraScan() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Scan an Item</h1>
            <p className="text-xs text-gray-500">
              Get permit info &amp; licensed contractors for your location
            </p>
          </div>
        </div>
      </div>
      <CameraPermitScan />
    </div>
  );
}
