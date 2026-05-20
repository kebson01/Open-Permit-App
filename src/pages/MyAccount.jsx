import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import * as db from "@/lib/db";
import { User, Shield, AlertTriangle, Loader2, CheckCircle2, LogOut } from "lucide-react";

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
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [tab, setTab]                 = useState("profile");
  const [profile, setProfile]         = useState({});
  const [contractorProfile, setContractorProfile] = useState(null);
  const [cpId, setCpId]               = useState(null);
  const [cp, setCp]                   = useState({});
  const [savingCp, setSavingCp]       = useState(false);
  const [savedCp, setSavedCp]         = useState(false);

  useEffect(() => {
    base44.auth.me().then(async u => {
      if (!u) { setLoading(false); return; }
      setCurrentUser(u);
      setProfile({ full_name: u.full_name || "", email: u.email || "" });
      try {
        const records = await db.ContractorProfile.filter({ user_email: u.email });
        if (records && records.length > 0) {
          setContractorProfile(records[0]);
          setCpId(records[0].id);
          setCp(records[0]);
        }
      } catch {}
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    await base44.auth.updateMe({ full_name: profile.full_name });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const saveContractor = async () => {
    setSavingCp(true);
    if (cpId) {
      await db.ContractorProfile.update(cpId, { ...cp, user_email: currentUser.email });
    } else {
      const created = await db.ContractorProfile.create({ ...cp, user_email: currentUser.email });
      setCpId(created.id);
      setContractorProfile(created);
    }
    setSavingCp(false);
    setSavedCp(true);
    setTimeout(() => setSavedCp(false), 2000);
  };

  const licenseExp = daysUntil(cp.license_expiration);
  const insuranceExp = daysUntil(cp.insurance_expiration);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8f9ff" }}>
        <div className="text-center">
          <p className="font-semibold text-gray-600 mb-3">Sign in to view your account</p>
          <button onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="px-6 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: PRIMARY }}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const TABS = [
    { key: "profile", label: "Profile" },
    { key: "contractor", label: "Contractor Profile" },
  ];

  return (
    <div className="min-h-screen pb-8" style={{ background: "#f8f9ff" }}>
      <div className="px-4 pt-7 pb-5 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-gray-400">My Account</p>
          <div className="flex items-center justify-between">
            <h1 className="font-extrabold text-2xl text-gray-900" style={{ fontFamily: FONTS.h }}>
              {currentUser.full_name || currentUser.email}
            </h1>
            <button onClick={() => base44.auth.logout("/")}
              className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 font-semibold transition-colors">
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">{currentUser.email}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-5">
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
                {currentUser.full_name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <p className="font-bold text-gray-800" style={{ fontFamily: FONTS.h }}>{currentUser.full_name || "Set your name"}</p>
                <p className="text-sm text-gray-400">{currentUser.email}</p>
                <span className="inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium capitalize">{currentUser.role || "user"}</span>
              </div>
            </div>

            <FieldGroup label="Full Name">
              <Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" />
            </FieldGroup>
            <FieldGroup label="Email">
              <Input value={currentUser.email} disabled />
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

            {/* Expiration warnings */}
            {licenseExp !== null && licenseExp < 60 && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-50 border border-orange-200">
                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-700">
                  <strong>License expires in {licenseExp} day{licenseExp !== 1 ? "s" : ""}</strong> — update before it expires.
                </p>
              </div>
            )}
            {insuranceExp !== null && insuranceExp < 60 && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">
                  <strong>Insurance expires in {insuranceExp} day{insuranceExp !== 1 ? "s" : ""}</strong> — update before it expires.
                </p>
              </div>
            )}

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