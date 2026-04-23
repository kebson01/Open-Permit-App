import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AIDrawer from "../components/ai/AIDrawer";
import { ArrowRight, Sparkles, MousePointerClick, DollarSign, Building2, Upload, CalendarCheck, HeadphonesIcon, MapPin, ChevronDown, Home as HomeIcon } from "lucide-react";

const JURISDICTIONS = ["Weston", "Coral Springs", "Fort Lauderdale", "Hollywood", "Cooper City"];

const AI_CHIPS = [
  "What permits do I need to add a room?",
  "How much does a pool permit cost?",
  "Do I need a fence permit?",
  "Check my property zoning",
  "Solar panel requirements",
];

const HOW_IT_WORKS = [
  {
    num: "1",
    title: "Identify your permit",
    body: "Enter your address and project details. We automatically scan municipal databases to determine exactly which permits and codes apply to your property.",
  },
  {
    num: "2",
    title: "Estimate your costs",
    body: "No more guessing. Get a detailed breakdown of application fees, impact fees, and processing costs before you spend a single dollar.",
  },
  {
    num: "3",
    title: "Gather your documents",
    body: "We generate a custom checklist of required site plans, surveys, and certifications. Upload them directly or share the list with your architect.",
  },
];

const TOOLKIT = [
  { icon: MousePointerClick, title: "Identify the permit you need", body: "AI-driven search through 500+ permit types based on your specific project description and location.", page: "PermitGuide" },
  { icon: DollarSign,        title: "Estimate costs in advance",    body: "Accurate fee calculation including city, county, and state surcharges to help budget your construction project.", page: "FeeCalculator" },
  { icon: Building2,         title: "Search any property",          body: "View historical permit data, zoning designations, and outstanding violations for any parcel in South Florida.", page: "PropertyGuide" },
  { icon: Upload,            title: "Digital submissions",          body: "Apply for permits online without visiting City Hall. Securely upload blueprints and track approval status in real-time.", page: "ProjectDashboard" },
  { icon: CalendarCheck,     title: "Schedule inspections",         body: "Book on-site or virtual inspections with a single click and receive notifications when the inspector is en route.", page: "ProjectDashboard" },
  { icon: HeadphonesIcon,    title: "Expert consultation",          body: "Connect with local planners and permit technicians for complex projects requiring specialized zoning variances.", page: "ProjectDashboard" },
];

export default function Home() {
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInitialMessage, setAiInitialMessage] = useState("");
  const [jurisdiction, setJurisdiction] = useState("Fort Lauderdale");
  const [propertyType, setPropertyType] = useState("residential");
  const [customQuestion, setCustomQuestion] = useState("");

  const handleAsk = (msg) => {
    setAiInitialMessage(msg);
    setAiOpen(true);
  };

  const handleCustomAsk = (e) => {
    e.preventDefault();
    if (customQuestion.trim()) handleAsk(customQuestion.trim());
  };

  return (
    <div className="pb-20 md:pb-0" style={{ backgroundColor: "#f9f9fc" }}>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #001a48 0%, #002d72 60%, #005db6 100%)", minHeight: 420 }}>
        {/* Background image overlay */}
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=80')",
          backgroundSize: "cover", backgroundPosition: "center"
        }} />

        <div className="relative max-w-6xl mx-auto px-5 py-14 md:py-20">
          <div className="md:grid md:grid-cols-2 md:gap-16 md:items-center">

            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5"
                style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "#b1c5ff", border: "1px solid rgba(177,197,255,0.3)" }}>
                🏛️ Official Municipal Portal
              </div>

              <h1 className="font-bold leading-tight mb-4" style={{ color: "#ffffff", fontSize: "clamp(28px, 4vw, 46px)", letterSpacing: "-0.5px" }}>
                Permits made simple for{" "}
                <span style={{ color: "#63a1ff" }}>South Florida</span>
              </h1>

              <p className="mb-8" style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, lineHeight: 1.7, maxWidth: 460 }}>
                Navigate complex zoning codes and building requirements with our intelligent permit assistant. Fast, transparent, and built for residents.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to={createPageUrl("PermitGuide")}
                  className="inline-flex items-center gap-2 font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: "#3B82F6", color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14 }}>
                  Start Planning Your Permit
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to={createPageUrl("FeeCalculator")}
                  className="inline-flex items-center gap-2 font-semibold transition-all hover:bg-white/10"
                  style={{ backgroundColor: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)", padding: "12px 24px", borderRadius: 8, fontSize: 14 }}>
                  Estimate Costs
                </Link>
              </div>
            </div>

            {/* Right — jurisdiction card */}
            <div className="hidden md:block mt-10 md:mt-0">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm ml-auto">
                {/* Tabs */}
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1 mb-5">
                  <button className="flex-1 py-2 rounded-lg text-xs font-semibold bg-white text-blue-700 shadow-sm">Florida</button>
                  <button className="flex-1 py-2 rounded-lg text-xs font-semibold text-gray-500">Broward County</button>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Select Your Jurisdiction</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={jurisdiction}
                      onChange={e => setJurisdiction(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    >
                      {JURISDICTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Project Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPropertyType("residential")}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        propertyType === "residential" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <HomeIcon className="w-5 h-5" />
                      Residential
                    </button>
                    <button
                      onClick={() => setPropertyType("commercial")}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        propertyType === "commercial" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                      Commercial
                    </button>
                  </div>
                </div>

                <Link
                  to={`${createPageUrl("PermitGuide")}?city=${encodeURIComponent(jurisdiction)}&propertyType=${propertyType}`}
                  className="block w-full text-center font-semibold py-3 rounded-xl text-white transition-opacity hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #001a48 0%, #005db6 100%)" }}
                >
                  Find Permit Requirements
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile card */}
          <div className="md:hidden mt-8 bg-white rounded-2xl p-5 shadow-xl">
            <div className="mb-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">Select Jurisdiction</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={jurisdiction}
                  onChange={e => setJurisdiction(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white appearance-none focus:outline-none"
                >
                  {JURISDICTIONS.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {["residential", "commercial"].map(t => (
                <button key={t} onClick={() => setPropertyType(t)}
                  className={`py-2.5 rounded-xl border-2 text-xs font-semibold capitalize transition-all ${
                    propertyType === t ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"
                  }`}>{t}</button>
              ))}
            </div>
            <Link
              to={`${createPageUrl("PermitGuide")}?city=${encodeURIComponent(jurisdiction)}&propertyType=${propertyType}`}
              className="block w-full text-center font-semibold py-3 rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #001a48 0%, #005db6 100%)" }}
            >
              Find Permit Requirements
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI SECTION ── */}
      <section className="py-14 md:py-16 px-5 text-center" style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-3xl mx-auto">
          <p className="font-semibold uppercase tracking-widest text-xs mb-3" style={{ color: "#3B82F6" }}>SMART ASSISTANCE</p>
          <h2 className="font-bold mb-2" style={{ color: "#1a1c1e", fontSize: "clamp(22px, 3vw, 30px)" }}>Not sure where to start? Just ask.</h2>
          <p className="mb-8" style={{ color: "#444651", fontSize: 15, lineHeight: 1.65 }}>
            Get instant clarity on complex requirements. Our AI assistant is trained on local municipal codes.
          </p>

          {/* Chips */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {AI_CHIPS.map(chip => (
              <button
                key={chip}
                onClick={() => handleAsk(chip)}
                className="px-4 py-2 rounded-full text-sm font-medium border transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800"
                style={{ borderColor: "#c4c6d2", color: "#444651", backgroundColor: "#f3f3f6" }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Custom question input */}
          <form onSubmit={handleCustomAsk} className="flex items-center gap-2 max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
            <input
              type="text"
              value={customQuestion}
              onChange={e => setCustomQuestion(e.target.value)}
              placeholder="Ask a custom question..."
              className="flex-1 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={!customQuestion.trim()}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white disabled:opacity-40 transition-opacity"
              style={{ background: "#3B82F6" }}
            >
              Ask
            </button>
          </form>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-14 md:py-16 px-5" style={{ backgroundColor: "#f3f3f6" }}>
        <div className="max-w-5xl mx-auto md:grid md:grid-cols-2 md:gap-16 md:items-start">

          {/* Left text */}
          <div className="mb-10 md:mb-0">
            <h2 className="font-bold mb-3" style={{ color: "#1a1c1e", fontSize: "clamp(22px, 3vw, 32px)", lineHeight: 1.2 }}>
              Streamlined and<br />transparent.
            </h2>
            <p className="mb-5" style={{ color: "#444651", fontSize: 15, lineHeight: 1.7 }}>
              We've broken down the bureaucratic process into three simple steps to get your project moving faster.
            </p>
            <Link to={createPageUrl("PermitGuide")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:underline">
              Learn about our methodology <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {HOW_IT_WORKS.map(step => (
              <div key={step.num} className="flex gap-5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 mt-0.5"
                  style={{ backgroundColor: "#dae2ff", color: "#001a48" }}>
                  {step.num}
                </div>
                <div>
                  <p className="font-bold mb-1" style={{ color: "#1a1c1e", fontSize: 15 }}>{step.title}</p>
                  <p style={{ color: "#444651", fontSize: 13, lineHeight: 1.65 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOLKIT ── */}
      <section className="py-14 md:py-16 px-5" style={{ backgroundColor: "#ffffff" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-bold mb-2" style={{ color: "#1a1c1e", fontSize: "clamp(22px, 3vw, 30px)" }}>The complete permit toolkit.</h2>
            <p style={{ color: "#444651", fontSize: 15 }}>Everything you need to navigate local government services from one unified dashboard.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TOOLKIT.map(item => (
              <Link
                key={item.title}
                to={createPageUrl(item.page)}
                className="block p-5 rounded-2xl border transition-all hover:shadow-md hover:border-blue-200 group"
                style={{ borderColor: "#e8e8ea", backgroundColor: "#f9f9fc", textDecoration: "none" }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{ backgroundColor: "#eeeef0" }}>
                  <item.icon className="w-5 h-5 group-hover:text-blue-600 transition-colors" style={{ color: "#444651" }} />
                </div>
                <p className="font-bold mb-1 leading-snug" style={{ color: "#1a1c1e", fontSize: 13 }}>{item.title}</p>
                <p style={{ color: "#747782", fontSize: 11, lineHeight: 1.6 }}>{item.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-14 px-5" style={{ background: "linear-gradient(135deg, #001a48 0%, #002d72 100%)" }}>
        <div className="max-w-4xl mx-auto md:flex md:items-center md:justify-between gap-8">
          <div className="mb-6 md:mb-0">
            <h2 className="font-bold mb-2" style={{ color: "#ffffff", fontSize: "clamp(20px, 3vw, 28px)" }}>
              Ready to start your project?
            </h2>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
              Join 2,400+ residents and contractors who have simplified their permit process this year.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link to={createPageUrl("PermitGuide")}
              className="inline-flex items-center gap-2 font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#3B82F6", color: "#fff", padding: "12px 24px", borderRadius: 8, fontSize: 14 }}>
              Get Started Now
            </Link>
            <Link to={createPageUrl("FeeCalculator")}
              className="inline-flex items-center gap-2 font-semibold transition-all hover:bg-white/10"
              style={{ backgroundColor: "transparent", color: "#fff", border: "1.5px solid rgba(255,255,255,0.3)", padding: "12px 24px", borderRadius: 8, fontSize: 14 }}>
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* AI Drawer */}
      <AIDrawer
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        currentPageName="Home"
        initialMessage={aiInitialMessage}
      />
    </div>
  );
}