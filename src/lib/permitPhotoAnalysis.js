import { supabase } from "@/lib/supabaseClient";

// Convert a File to pure base64 (strips the data URL prefix)
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result || "";
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Best-effort geolocation — resolves nulls if unavailable/declined
function getGeolocation() {
  return new Promise((resolve) => {
    if (!navigator?.geolocation) return resolve({ lat: null, lng: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { timeout: 5000, maximumAge: 60000 }
    );
  });
}

/**
 * Shared handler for every "AI Photo Analysis" button.
 * Calls the Supabase `ar-tools` edge function with action `checkPermit`.
 * @param {File} file  The image file selected/captured by the user.
 * @param {string} [cityName]  City name to scope the analysis (falls back to Broward County).
 * @returns {Promise<object>} The full analysis response from the edge function.
 */
export async function analyzePermitPhoto(file, cityName) {
  if (!file) return null;

  const base64 = await fileToBase64(file);
  const { lat, lng } = await getGeolocation();

  const { data, error } = await supabase.functions.invoke("ar-tools", {
    body: {
      action: "checkPermit",
      image_base64: base64,
      lat,
      lng,
      city_name: cityName || "Broward County",
    },
  });

  if (error) throw new Error(error.message || "Analysis failed");
  if (!data?.success) throw new Error(data?.error || "Analysis failed");
  return data;
}