import React from "react";
import { X, AlertTriangle, CheckCircle, Info, Phone, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

const ZONE_DETAILS = {
  "front-setback": {
    title: "Front Yard Setback",
    typical: "Typically 20–25 feet from front property line",
    what_it_means: "The minimum required distance a structure must be from the front property line (the side facing the street). This creates a consistent street appearance and ensures public safety.",
    cannot_do: [
      "Build a house addition, garage, or shed in this zone",
      "Construct a fence taller than 4 feet (varies by city)",
      "Park an RV or commercial vehicle permanently",
      "Install a permanent above-ground pool"
    ],
    can_do: [
      "Plant trees, shrubs, and landscaping",
      "Install a driveway or walkway",
      "Place a mailbox, lamppost, or decorative element",
      "Build a fence under the allowed height limit"
    ],
    where_to_find: "City Zoning Code, Building/Planning Department",
    tip: "Setback requirements vary by zoning district. Always verify your specific parcel's requirements before planning any project."
  },
  "rear-setback": {
    title: "Rear Yard Setback",
    typical: "Typically 10–15 feet from rear property line",
    what_it_means: "The minimum distance any structure must maintain from the rear property line. This protects neighbor privacy, allows light and air, and preserves drainage flow at the rear of lots.",
    cannot_do: [
      "Build a permanent structure (addition, guest house) in this zone",
      "Install a pool that crosses into the setback",
      "Place a large storage shed (small detached accessory structures may be allowed)"
    ],
    can_do: [
      "Build a fence up to the allowed height",
      "Landscape and plant trees",
      "Install an irrigation system",
      "Place small portable storage structures (check size limits)"
    ],
    where_to_find: "City Zoning Code, Building Department",
    tip: "A small accessory structure (shed) may be allowed within the rear setback if it meets size and height limits — always confirm with your city first."
  },
  "side-setback": {
    title: "Side Yard Setback",
    typical: "Typically 5–7.5 feet from each side property line",
    what_it_means: "The required distance between a structure and the side property lines. Side setbacks ensure access for emergency services, allow for drainage between homes, and protect neighbor privacy.",
    cannot_do: [
      "Build any permanent structure right up to the property line",
      "Extend your driveway slab past the setback without approval",
      "Install a pool within the setback area"
    ],
    can_do: [
      "Build a fence on or near the property line (check local rules)",
      "Plant trees and shrubs",
      "Run utility lines with a permit"
    ],
    where_to_find: "City Zoning Code, Survey / Plat Documents",
    tip: "Corner lots often have larger setbacks on the street-facing side. Check if your lot is a corner lot, as different rules apply."
  },
  "building-envelope": {
    title: "Building Envelope (Buildable Area)",
    typical: "The area remaining after all setbacks are applied",
    what_it_means: "The building envelope is the area of your lot where structures are allowed to be built. It is calculated by subtracting all setback requirements and easements from your total lot area. Not every inch of the envelope can be built on — lot coverage limits also apply.",
    cannot_do: [
      "Exceed the maximum lot coverage percentage (typically 40–50%)",
      "Build over drainage or utility easements even if inside the envelope",
      "Ignore height restrictions (maximum building height limits still apply)"
    ],
    can_do: [
      "Construct the main dwelling, additions, and accessory structures within this area",
      "Install pools, patios, and decks (subject to individual setback rules)",
      "Build up to the maximum allowed height for your zoning district"
    ],
    where_to_find: "City Zoning Code, Survey, Building Department",
    tip: "Lot coverage rules limit how much of your buildable area can be covered by impervious surfaces. Ask about 'maximum impervious coverage' for your property."
  },
  "rear-utility-easement": {
    title: "Rear Utility Easement",
    typical: "Typically 5–7.5 feet along rear property line",
    what_it_means: "A corridor of land at the rear of the property where utility companies (FPL, cable, water, sewer) have the legal right to install and maintain buried or overhead utilities. You own this land but cannot restrict utility access.",
    cannot_do: [
      "Build any permanent structure (shed, fence post footings, walls)",
      "Plant large trees that could interfere with utilities",
      "Fill, grade, or alter the land that affects utility access",
      "Install a pool or patio slab in this area"
    ],
    can_do: [
      "Landscape with grass, small plants, or low groundcover",
      "Install a fence (posts must not interfere with buried lines)",
      "Maintain the area, mow and trim vegetation"
    ],
    where_to_find: "Recorded Plat, Title Search, County Property Appraiser",
    tip: "Easements run with the land — they were recorded when the subdivision was created. They don't disappear if you build over them, and you may be required to remove structures at your expense."
  },
  "fpl-easement": {
    title: "Electric / FPL Power Easement",
    typical: "Typically 5 feet along side property line",
    what_it_means: "A strip of land where Florida Power & Light (FPL) or another electric utility has the right to install and maintain power lines, poles, and equipment. This is one of the most commonly misunderstood easements.",
    cannot_do: [
      "Plant trees that will grow into power lines",
      "Build a structure (permanent or semi-permanent)",
      "Install a fence that blocks utility vehicle access",
      "Grade or fill in a way that buries existing equipment"
    ],
    can_do: [
      "Install low groundcover plants (under 5 ft mature height)",
      "Maintain grass and low vegetation",
      "Walk through and use the area casually"
    ],
    where_to_find: "Recorded Plat, FPL Easement Records, County Records",
    tip: "If you plant a tree in an FPL easement and it later conflicts with power lines, FPL will remove or trim it — often at your expense and without notice."
  },
  "drainage-easement": {
    title: "Drainage Easement",
    typical: "Typically 5–15 feet along rear or side property line",
    what_it_means: "A legally recorded corridor that allows stormwater to flow across your property. It may be a natural drainage path or an engineered swale. The city or county holds the right to maintain and access this drainage corridor.",
    cannot_do: [
      "Fill, block, or redirect the drainage path",
      "Build a structure over or in the easement",
      "Install a pool, deck, or patio slab in this area",
      "Plant trees whose roots could damage drainage infrastructure"
    ],
    can_do: [
      "Maintain the area and keep it clear of debris",
      "Install low-lying groundcover that doesn't impede flow",
      "Request a drainage study if you believe the easement is incorrectly positioned"
    ],
    where_to_find: "Recorded Plat, County Engineering Department, Title Search",
    tip: "If you fill in a drainage easement and it causes flooding on neighboring properties, you could be held legally liable for damages."
  },
  "right-of-way": {
    title: "Public Right-of-Way (ROW)",
    typical: "Typically 5–10 feet beyond the sidewalk toward your home",
    what_it_means: "Land owned by the government (city or county) that extends from the centerline of the street to a recorded boundary near the front of private lots. Your yard may actually extend into the ROW, but you cannot restrict public access or build permanent structures there.",
    cannot_do: [
      "Build any permanent structure in the ROW",
      "Block access with fencing or landscaping walls",
      "Dig or alter the ROW without a permit",
      "Place storage containers or commercial vehicles permanently"
    ],
    can_do: [
      "Landscape with city approval (some cities require a ROW landscape permit)",
      "Install a mailbox or utility connection (permitted)",
      "Repair your driveway apron (with a permit in most cities)"
    ],
    where_to_find: "City Engineering or Public Works Department, Plat Records",
    tip: "The ROW typically includes the sidewalk, street, and a buffer strip. Even though you may maintain this area, the government owns it and has priority access."
  },
  "access-easement": {
    title: "Access / Driveway Easement",
    typical: "Varies — usually matches driveway width",
    what_it_means: "A recorded legal access path that allows you (or another party) to cross a portion of property to reach a road, garage, or shared area. This is common on flag lots or properties with shared driveways.",
    cannot_do: [
      "Block or obstruct the access path",
      "Build a permanent structure in the easement corridor",
      "Revoke access rights without legal process"
    ],
    can_do: [
      "Pave or maintain the access path",
      "Landscape around the corridor without blocking it",
      "Negotiate shared maintenance agreements with neighbors"
    ],
    where_to_find: "Recorded Plat, Title Commitment, Deed Documents",
    tip: "Access easements are especially common in older neighborhoods with non-standard lot configurations. Always check your title before purchasing property."
  },
  "zone-ae": {
    title: "FEMA Flood Zone AE – High Risk",
    typical: "1% annual chance of flooding (100-year floodplain)",
    what_it_means: "Zone AE is a high-risk flood area with a 1% annual chance of flooding (the '100-year flood'). Properties here have special building requirements and flood insurance is typically mandatory for federally backed mortgages.",
    cannot_do: [
      "Build below the Base Flood Elevation (BFE) without a variance",
      "Add fill that could displace floodwater onto neighboring properties",
      "Substantially improve a structure without elevating it to BFE"
    ],
    can_do: [
      "Build above the BFE with proper engineered plans",
      "Apply for a Letter of Map Amendment (LOMA) if elevation is above BFE",
      "Install flood vents in enclosed areas below BFE",
      "Use flood-resistant materials below the BFE"
    ],
    where_to_find: "FEMA Flood Map (msc.fema.gov), City Engineering / Floodplain Manager",
    tip: "Your Elevation Certificate shows the lowest floor elevation of your structure compared to the BFE. If your floor is above BFE, you may qualify for lower flood insurance rates."
  },
  "zone-ah": {
    title: "FEMA Flood Zone AH – Ponding Flood Hazard",
    typical: "Areas of shallow flooding (1–3 feet ponding depth)",
    what_it_means: "Zone AH indicates areas with shallow ponding flooding of 1–3 feet. These areas flood during heavy rain events and stay wet for longer periods. Building requirements are similar to Zone AE but tailored to ponding conditions.",
    cannot_do: [
      "Fill the lot without a drainage analysis and permits",
      "Build at elevations below the BFE",
      "Block natural drainage patterns on your lot"
    ],
    can_do: [
      "Install French drains and retention features with permits",
      "Build above the BFE with appropriate drainage design",
      "Request an elevation certificate to document your floor elevation"
    ],
    where_to_find: "FEMA Flood Maps, City Engineering Department",
    tip: "Ponding zones often require engineered drainage plans for any improvements. Contact the city's engineering department before any grading or filling."
  },
  "zone-x": {
    title: "FEMA Flood Zone X – Minimal Flood Risk",
    typical: "0.2% annual chance of flooding or less",
    what_it_means: "Zone X properties are outside the 100-year floodplain and have minimal flood risk. Flood insurance is typically not required but is still available and recommended. Most standard building codes apply without special flood provisions.",
    cannot_do: [],
    can_do: [
      "Build under standard building code without special flood requirements",
      "Voluntarily purchase flood insurance at reduced rates",
      "Build finished living space at any elevation above grade"
    ],
    where_to_find: "FEMA Flood Maps (msc.fema.gov)",
    tip: "Zone X doesn't mean flood-proof. About 25% of flood insurance claims come from outside high-risk flood zones. Consider voluntary flood coverage especially in South Florida."
  },
  "floodway": {
    title: "Regulatory Floodway – No Development",
    typical: "Active water channel — strictly regulated",
    what_it_means: "The floodway is the channel of a river, stream, or drainage canal and the adjacent land that must be kept clear to carry the base flood flow. It is the most strictly regulated flood zone. Development is essentially prohibited.",
    cannot_do: [
      "Build any structure in the floodway",
      "Fill, grade, or excavate without a floodway encroachment analysis",
      "Install fences, retaining walls, or impervious surfaces",
      "Place any obstruction that could raise flood levels"
    ],
    can_do: [
      "Maintain open grass areas",
      "Install permitted drainage infrastructure (with engineering review)"
    ],
    where_to_find: "FEMA FIRM Maps, City/County Floodplain Administrator",
    tip: "Any development in a floodway requires a No-Rise Certification from a licensed engineer, showing the proposed work will not raise the base flood elevation."
  },
  "bfe-line": {
    title: "Base Flood Elevation (BFE)",
    typical: "Elevation to which floodwater is expected to rise in a 100-year flood event",
    what_it_means: "The BFE is the regulatory flood elevation used to determine required building heights in flood zones. All new construction in Zone AE and AH must have the lowest floor at or above the BFE. Many cities add freeboard (extra height) above BFE for additional safety.",
    cannot_do: [
      "Build a new habitable floor below the BFE in a special flood hazard area",
      "Substantially renovate an existing structure without elevating to BFE"
    ],
    can_do: [
      "Build at or above the BFE to meet code and reduce flood insurance costs",
      "Elevate utilities (HVAC, electrical panels) above BFE",
      "Apply for a LOMA if your natural ground elevation is above the BFE"
    ],
    where_to_find: "Elevation Certificate, FEMA FIRM Maps, City Engineering",
    tip: "Every foot above the BFE you build can significantly reduce your flood insurance premium. Ask your floodplain manager about the city's freeboard requirements."
  },
  "impervious-roof": {
    title: "Impervious Surface – Roof Coverage",
    typical: "Roof area contributes 100% to impervious surface calculations",
    what_it_means: "Impervious surfaces are areas that prevent rain from soaking into the ground — your roof is the largest impervious surface on most residential lots. Cities limit the percentage of your lot that can be covered by impervious surfaces to control stormwater runoff.",
    cannot_do: [
      "Exceed the maximum impervious coverage percentage for your lot",
      "Add a room addition without a stormwater review if near the impervious limit",
      "Install large concrete slabs that push you over the allowed coverage"
    ],
    can_do: [
      "Install a rain barrel or cistern to capture roof runoff",
      "Add a green roof or rooftop garden to reduce effective imperviousness",
      "Use pervious paving materials for driveways and walkways"
    ],
    where_to_find: "City Zoning Code (Impervious Coverage Section), Engineering Department",
    tip: "In South Florida, maximum impervious coverage is typically 40–55% of lot area for residential properties. Check your city's code before adding any structure."
  },
  "impervious-drive": {
    title: "Impervious Surface – Driveway & Pavement",
    typical: "Adds to total impervious coverage calculation",
    what_it_means: "Driveways, walkways, patios, and any hardscape count toward your impervious surface total. When combined with roof coverage, if the total exceeds the allowed percentage, you need special stormwater management (retention, swales, or pervious paving).",
    cannot_do: [
      "Expand the driveway without checking your remaining impervious coverage allowance",
      "Convert lawn areas to concrete without a permit if near the coverage limit",
      "Use solid concrete for large patios without a stormwater review"
    ],
    can_do: [
      "Use permeable pavers, gravel, or turf blocks for driveways and paths",
      "Apply for a stormwater management plan to allow more coverage",
      "Install a dry retention area to offset added impervious surface"
    ],
    where_to_find: "City Engineering / Planning Department",
    tip: "Permeable paving (pervious concrete, grass pavers) often counts as 0% or 50% impervious in calculations, allowing you more coverage flexibility."
  },
  "drainage-swale": {
    title: "Drainage Swale",
    typical: "Usually 3–8 feet wide along property sides or rear",
    what_it_means: "A shallow, graded channel designed to move stormwater runoff from your yard to the street or storm sewer system. Swales are a critical part of neighborhood drainage and are often located at the edges of lots. They must remain clear and functional.",
    cannot_do: [
      "Fill in or flatten the swale",
      "Install fences, structures, or concrete over the swale",
      "Block or redirect the water flow",
      "Plant trees or large shrubs in the swale bottom"
    ],
    can_do: [
      "Maintain grass in the swale and keep it mowed",
      "Repair erosion in the swale (may need a permit)",
      "Plant low groundcover that allows water flow",
      "Install a culvert pipe with proper permits and engineering review"
    ],
    where_to_find: "City Engineering / Public Works Department",
    tip: "If your swale is always wet or backed up, contact the city's engineering department. It may be a maintenance issue with the downstream drainage system."
  },
  "retention-area": {
    title: "Retention / Detention Area",
    typical: "Designed for specific stormwater volume capacity",
    what_it_means: "A designed area that temporarily holds stormwater runoff to prevent flooding and allow controlled release. Retention areas hold water permanently (wet pond), while detention areas drain completely between storm events (dry pond). These are often required for larger developments.",
    cannot_do: [
      "Fill, grade, or alter the retention area without engineering approval",
      "Build structures in or adjacent to the retention area",
      "Redirect drainage away from the retention area"
    ],
    can_do: [
      "Maintain the area and keep vegetation trimmed",
      "Install decorative plants around the perimeter",
      "Report drainage problems to the engineering department"
    ],
    where_to_find: "City Engineering Department, South Florida Water Management District (SFWMD)",
    tip: "Most retention areas in South Florida are also regulated by the SFWMD under a surface water management permit. Any modifications typically require SFWMD approval in addition to local permits."
  },
  "pervious-lawn": {
    title: "Pervious Area (Lawn / Green Space)",
    typical: "Open grass or landscaped areas not covered by hard surfaces",
    what_it_means: "Pervious areas are landscape surfaces that allow rainwater to infiltrate into the ground. Maintaining pervious lawn areas is required to meet minimum open space requirements and manage stormwater. Converting lawn to concrete can trigger stormwater permits.",
    cannot_do: [
      "Convert large portions of lawn to concrete or pavers without checking impervious limits",
      "Grade the lawn in a way that directs water onto neighboring properties",
      "Remove all ground cover, creating bare soil that causes erosion"
    ],
    can_do: [
      "Landscape, plant gardens, install sprinkler systems",
      "Install raised garden beds",
      "Add pervious paving (gravel, stepping stones) without significantly affecting drainage"
    ],
    where_to_find: "City Zoning Code (Open Space / Landscaping Section)",
    tip: "Most cities require a minimum percentage of your lot to remain open/pervious (often 30–40%). This is called 'minimum open space' or 'minimum green area' requirement."
  },
  "storm-drain": {
    title: "Storm Drain / Catch Basin",
    typical: "City infrastructure — at street / curb level",
    what_it_means: "Storm drains collect surface runoff from streets, driveways, and yards and direct it into the underground stormwater system or nearby canals. They are city infrastructure and cannot be blocked, altered, or connected to without permits.",
    cannot_do: [
      "Block or cover a storm drain opening",
      "Connect your sump pump or drainage to the storm system without a permit",
      "Dump waste (oil, paint, chemicals) into storm drains — this is illegal",
      "Alter the inflow structure without city engineering approval"
    ],
    can_do: [
      "Report blockages or damaged storm drains to Public Works",
      "Keep the area around storm drains clear of debris",
      "Connect to the storm system with proper engineering plans and permits"
    ],
    where_to_find: "City Public Works / Engineering Department",
    tip: "Illegal dumping into storm drains is a federal violation under the Clean Water Act. Storm drains typically lead directly to canals and waterways with no treatment."
  },
};

export default function ZoneDetailPopup({ zoneId, zoneLabel, onClose }) {
  const details = ZONE_DETAILS[zoneId];

  if (!details) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{zoneLabel}</h2>
          <p className="text-gray-500 text-sm">Detailed information for this zone is being compiled. Contact your local Building or Engineering department for specific requirements.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl px-6 pt-5 pb-4 border-b border-gray-100 z-10">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-gray-800 pr-8">{details.title}</h2>
          <p className="text-sm text-blue-700 font-medium mt-0.5">{details.typical}</p>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* What it means */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-start gap-2 mb-1">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-semibold text-blue-800">What This Means</p>
            </div>
            <p className="text-sm text-blue-700 leading-relaxed">{details.what_it_means}</p>
          </div>

          {/* Cannot do */}
          {details.cannot_do && details.cannot_do.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-sm font-semibold text-gray-800">What You Generally CANNOT Do Here</p>
              </div>
              <ul className="space-y-1.5">
                {details.cannot_do.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Can do */}
          {details.can_do && details.can_do.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <p className="text-sm font-semibold text-gray-800">What You Generally CAN Do</p>
              </div>
              <ul className="space-y-1.5">
                {details.can_do.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tip */}
          {details.tip && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Pro Tip</p>
              <p className="text-sm text-amber-800">{details.tip}</p>
            </div>
          )}

          {/* Where to find */}
          <div className="flex items-start gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl p-3">
            <BookOpen className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-semibold text-gray-600">Where to Find This Info: </span>
              {details.where_to_find}
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center pb-1">
            Requirements vary by city and zoning district. Always verify with your local Building or Engineering department.
          </p>
        </div>
      </div>
    </div>
  );
}