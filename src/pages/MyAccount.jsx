import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import * as db from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { User, Shield, AlertTriangle, Loader2, CheckCircle2, LogOut } from "lucide-react";
import { useLicenseAlerts } from "@/hooks/useLicenseAlerts";
import LicenseAlertBanner from "@/components/alerts/LicenseAlertBanner";

const PRIMARY = "#004ac6";
const FONTS = { h: "'Manrope', system-ui, sans-serif", b: "'Plus Jakarta Sans', system-ui, sans-serif" };

function FieldGroup({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1" style={{ fontFamily: FONTS.b }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", disabled }) {
  return (
    <input type={type} value={value || ""} onChange={onChange} placeholder={placeholder} disabled={disabled}
      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400 bg-white disabled:bg-gray-50 disabled:text-gray-400"
      style={{ fontFamily: FONTS.b }} />
  );
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
}

export default function MyAccount() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [tab, setTab]                 = useState("profile");
  const [profile, setProfile]         = useState({});
  const [cpId, setCpId]               = useState(null);
  const [cp, setCp]                   = useState({});
  const [savingCp, setSavingCp]       = useState(false);
  const [savedCp, setSavedCp]         = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "";
    setProfile({ full_name: displayName, phone: user.user_metadata?.phone || "" });
    db.ContractorProfile.filter({ user_email: user.email }).then(records => {
      if (records && records.length > 0) { setCpId(records[0].id); setCp(records[0]); }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, authLoading]);

  const saveProfile = async () => {
    setSaving(true);
    await supabase.auth.updateUser({ data: { full_name: profile.full_name, phone: profile.phone } });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveContractor = async () => {
    setSavingCp(true);
    if (cpId) {
      await db.ContractorProfile.update(cpId, { ...cp, user_email: user.email });
    } else {
      const created = await db.ContractorProfile.create({ ...cp, user_email: user.email });
      setCpId(created.id);
      setCp(created);
    }
    setSavingCp(false);
    setSavedCp(true);
    setTimeout(() => setSavedCp(false), 2000);
  };

  const licenseExp = daysUntil(cp.license_expiration);
  const insuranceExp = daysUntil(cp.insurance_expiration);
  const { alerts } = useLicenseAlerts(user?.email);

  if (loading || authLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;
  }

  if (!user) return null; // ProtectedRoute handles redirect

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "";
  const userRole    = user.user_metadata?.role || "homeowner";
  const isContractor = userRole === "contractor";

  const TABS = [
    { key: "profile", label: "Profile" },
    ...(isContractor ? [{ key: "contractor", label: "Contractor Profile" }] : []),
  ];

  return (
    <div className="min-h-screen pb-8" style={{ background: "#f8f9ff" }}>
      <div className="px-4 pt-7 pb-5 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-gray-400">My Account</p>
          <div className="flex items-center justify-between">
            <h1 className="font-extrabold text-2xl text-gray-900" style={{ fontFamily: FONTS.h }}>
              {displayName}
            </h1>
            <button onClick={signOut}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-semibold transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
        {/* License Alerts */}
        {alerts.length > 0 && (
          <div className="mb-4">
            <LicenseAlertBanner alerts={alerts} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 mb-5 shadow-sm">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.key ? "text-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              style={{ background: tab === t.key ? PRIMARY : "transparent", fontFamily: FONTS.b }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-50">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold text-white" style={{ background: PRIMARY }}>
                {displayName[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-bold text-gray-800" style={{ fontFamily: FONTS.h }}>{displayName || "Set your name"}</p>
                <p className="text-sm text-gray-400">{user.email}</p>
                <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium capitalize">{userRole}</span>
              </div>
            </div>

            <FieldGroup label="Full Name">
              <Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" />
            </FieldGroup>
            <FieldGroup label="Email">
              <Input value={user.email} disabled />
            </FieldGroup>
            <FieldGroup label="Phone Number">
              <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="(954) 555-0000" type="tel" />
            </FieldGroup>

            <button onClick={saveProfile} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60"
              style={{ background: PRIMARY }}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : "Save Changes"}
            </button>
          </div>
        )}

        {tab === "contractor" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-gray-50">
              <Shield className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold text-gray-800" style={{ fontFamily: FONTS.h }}>Contractor Profile</h3>
            </div>



            {[
              { key: "company_name", label: "Company Name", placeholder: "Your business name" },
              { key: "license_number", label: "License Number", placeholder: "State license number" },
              { key: "phone", label: "Phone", placeholder: "(954) 555-0000" },
              { key: "address", label: "Business Address", placeholder: "Street, City, FL" },
            ].map(f => (
              <FieldGroup key={f.key} label={f.label}>
                <Input value={cp[f.key]} onChange={e => setCp(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
              </FieldGroup>
            ))}

            <FieldGroup label="License Type">
              <select value={cp.license_type || ""} onChange={e => setCp(p => ({ ...p, license_type: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-400" style={{ fontFamily: FONTS.b }}>
                <option value="">Select type...</option>
                {["general","electrical","plumbing","mechanical","roofing","specialty"].map(t => (
                  <option key={t} value={t} className="capitalize">{t}</option>
                ))}
              </select>
            </FieldGroup>

            <FieldGroup label="License Expiration">
              <Input type="date" value={cp.license_expiration} onChange={e => setCp(p => ({ ...p, license_expiration: e.target.value }))} />
            </FieldGroup>

            <FieldGroup label="Insurance Provider">
              <Input value={cp.insurance_provider} onChange={e => setCp(p => ({ ...p, insurance_provider: e.target.value }))} placeholder="Insurance company name" />
            </FieldGroup>

            <FieldGroup label="Insurance Expiration">
              <Input type="date" value={cp.insurance_expiration} onChange={e => setCp(p => ({ ...p, insurance_expiration: e.target.value }))} />
            </FieldGroup>

            <button onClick={saveContractor} disabled={savingCp}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm disabled:opacity-60"
              style={{ background: PRIMARY }}>
              {savingCp ? <Loader2 className="w-4 h-4 animate-spin" /> : savedCp ? <><CheckCircle2 className="w-4 h-4" /> Saved</> : "Save Contractor Profile"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}