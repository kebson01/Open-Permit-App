import React, { useState, useEffect } from "react";
import * as db from "@/lib/db";
import { Loader2, MapPin, ClipboardList, Mail, Globe, UserCheck, AlertTriangle, ExternalLink } from "lucide-react";

const ROLES = [
  { key: "homeowner",        label: "🏠 Homeowner",       desc: "Owner-builder or personal project" },
  { key: "contractor",       label: "🔧 Contractor",       desc: "Licensed contractor pulling permit" },
  { key: "private_provider", label: "🏛 Private Provider", desc: "FL Statute 553.791 provider" },
];

const CITY_ORDER = ["Weston", "Hollywood", "Coral Springs", "Cooper City", "Fort Lauderdale"];

export default function GuideSetup({ currentUser, mode = "app", onCreated }) {
  const [cities, setCities]           = useState([]);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedCityObj, setSelectedCityObj] = useState(null);
  const [permitTypes, setPermitTypes] = useState([]);
  const [permitType, setPermitType]   = useState("");
  const [userRole, setUserRole]       = useState("homeowner");
  const [guestEmail, setGuestEmail]   = useState("");
  const [creating, setCreating]       = useState(false);
  const [emailError, setEmailError]   = useState("");
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingPermits, setLoadingPermits] = useState(false);

  const isWebMode = mode === "web";

  // Load cities
  useEffect(() => {
    db.City.list().then(all => {
      // Filter to the 5 target cities, sorted
      const filtered = CITY_ORDER
        .map(name => all.find(c => c.name === name))
        .filter(Boolean);
      setCities(filtered);
      if (filtered.length > 0) {
        setSelectedCityId(filtered[0].id);
        setSelectedCityObj(filtered[0]);
      }
      setLoadingCities(false);
    });
  }, []);

  // Load permit types when city changes
  useEffect(() => {
    if (!selectedCityId) return;
    setPermitTypes([]);
    setPermitType("");
    setLoadingPermits(true);
    db.PermitType.filter({ city_id: selectedCityId, city_name: cities.find(c => c.id === selectedCityId)?.name }).then(pts => {
      setPermitTypes(pts);
      setLoadingPermits(false);
    });
  }, [selectedCityId]);

  const handleCityChange = (cityId) => {
    setSelectedCityId(cityId);
    const obj = cities.find(c => c.id === cityId);
    setSelectedCityObj(obj || null);
    setPermitType("");
  };

  const isCooperCity   = selectedCityObj?.name === "Cooper City";
  const isFortLaud     = selectedCityObj?.name === "Fort Lauderdale";
  const targetSystem   = isFortLaud ? "accela" : "manual";

  const handleStart = async () => {
    if (!permitType) return;
    if (isWebMode) {
      if (!guestEmail || !guestEmail.includes("@")) {
        setEmailError("Please enter a valid email address.");
        return;
      }
      setEmailError("");
    }

    setCreating(true);
    const email = isWebMode ? guestEmail : currentUser.email;
    const guide = await db.SubmissionGuide.create({
      user_email:       email,
      user_role:        userRole,
      city_name:        selectedCityObj?.name || "",
      city_id:          selectedCityId,
      city_portal_url:  selectedCityObj?.portal_url || "",
      permit_type_name: permitType,
      target_system:    targetSystem,
      phase:            "application",
      overall_status:   "in_progress",
      started_date:     new Date().toISOString().slice(0, 10),
      questions_answered: 0,
      questions_prefilled: 0,
      questions_total:  0,
      is_guest:         isWebMode,
    });
    setCreating(false);
    onCreated(guide, email);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">

      {/* Mode badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border ${
        isWebMode
          ? "bg-orange-50 border-orange-200 text-orange-700"
          : "bg-green-50 border-green-200 text-green-700"
      }`}>
        {isWebMode
          ? <><Globe className="w-3.5 h-3.5 shrink-0" /> <span>Guest Mode — no account needed.</span></>
          : <><UserCheck className="w-3.5 h-3.5 shrink-0" /> <span>App Mode — your profile data will be auto-filled where possible.</span></>
        }
      </div>

      {/* City selector */}
      <div>
        <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-blue-500" /> City
        </label>
        {loadingCities ? (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading cities...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {cities.map(c => (
              <button
                key={c.id}
                onClick={() => handleCityChange(c.id)}
                className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all text-sm font-medium ${
                  selectedCityId === c.id
                    ? "border-blue-500 bg-blue-50 text-blue-800"
                    : "border-gray-200 text-gray-700 hover:border-blue-200"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        {/* Fort Lauderdale note */}
        {isFortLaud && (
          <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-800">
            <ExternalLink className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>Fort Lauderdale uses <strong>LauderBuild</strong> for permit submission. You'll be directed to{" "}
              <a href="https://lauderbuild.fortlauderdale.gov" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                lauderbuild.fortlauderdale.gov
              </a>
            </span>
          </div>
        )}

        {/* Cooper City notarization warning (shown after permit type selected) */}
        {isCooperCity && permitType && (
          <div className="mt-2 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-800">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span><strong>Cooper City requires all permit applications to be notarized before submission.</strong> A Hold Harmless Agreement is also required.</span>
          </div>
        )}
      </div>

      {/* Guest email (web mode only) */}
      {isWebMode && (
        <div>
          <label className="block text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-orange-500" /> Your Email
            <span className="text-red-500 ml-0.5">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">So we can save your progress and notify you when the permit is ready.</p>
          <input
            type="email"
            value={guestEmail}
            onChange={e => { setGuestEmail(e.target.value); setEmailError(""); }}
            placeholder="your@email.com"
            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
              emailError ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200"
            }`}
          />
          {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
        </div>
      )}

      {/* Role */}
      <div>
        <label className="block text-sm font-bold text-gray-800 mb-2">I am a...</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {ROLES.map(r => (
            <button key={r.key} onClick={() => setUserRole(r.key)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                userRole === r.key ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-200"
              }`}
            >
              <p className="font-semibold text-sm text-gray-800">{r.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Permit type */}
      <div>
        <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4 text-blue-500" /> Permit Type
        </label>
        {isWebMode && (
          <p className="text-xs text-gray-500 mb-2">Select the type of work you're planning.</p>
        )}
        {loadingPermits ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading permit types...
          </div>
        ) : permitTypes.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No permit types found for this city.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {permitTypes.map(pt => (
              <button key={pt.id} onClick={() => setPermitType(pt.name)}
                className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                  permitType === pt.name
                    ? "border-blue-500 bg-blue-50 text-blue-800 font-semibold"
                    : "border-gray-200 hover:border-blue-200 text-gray-700"
                }`}
              >{pt.name}</button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleStart}
        disabled={!permitType || creating}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-opacity hover:opacity-90"
        style={{ background: "#022A5B" }}
      >
        {creating && <Loader2 className="w-4 h-4 animate-spin" />}
        {creating ? "Creating..." : isWebMode ? "Start My Free Application Guide →" : "Start Application Guide →"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        OpenPermit does not submit on your behalf. We help you prepare and guide you through the city's portal.
      </p>
    </div>
  );
}