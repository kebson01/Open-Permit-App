import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const IMAGES = {
  front:      "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/ecd30d709_FrontView.png",
  back:       "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/3119749c5_BackView.png",
  eagle:      "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/4422873fc_EagleEyeView.png",
  commercial: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69ac5571087590fc03d44b73/add3d106a_commercialProperty.png",
};

// Natural image dimensions for each view (width × height in px) — must match SVG viewBox
const IMAGE_DIMS = {
  front:      { w: 1375, h: 750 },
  back:       { w: 1402, h: 768 },
  eagle:      { w: 1366, h: 768 },
  commercial: { w: 1456, h: 816 },
};

// ── FRONT VIEW ZONES (polygon points from SVG viewBox 0 0 1375 750) ──────────
const FRONT_ZONES = [
  { id: "window-1",          label: "Window Replacement",     desc: "Impact windows / retrofit windows",          points: "376,278 477,278 477,366 376,366",                                                                                                                                                                    color: "rgba(59,130,246,0.35)",  stroke: "#3b82f6" },
  { id: "window-2",          label: "Window Replacement",     desc: "Impact windows / retrofit windows",          points: "754,274 884,274 884,357 754,357",                                                                                                                                                                    color: "rgba(59,130,246,0.35)",  stroke: "#3b82f6" },
  { id: "window-3",          label: "Window Replacement",     desc: "Impact windows / retrofit windows",          points: "713,458 869,458 869,569 713,569",                                                                                                                                                                    color: "rgba(59,130,246,0.35)",  stroke: "#3b82f6" },
  { id: "ac-unit",           label: "A/C Replacement",        desc: "Air conditioning change-out (≤5 tons)",      points: "969,575 965,629 1019,642 1069,605 1059,556 1019,548",                                                                                                                                                color: "rgba(14,165,233,0.4)",   stroke: "#0ea5e9" },
  { id: "electrical-panel",  label: "Electrical Service",     desc: "Panel upgrade / service change",             points: "986,473 986,525 1012,527 1011,473",                                                                                                                                                                  color: "rgba(234,179,8,0.5)",    stroke: "#eab308" },
  { id: "concrete-driveway", label: "Driveway (Paver)",       desc: "Paver / concrete driveway installation",     points: "1,583 2,648 327,573 298,550 276,561 183,578 149,580 116,578 92,564",                                                                                                                                  color: "rgba(107,114,128,0.35)", stroke: "#6b7280" },
  { id: "garage-door",       label: "Garage Door",            desc: "Garage door replacement",                    points: "249,439 249,522 288,529 298,547 313,550 319,507 324,500 339,520 338,440",                                                                                                                             color: "rgba(249,115,22,0.35)",  stroke: "#f97316" },
  { id: "solar-panel-1",     label: "Solar Panels",           desc: "Photovoltaic system installation",           points: "581,156 532,212 556,215 536,244 637,244 661,210 630,205 655,178 626,182 642,155",                                                                                                                     color: "rgba(234,179,8,0.45)",   stroke: "#eab308" },
  { id: "solar-panel-2",     label: "Solar Panels",           desc: "Photovoltaic system installation",           points: "724,133 700,160 731,158 709,184 741,183 726,211 755,211 736,243 853,240 875,204 838,202 853,173 820,173 834,149 803,149 816,123",                                                                      color: "rgba(234,179,8,0.45)",   stroke: "#eab308" },
  { id: "roof-1",            label: "Roof / Re-Roof",         desc: "Roofing replacement or repair",              points: "342,347 205,402 341,411",                                                                                                                                                                             color: "rgba(239,68,68,0.3)",    stroke: "#ef4444" },
  { id: "roof-2",            label: "Roof / Re-Roof",         desc: "Roofing replacement or repair",              points: "731,361 674,420 942,431 1100,406 1039,375 922,390 883,366",                                                                                                                                           color: "rgba(239,68,68,0.3)",    stroke: "#ef4444" },
  { id: "roof-3",            label: "Roof / Re-Roof",         desc: "Roofing replacement or repair",              points: "413,150 538,175 641,130 684,139 698,131 822,117 1103,273 930,244 855,244 876,205 842,201 856,173 823,170 837,147 805,147 820,126 716,134 700,158 724,161 711,182 734,185 720,212 749,215 738,254 691,244 638,249 660,206 642,201 656,177 628,178 644,152 583,155 531,215 549,218 519,260", color: "rgba(239,68,68,0.22)", stroke: "#ef4444" },
  { id: "walk-way-1",        label: "Walkway / Sidewalk",     desc: "Concrete paths and sidewalk",                points: "199,602 425,633 202,703 296,725 616,612 522,597 475,618 268,585",                                                                                                                                     color: "rgba(156,163,175,0.35)", stroke: "#9ca3af" },
  { id: "walk-way-2",        label: "Walkway / Sidewalk",     desc: "Concrete paths and sidewalk",                points: "60,750 131,728 216,751",                                                                                                                                                                              color: "rgba(156,163,175,0.35)", stroke: "#9ca3af" },
  { id: "sidewalk",          label: "Walkway / Sidewalk",     desc: "Public sidewalk / curb installation",        points: "1,667 1,700 229,751 431,748",                                                                                                                                                                         color: "rgba(156,163,175,0.28)", stroke: "#9ca3af" },
  { id: "pool",              label: "Pool & Spa",             desc: "New swimming pool / spa installation",       points: "1125,490 1085,508 1078,542 1266,555 1314,503",                                                                                                                                                         color: "rgba(6,182,212,0.35)",   stroke: "#06b6d4" },
  { id: "pool-pump",         label: "Pool Equipment",         desc: "Pump, filter, equipment changes",            points: "1272,530 1342,530 1342,581 1272,581",                                                                                                                                                                  color: "rgba(249,115,22,0.45)",  stroke: "#f97316" },
  { id: "window-4",          label: "Window Replacement",     desc: "Impact windows / retrofit windows",          points: "375,435 376,525 466,533 469,438",                                                                                                                                                                    color: "rgba(59,130,246,0.35)",  stroke: "#3b82f6" },
  { id: "door-front",        label: "Door Replacement",       desc: "Sliding / exterior door installation",       points: "569,438 567,562 637,566 636,435",                                                                                                                                                                    color: "rgba(139,92,246,0.32)",  stroke: "#8b5cf6" },
  { id: "slide-door-front",  label: "Door Replacement",       desc: "Sliding / exterior door installation",       points: "578,286 578,397 636,400 635,344 669,345 671,282",                                                                                                                                                    color: "rgba(139,92,246,0.32)",  stroke: "#8b5cf6" },
  { id: "window-5",          label: "Window Replacement",     desc: "Impact windows / retrofit windows",          points: "1022,283 1033,288 1032,353 1019,357",                                                                                                                                                                color: "rgba(59,130,246,0.35)",  stroke: "#3b82f6" },
  { id: "window-6",          label: "Window Replacement",     desc: "Impact windows / retrofit windows",          points: "1036,442 1048,441 1047,525 1036,535",                                                                                                                                                                color: "rgba(59,130,246,0.35)",  stroke: "#3b82f6" },
  { id: "window-7",          label: "Window Replacement",     desc: "Impact windows / retrofit windows",          points: "1067,440 1065,518 1078,512 1079,435",                                                                                                                                                                color: "rgba(59,130,246,0.35)",  stroke: "#3b82f6" },
];

// ── BACK VIEW ZONES (polygon points from SVG viewBox -09 8 1402 745 → normalize to 0 0 1402 768) ──
const BACK_ZONES = [
  { id: "roof-1",       label: "Roof / Re-Roof",         desc: "Roofing replacement or repair",              points: "458,92 176,227 424,238 614,230 841,235 907,233 1085,234 1193,225 978,106 870,113 788,68 672,73 610,103",                                                                                                                                               color: "rgba(239,68,68,0.22)",   stroke: "#ef4444" },
  { id: "roof-2",       label: "Roof / Re-Roof",         desc: "Roofing replacement or repair",              points: "197,332 121,363 396,401 421,397 349,355",                                                                                                                                                                                                              color: "rgba(239,68,68,0.22)",   stroke: "#ef4444" },
  { id: "roof-3",       label: "Roof / Re-Roof",         desc: "Roofing replacement or repair",              points: "1175,311 1172,346 1185,357 1238,337",                                                                                                                                                                                                                 color: "rgba(239,68,68,0.22)",   stroke: "#ef4444" },
  { id: "window-1",     label: "Window Replacement",     desc: "Impact windows / retrofit windows",          points: "314,253 313,324 341,330 339,251",                                                                                                                                                                                                                     color: "rgba(59,130,246,0.35)",  stroke: "#3b82f6" },
  { id: "window-2",     label: "Window Replacement",     desc: "Impact windows / retrofit windows",          points: "292,410 293,498 317,498 315,412",                                                                                                                                                                                                                     color: "rgba(59,130,246,0.35)",  stroke: "#3b82f6" },
  { id: "window-3",     label: "Window Replacement",     desc: "Impact windows / retrofit windows",          points: "468,253 472,344 574,330 575,251",                                                                                                                                                                                                                     color: "rgba(59,130,246,0.35)",  stroke: "#3b82f6" },
  { id: "window-4",     label: "Window Replacement",     desc: "Impact windows / retrofit windows",          points: "361,422 363,510 392,520 391,421",                                                                                                                                                                                                                     color: "rgba(59,130,246,0.35)",  stroke: "#3b82f6" },
  { id: "window-5",     label: "Window Replacement",     desc: "Impact windows / retrofit windows",          points: "907,250 907,329 1031,335 1031,255",                                                                                                                                                                                                                   color: "rgba(59,130,246,0.35)",  stroke: "#3b82f6" },
  { id: "window-6",     label: "Window Replacement",     desc: "Impact windows / retrofit windows",          points: "471,417 473,517 575,490 573,401",                                                                                                                                                                                                                     color: "rgba(59,130,246,0.35)",  stroke: "#3b82f6" },
  { id: "slide-door-1", label: "Door Replacement",       desc: "Sliding / exterior door installation",       points: "619,395 623,499 686,480 686,392 659,388",                                                                                                                                                                                                             color: "rgba(139,92,246,0.32)",  stroke: "#8b5cf6" },
  { id: "slide-door-2", label: "Door Replacement",       desc: "Sliding / exterior door installation",       points: "718,393 716,477 825,495 822,406",                                                                                                                                                                                                                     color: "rgba(139,92,246,0.32)",  stroke: "#8b5cf6" },
  { id: "slide-door-3", label: "Door Replacement",       desc: "Sliding / exterior door installation",       points: "854,410 856,502 839,495 839,410",                                                                                                                                                                                                                     color: "rgba(139,92,246,0.32)",  stroke: "#8b5cf6" },
  { id: "slide-door-4", label: "Door Replacement",       desc: "Sliding / exterior door installation",       points: "909,414 906,509 1011,527 1013,426",                                                                                                                                                                                                                   color: "rgba(139,92,246,0.32)",  stroke: "#8b5cf6" },
  { id: "slide-door-5", label: "Door Replacement",       desc: "Sliding / exterior door installation",       points: "715,246 716,344 827,354 824,250",                                                                                                                                                                                                                     color: "rgba(139,92,246,0.32)",  stroke: "#8b5cf6" },
  { id: "door",         label: "Door Replacement",       desc: "Sliding / exterior door installation",       points: "661,347 689,347 689,249 663,251",                                                                                                                                                                                                                     color: "rgba(139,92,246,0.32)",  stroke: "#8b5cf6" },
  { id: "pool-pump",    label: "Pool Equipment",         desc: "Pump, filter, equipment changes",            points: "251,580 325,580 325,649 251,649",                                                                                                                                                                                                                     color: "rgba(249,115,22,0.45)",  stroke: "#f97316" },
  { id: "ac-unit",      label: "A/C Replacement",        desc: "Air conditioning change-out (≤5 tons)",      points: "154,471 123,480 121,520 188,544 216,534 218,517 221,487",                                                                                                                                                                                             color: "rgba(14,165,233,0.4)",   stroke: "#0ea5e9" },
  { id: "fence-1",      label: "Fence / Gate",           desc: "Fence and gate installation",                points: "1,579 2,645 88,696 309,767 620,766",                                                                                                                                                                                                                  color: "rgba(34,197,94,0.28)",   stroke: "#22c55e" },
  { id: "fence-2",      label: "Fence / Gate",           desc: "Fence and gate installation",                points: "1072,469 1068,527 1089,515 1125,525 1123,561 1170,569 1186,528 1220,534 1231,545 1253,541 1262,536 1273,554 1284,524 1302,515 1317,517 1368,534 1155,764 1175,768 1272,762 1336,683 1354,635 1370,601 1385,583 1402,556 1400,513",                      color: "rgba(34,197,94,0.28)",   stroke: "#22c55e" },
  { id: "fence-3",      label: "Fence / Gate",           desc: "Fence and gate installation",                points: "2,388 2,414 16,414 54,424 76,413 125,408 139,408 145,381 134,372",                                                                                                                                                                                   color: "rgba(34,197,94,0.28)",   stroke: "#22c55e" },
  { id: "pool",         label: "Pool & Spa",             desc: "New swimming pool / spa installation",       points: "625,533 373,619 802,726 973,621 680,568 726,555",                                                                                                                                                                                                     color: "rgba(6,182,212,0.35)",   stroke: "#06b6d4" },
  { id: "paver-patio-1",label: "Patio / Slab",           desc: "Paver patio or concrete slab",               points: "981,555 1003,550 1028,560 1058,536 1027,528 687,477 618,502 280,612 322,642 373,619 625,530 716,553 686,566 966,620 799,726 768,767 909,768 1048,764 1073,743 1001,709 1032,670 1048,616",                                                             color: "rgba(245,158,11,0.18)",  stroke: "#f59e0b" },
  { id: "paver-patio-2",label: "Patio / Slab",           desc: "Paver patio or concrete slab",               points: "374,619 322,647 771,768 799,727",                                                                                                                                                                                                                    color: "rgba(245,158,11,0.18)",  stroke: "#f59e0b" },
  { id: "covered-patio",label: "Covered Patio",          desc: "Covered patio / outdoor structure permit",   points: "686,347 614,362 615,386 1017,428 1065,411 1069,382",                                                                                                                                                                                                 color: "rgba(107,114,128,0.28)", stroke: "#6b7280" },
  { id: "pergola",      label: "Pergola",                desc: "Pergola or gazebo structure",                 points: "803,714 803,484 791,483 792,458 959,402 1231,436 1227,453 1218,456 1211,620 1058,751",                                                                                 color: "rgba(217,119,6,0.35)",   stroke: "#d97706" },
];

// ── EAGLE EYE (FLOOR PLAN) ZONES — kept as rect-based (no source image map) ──
const EAGLE_ZONES = [
  { id: "roof_e",     label: "Roof / Re-Roof",            desc: "Roofing replacement or repair",                points: "0,0 751,0 751,346 0,346",                                                   color: "rgba(239,68,68,0.15)",   stroke: "#ef4444" },
  { id: "kitchen",    label: "Residential Remodel",       desc: "Kitchen remodel / interior renovation",        points: "765,92 1012,92 1012,230 765,230",                                            color: "rgba(245,158,11,0.28)",  stroke: "#f59e0b" },
  { id: "greatroom",  label: "Residential Remodel",       desc: "Great room / living area renovation",          points: "464,92 765,92 765,261 464,261",                                              color: "rgba(245,158,11,0.2)",   stroke: "#f59e0b" },
  { id: "bathroom_e", label: "Plumbing",                  desc: "Bathroom plumbing / fixture installation",     points: "1011,92 1203,92 1203,215 1011,215",                                          color: "rgba(6,182,212,0.32)",   stroke: "#06b6d4" },
  { id: "bedroom1",   label: "Residential Remodel",       desc: "Bedroom renovation",                           points: "82,92 383,92 383,230 82,230",                                                color: "rgba(245,158,11,0.18)",  stroke: "#f59e0b" },
  { id: "bedroom2",   label: "Residential Remodel",       desc: "Bedroom renovation",                           points: "27,353 382,353 382,522 27,522",                                              color: "rgba(245,158,11,0.18)",  stroke: "#f59e0b" },
  { id: "balcony_e",  label: "Residential Addition",      desc: "Upper balcony / deck addition",                points: "464,15 1011,15 1011,107 464,107",                                            color: "rgba(99,102,241,0.28)",  stroke: "#6366f1" },
  { id: "driveway_e", label: "Driveway (Paver)",          desc: "Paver driveway installation",                  points: "1025,77 1366,77 1366,368 1025,368",                                          color: "rgba(107,114,128,0.28)", stroke: "#6b7280" },
  { id: "pool_e",     label: "Pool & Spa",                desc: "New swimming pool / spa installation",         points: "820,476 1366,476 1366,768 820,768",                                          color: "rgba(6,182,212,0.32)",   stroke: "#06b6d4" },
  { id: "pdeck_e",    label: "Pool Deck",                 desc: "Pool deck construction",                       points: "751,422 1366,422 1366,768 751,768",                                          color: "rgba(245,158,11,0.15)",  stroke: "#f59e0b" },
  { id: "ac_e",       label: "A/C Replacement",           desc: "Air conditioning change-out (≤5 tons)",        points: "0,353 109,353 109,430 0,430",                                                color: "rgba(14,165,233,0.4)",   stroke: "#0ea5e9" },
  { id: "panel_e",    label: "Electrical Service",        desc: "Panel upgrade, service change",                points: "491,322 573,322 573,384 491,384",                                            color: "rgba(234,179,8,0.48)",   stroke: "#eab308" },
  { id: "fence_e",    label: "Fence / Gate",              desc: "Fence and gate installation",                  points: "0,0 55,0 55,768 0,768",                                                      color: "rgba(34,197,94,0.25)",   stroke: "#22c55e" },
  { id: "lawn_e",     label: "Irrigation System",         desc: "Landscape / sprinkler system",                 points: "55,599 765,599 765,768 55,768",                                              color: "rgba(16,185,129,0.22)",  stroke: "#10b981" },
];

// ── COMMERCIAL VIEW ZONES — coords from image-map.net, image 1456×816 ────────
const COMMERCIAL_ZONES = [
  { id: "ev-chargers",       label: "EV Charging Station",        desc: "Electric vehicle charging station installation",    points: "1114,448 876,621 927,655 1114,485",                                                                                color: "rgba(34,197,94,0.45)",   stroke: "#22c55e" },
  { id: "light-pole",        label: "Light Pole / Utility",       desc: "Light pole installation permit",                   points: "1018,310 1045,311 1029,591 1011,591",                                                                              color: "rgba(234,179,8,0.5)",    stroke: "#eab308" },
  { id: "underground-drain", label: "Underground Drainage",       desc: "Underground drainage / stormwater system",         points: "605,580 498,626 661,766 902,767 911,748 722,641",                                                                  color: "rgba(6,182,212,0.45)",   stroke: "#06b6d4" },
  { id: "asphalt",           label: "Asphalt / Milling & Paving", desc: "Asphalt repair, milling & paving",                 points: "334,408 738,280 829,321 428,459",                                                                                  color: "rgba(236,72,153,0.5)",   stroke: "#ec4899" },
  { id: "seal-coat",         label: "Seal Coat & Striping",       desc: "Seal coat and parking lot striping",               points: "415,477 814,325 977,377 661,546 629,534 565,560",                                                                  color: "rgba(14,165,233,0.45)", stroke: "#0ea5e9" },
  { id: "sidewalk-rep",      label: "Sidewalk / Curb",            desc: "Sidewalk repair / curb replacement",               points: "266,427 530,611 569,589 304,410",                                                                                  color: "rgba(163,230,53,0.55)", stroke: "#84cc16" },
  { id: "pavement",          label: "Pavement / Earthwork",       desc: "Pavement construction or earthwork permit",        points: "1210,233 1072,398 1180,439 1088,540 1055,574 1013,767 1276,763 1406,433 1404,335 1322,245",                         color: "rgba(249,115,22,0.4)",   stroke: "#f97316" },
  { id: "utility-boring",    label: "Utility Boring",             desc: "Underground utility boring permit",                points: "120,510 119,584 503,691 503,597 295,525 169,485",                                                                  color: "rgba(139,92,246,0.45)",  stroke: "#8b5cf6" },
  { id: "signs",             label: "Sign Permit",                desc: "Commercial signage installation",                  points: "955,614 952,665 1017,693 1022,630",                                                                                color: "rgba(239,68,68,0.55)",   stroke: "#ef4444" },
];

const LEGENDS = {
  front: [
    { label: "Roof / Re-Roof",       color: "#ef4444" },
    { label: "Solar Panels",         color: "#eab308" },
    { label: "Window Replacement",   color: "#3b82f6" },
    { label: "Door Replacement",     color: "#8b5cf6" },
    { label: "Garage Door",          color: "#f97316" },
    { label: "A/C Replacement",      color: "#0ea5e9" },
    { label: "Electrical Service",   color: "#eab308" },
    { label: "Pool & Spa",           color: "#06b6d4" },
    { label: "Pool Equipment",       color: "#f97316" },
    { label: "Driveway / Walkway",   color: "#6b7280" },
  ],
  back: [
    { label: "Roof / Re-Roof",       color: "#ef4444" },
    { label: "Window Replacement",   color: "#3b82f6" },
    { label: "Door Replacement",     color: "#8b5cf6" },
    { label: "A/C Replacement",      color: "#0ea5e9" },
    { label: "Pool & Spa",           color: "#06b6d4" },
    { label: "Pool Equipment",       color: "#f97316" },
    { label: "Patio / Slab",         color: "#f59e0b" },
    { label: "Covered Patio",        color: "#6b7280" },
    { label: "Pergola",              color: "#d97706" },
    { label: "Fence / Gate",         color: "#22c55e" },
  ],
  eagle: [
    { label: "Roof / Re-Roof",       color: "#ef4444" },
    { label: "Residential Remodel",  color: "#f59e0b" },
    { label: "Plumbing",             color: "#06b6d4" },
    { label: "Electrical Service",   color: "#eab308" },
    { label: "A/C Replacement",      color: "#0ea5e9" },
    { label: "Residential Addition", color: "#6366f1" },
    { label: "Pool & Spa",           color: "#06b6d4" },
    { label: "Pool Deck",            color: "#f59e0b" },
    { label: "Driveway",             color: "#6b7280" },
    { label: "Fence / Gate",         color: "#22c55e" },
    { label: "Irrigation System",    color: "#10b981" },
  ],
};

const COMMERCIAL_LEGEND = [
  { label: "EV Charging Station",        color: "#22c55e" },
  { label: "Light Pole / Utility",       color: "#eab308" },
  { label: "Underground Drainage",       color: "#06b6d4" },
  { label: "Asphalt / Milling & Paving", color: "#1e293b" },
  { label: "Seal Coat & Striping",       color: "#64748b" },
  { label: "Sidewalk / Curb",            color: "#94a3b8" },
  { label: "Pavement / Earthwork",       color: "#f97316" },
  { label: "Utility Boring",             color: "#8b5cf6" },
  { label: "Sign Permit",                color: "#ef4444" },
];

const VIEW_ZONES = { front: FRONT_ZONES, back: BACK_ZONES, eagle: EAGLE_ZONES, commercial: COMMERCIAL_ZONES };

export default function HouseView({ view, showHighlights, onZoneClick }) {
  const [hoveredZone, setHoveredZone] = useState(null);
  const [imgRect, setImgRect] = useState(null);
  const containerRef = useRef(null);

  const zones  = VIEW_ZONES[view]  || FRONT_ZONES;
  const legend = view === "commercial" ? COMMERCIAL_LEGEND : (LEGENDS[view] || LEGENDS.front);
  const imgSrc = IMAGES[view]      || IMAGES.front;
  const dims   = IMAGE_DIMS[view]  || IMAGE_DIMS.front;

  // Compute the actual rendered rect of the image inside object-contain container
  const computeRect = () => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const imgAspect = dims.w / dims.h;
    const conAspect = cw / ch;
    let rw, rh, rx, ry;
    if (imgAspect > conAspect) {
      rw = cw; rh = cw / imgAspect; rx = 0; ry = (ch - rh) / 2;
    } else {
      rh = ch; rw = ch * imgAspect; rx = (cw - rw) / 2; ry = 0;
    }
    setImgRect({ x: rx, y: ry, w: rw, h: rh });
  };

  useEffect(() => {
    computeRect();
    const ro = new ResizeObserver(computeRect);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [view]);

  // Scale polygon points string from image coords to rendered pixel coords
  const scalePoints = (pointsStr) => {
    return pointsStr.trim().split(/\s+/).map(pair => {
      const [px, py] = pair.split(",").map(Number);
      const sx = imgRect.x + (px / dims.w) * imgRect.w;
      const sy = imgRect.y + (py / dims.h) * imgRect.h;
      return `${sx},${sy}`;
    }).join(" ");
  };

  // Compute bounding box center for tooltip placement
  const getBBoxCenter = (pointsStr) => {
    const pairs = pointsStr.trim().split(/\s+/).map(p => p.split(",").map(Number));
    const xs = pairs.map(p => p[0]);
    const ys = pairs.map(p => p[1]);
    return {
      cx: (Math.min(...xs) + Math.max(...xs)) / 2,
      cy: Math.min(...ys),
    };
  };

  return (
    <div className="space-y-4">
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-gray-900 select-none"
        style={{ aspectRatio: "16/9" }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={view}
            src={imgSrc}
            alt={`House ${view} view`}
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onLoad={computeRect}
          />
        </AnimatePresence>

        {/* SVG overlay — perfectly aligned to image via scaled polygon points */}
        {imgRect && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 2 }}
          >
            {zones.map((zone) => {
              const isHovered = hoveredZone === zone.id;
              const visible   = showHighlights || isHovered;
              const scaled    = scalePoints(zone.points);
              const { cx, cy } = getBBoxCenter(zone.points.trim().split(/\s+/).map(p => {
                const [px, py] = p.split(",").map(Number);
                return `${imgRect.x + (px / dims.w) * imgRect.w},${imgRect.y + (py / dims.h) * imgRect.h}`;
              }).join(" "));

              return (
                <g key={zone.id} style={{ pointerEvents: "all", cursor: "pointer" }}
                  onClick={() => onZoneClick(zone.label, zone.desc)}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                >
                  <polygon
                    points={scaled}
                    fill={visible ? zone.color : "transparent"}
                    stroke={visible ? zone.stroke : "transparent"}
                    strokeWidth={isHovered ? 2.5 : 1.5}
                    strokeDasharray={isHovered ? "0" : "5,4"}
                    style={{ transition: "fill 0.15s, stroke 0.15s" }}
                  />
                  {isHovered && (
                    <g>
                      <rect
                        x={cx - 70} y={cy - 34}
                        width={140} height={24}
                        rx={5} ry={5}
                        fill="rgba(0,0,0,0.85)"
                      />
                      <text
                        x={cx} y={cy - 17}
                        textAnchor="middle"
                        fill="white"
                        fontSize={11}
                        fontWeight="600"
                        style={{ pointerEvents: "none", userSelect: "none" }}
                      >
                        {zone.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        <div className="absolute bottom-2 right-3 text-white/60 text-xs pointer-events-none drop-shadow" style={{ zIndex: 3 }}>
          {showHighlights ? "Click any highlighted zone" : "Hover to discover permit zones"}
        </div>
      </div>

      {/* Legend */}
      {showHighlights && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Permit Zones Legend</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {legend.map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color, opacity: 0.85 }} />
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}