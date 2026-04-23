import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STATS = [
  { value: "758K+", label: "PROPERTIES" },
  { value: "122+", label: "PERMIT TYPES" },
  { value: "5", label: "CITIES COVERED" },
  { value: "100%", label: "OFFICIAL SOURCES" },
];

const WHY_CARDS = [
  {
    icon: "visibility",
    title: "Transparency",
    body: "See exactly where your application stands and what requirements remain at every step.",
  },
  {
    icon: "bolt",
    title: "Speed",
    body: "Our automated workflows identify missing documents before you even hit the submit button.",
  },
  {
    icon: "check_circle",
    title: "Accuracy",
    body: "Data synced directly from municipal databases ensures you're always using official guidelines.",
  },
];

const CITIES = [
  {
    name: "Weston",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBBf7fNb5WGo7-nW-VMJeQRSRitPaTWHowgSvyB52vk3cjXwujRRzXezfrE0y48lLGV7sSz9Ctr5ckV0-hKWq8fUxOUWzg2Mr_6JxV91aaqgHf4SP18Oegwrzqr9p4t5_YLuvAl-exGb-_Jh2IUzIO-HnWdX5aodJInNG30YlqTePNWiIbI5hypA2_nRQAwt2je35UclI7eLLOBBHkiGL_LKnH0Xkhpok1oVdY6PMGIFd9csPR8SjyQUfMVivG4-eopSIweAU1hswkF",
  },
  {
    name: "Coral Springs",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtKKIL_sRmD2yBoHbs3zAMSinVvsuQY0ZkUf8ftd07UtGAlUx5VyGYdmVp89JFaXHeZkaoB6brlWQbf4tTub2lHyonbowbV74CR_1AGlQuwKMkd5tZJH36JWIgiiZrG6VvJ_HTwfoLOqy7jpy2HggpovRD87hV8GiD30RIqljOndEEOpaVp7as0aVPAXb4Np60-FkkTlE9lw2aPxAZ6avoyYhN4FkbvnPzC3eFDkvdwUissLKub7VkHYpcrBeS89214fRuUerH3To6",
  },
  {
    name: "Fort Lauderdale",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCjdG5dbfcA2y0kEtd0D6raSi0_lRE5WeO2UIv3mSdAOWBrtQ5F45JZa82Tyghdr_z5O7xpNRytMrx6sEf78kKUpVx0gGZNYYMrSWT1mHC4E9_smBypA2HRHfkeOrLP-qBJyD8bIi47Ig9GC6Z07X0mrbAXA2FUVqqCWxI7CVJ22N3x8ISHRaJgSzpou_O4HUkTSTI6S83uBpvqrxO0pvMpTplpP_6YXyXHIbTLf7BMpiW6r1CvAWiO1zhfg2C_cimKm5ZMNS25A-PT",
  },
  {
    name: "Hollywood",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCmYnml5Ddm29zUxB0LasySmnFZTWkfcXDipPuDFVulQmLxgX5NtE8911tTv0PJjsr6loyYKSjatv62ik9cmK88DpbaqQgIgieRQPtp2YafxrY2QXIfh0yUSTWwwlTa9knjw_RPeRKPqqSDbZ7wmpp5t3WD4sk5GG8apNZEQwyx_tkm_wJcggiNmBOJwmi0VFRClhCMeIRAgurLZFhMuBt90WFtOiazolkfJNp_gA-vTA1mvo7hZqWCVd8BlmC9atZdIsmjJsF0phkS",
  },
  {
    name: "Cooper City",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTyv0eWSE-9mixhvz4wcTYx3CS5-D8CpUgGRq8jpeipPqyFFf4vdkhb6HYfcp1hJabd_do1d0xNBib_C2hMKV6HocyaiEp8C559Oj1ariztP00vmwOiGDSUiWx0P6kQU481souqWzIc76kKRZe21fep73KGVRYZmju72uMIuNb0zM6LZgpSQ4KZycSR3J0rSFGwQwWGOAVt1ZcwXRy8h9zC75nfc0Ctx09mOCSIWvuoQRuKoyETB3k6Lg8uUKT6iD3oWe4tai2R6kZ",
  },
];

const FOOTER_LINKS = [
  { label: "Plan a Permit", page: "PermitGuide" },
  { label: "Estimate Costs", page: "FeeCalculator" },
  { label: "Search Property", page: "PropertyGuide" },
  { label: "My Projects", page: "ProjectDashboard" },
];

function CityCard({ city, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid #e5eeff",
        backgroundColor: "#ffffff",
        cursor: "pointer",
        boxShadow: hovered ? "0 8px 24px rgba(10,25,47,0.14)" : "0 2px 8px rgba(10,25,47,0.06)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "box-shadow 0.18s, transform 0.18s",
      }}
    >
      <div style={{ height: 128, overflow: "hidden" }}>
        <img
          src={city.img}
          alt={city.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transition: "transform 0.25s",
            transform: hovered ? "scale(1.05)" : "scale(1)",
          }}
        />
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#0a192f" }}>{city.name}</div>
        <div style={{ fontSize: 12, color: "#44474d", marginTop: 2 }}>Broward County</div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();

  const goToCity = (cityName) => {
    navigate(createPageUrl("PermitGuide") + `?city=${encodeURIComponent(cityName)}`);
  };

  return (
    <div style={{ fontFamily: "'Public Sans', system-ui, sans-serif", backgroundColor: "#f8f9ff", color: "#0b1c30" }}>

      {/* ── HERO ── */}
      <section
        style={{
          minHeight: 560,
          backgroundImage: `linear-gradient(to top right, rgba(10,25,47,0.92) 40%, rgba(10,25,47,0.55) 100%), url('https://lh3.googleusercontent.com/aida-public/AB6AXuBBf7fNb5WGo7-nW-VMJeQRSRitPaTWHowgSvyB52vk3cjXwujRRzXezfrE0y48lLGV7sSz9Ctr5ckV0-hKWq8fUxOUWzg2Mr_6JxV91aaqgHf4SP18Oegwrzqr9p4t5_YLuvAl-exGb-_Jh2IUzIO-HnWdX5aodJInNG30YlqTePNWiIbI5hypA2_nRQAwt2je35UclI7eLLOBBHkiGL_LKnH0Xkhpok1oVdY6PMGIFd9csPR8SjyQUfMVivG4-eopSIweAU1hswkF')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          alignItems: "center",
          padding: "64px 24px",
        }}
      >
        <div style={{ maxWidth: 600 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 12px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.35)",
              color: "rgba(255,255,255,0.85)",
              fontSize: 12,
              fontWeight: 500,
              marginBottom: 20,
            }}
          >
            Broward County, Florida
          </div>

          <h1
            style={{
              color: "#ffffff",
              fontWeight: 900,
              fontSize: "clamp(28px, 5vw, 46px)",
              lineHeight: 1.15,
              marginBottom: 18,
            }}
          >
            Permits made simple for South Florida
          </h1>

          <p
            style={{
              color: "rgba(255,255,255,0.72)",
              fontSize: 16,
              lineHeight: 1.65,
              marginBottom: 32,
              maxWidth: 520,
            }}
          >
            Your all-in-one guide to navigating building permits in Broward County. Professional clarity for property owners and pros.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              to={createPageUrl("ProjectDashboard")}
              style={{
                padding: "12px 24px",
                borderRadius: 8,
                border: "1.5px solid rgba(255,255,255,0.6)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Start My Project
            </Link>
            <Link
              to={createPageUrl("PropertyGuide")}
              style={{
                padding: "12px 24px",
                borderRadius: 8,
                background: "#ffffff",
                color: "#0a192f",
                fontWeight: 700,
                fontSize: 14,
                textDecoration: "none",
              }}
            >
              Search Property
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section style={{ backgroundColor: "#ffffff", borderBottom: "1px solid #e5eeff" }}>
        <div
          className="home-stats-grid"
          style={{
            maxWidth: 960,
            margin: "0 auto",
            padding: "28px 24px",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 900, color: "#0a192f", lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#44474d", letterSpacing: "0.08em", marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY OPENPERMIT ── */}
      <section style={{ backgroundColor: "#ffffff", padding: "64px 24px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, color: "#0a192f", marginBottom: 14 }}>
              Why OpenPermit?
            </h2>
            <p style={{ fontSize: 15, color: "#44474d", maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>
              Bridging the gap between government complexity and property development through transparency and tech.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 20,
            }}
          >
            {WHY_CARDS.map((card) => (
              <div
                key={card.title}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 16,
                  border: "1px solid #e5eeff",
                  boxShadow: "0 2px 12px rgba(10,25,47,0.07)",
                  padding: "28px 24px",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "#e5eeff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: "#436085", fontSize: 26 }}>
                    {card.icon}
                  </span>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: 17, color: "#0a192f", marginBottom: 8 }}>{card.title}</h3>
                <p style={{ fontSize: 14, color: "#44474d", lineHeight: 1.65 }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CITY SELECTOR ── */}
      <section style={{ backgroundColor: "#f8fafc", padding: "64px 24px" }}>
        <div style={{ maxWidth: 1040, margin: "0 auto" }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: "clamp(22px, 4vw, 32px)", fontWeight: 800, color: "#0a192f", marginBottom: 8 }}>
              Choose Your City
            </h2>
            <p style={{ fontSize: 15, color: "#44474d" }}>
              Select a municipality to see localized guidelines.
            </p>
          </div>

          <div
            className="home-city-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 16,
            }}
          >
            {CITIES.map((city) => (
              <CityCard key={city.name} city={city} onClick={() => goToCity(city.name)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #e5eeff", padding: "40px 24px 80px" }}>
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 32,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#0a192f", marginBottom: 6 }}>OpenPermit</div>
            <p style={{ fontSize: 13, color: "#44474d" }}>© {new Date().getFullYear()} OpenPermit. All rights reserved.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, auto)", gap: "8px 32px" }}>
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.page}
                to={createPageUrl(link.page)}
                style={{ fontSize: 14, color: "#44474d", textDecoration: "none", fontWeight: 500 }}
              >
                {link.label}
              </Link>
            ))}
            <a href="#" style={{ fontSize: 14, color: "#44474d", textDecoration: "none", fontWeight: 500 }}>Privacy Policy</a>
            <a href="#" style={{ fontSize: 14, color: "#44474d", textDecoration: "none", fontWeight: 500 }}>Terms of Service</a>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 640px) {
          .home-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .home-city-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}