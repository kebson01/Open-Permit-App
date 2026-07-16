import { useState, useEffect, useCallback } from "react";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";
import { ClipboardList, Search, Loader2, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

const TABLE = "weston_permit_records";
const PAGE_SIZE = 50;
const TOTAL_COUNT = 138193;

const MODULES = ["Building", "Enforcement", "Planning", "Estoppel", "BusinessTax", "Engineering", "Landscaping", "RentalHousing"];
const NORMALIZED_STATUSES = ["Completed", "In Review", "Active", "Cancelled", "Inactive", "Denied", "Unknown"];

const STATUS_NORMALIZED_STYLES = {
  "Completed":  { bg: "#DCFCE7", color: "#166534" },
  "Active":     { bg: "#EFF6FF", color: "#1D4ED8" },
  "In Review":  { bg: "#FFFBEB", color: "#92400E" },
  "Cancelled":  { bg: "#FEF2F2", color: "#991B1B" },
  "Inactive":   { bg: "#F1F5F9", color: "#475569" },
  "Denied":     { bg: "#FEE2E2", color: "#991B1B" },
  "Unknown":    { bg: "#F1F5F9", color: "#475569" },
};

const MODULE_COLORS = {
  Building:      "bg-blue-100 text-blue-700",
  Planning:      "bg-purple-100 text-purple-700",
  Engineering:   "bg-orange-100 text-orange-700",
  Enforcement:   "bg-red-100 text-red-700",
  Landscaping:   "bg-green-100 text-green-700",
  Estoppel:      "bg-teal-100 text-teal-700",
  BusinessTax:   "bg-amber-100 text-amber-700",
  RentalHousing: "bg-pink-100 text-pink-700",
};

async function fetchRecords({ page, search, filterModule, filterStatus }) {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let url = `${SUPABASE_URL}/rest/v1/${TABLE}?select=*&order=OPEN_DATE.desc&offset=${from}&limit=${PAGE_SIZE}`;

  if (search) {
    const q = search.replace(/'/g, "''");
    url += `&or=(RECORD_ID.ilike.*${q}*,RECORD_NAME.ilike.*${q}*,PARCEL_NBR.ilike.*${q}*)`;
  }
  if (filterModule && filterModule !== "all") {
    url += `&RECORD_MODULE=eq.${encodeURIComponent(filterModule)}`;
  }
  if (filterStatus && filterStatus !== "all") {
    url += `&STATUS_NORMALIZED=eq.${encodeURIComponent(filterStatus)}`;
  }

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "count=exact",
    },
  });

  const count = parseInt(res.headers.get("content-range")?.split("/")[1] || "0", 10);
  const data = await res.json();
  return { records: Array.isArray(data) ? data : [], count };
}

export default function AdminPermitRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterModule, setFilterModule] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [statuses, setStatuses] = useState([]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(0); }, [filterModule, filterStatus]);

  const load = useCallback(async () => {
    setLoading(true);
    const { records: data, count } = await fetchRecords({
      page,
      search: debouncedSearch,
      filterModule,
      filterStatus,
    });
    setRecords(data);
    setTotalCount(count || TOTAL_COUNT);
    // statuses are fixed normalized values — no need to collect dynamically
    setLoading(false);
  }, [page, debouncedSearch, filterModule, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0D2B5E, #0F3575)" }}>
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permit Records</h1>
          <p className="text-gray-500 text-sm">
            Weston municipal permit data ·{" "}
            <span className="font-semibold text-blue-700">{TOTAL_COUNT.toLocaleString()} total records</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search record ID, name, or parcel..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          value={filterModule}
          onChange={e => { setFilterModule(e.target.value); setPage(0); }}
        >
          <option value="all">All Modules</option>
          {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(0); }}
        >
          <option value="all">All Statuses</option>
          {NORMALIZED_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {loading ? "Loading..." : (
            <>
              Showing <span className="font-semibold text-gray-800">{records.length}</span> of{" "}
              <span className="font-semibold text-gray-800">{totalCount.toLocaleString()}</span> records
              {(debouncedSearch || filterModule !== "all" || filterStatus !== "all") && " (filtered)"}
            </>
          )}
        </p>
        {/* Pagination */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:border-blue-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500 px-2">
            Page {page + 1} of {totalPages.toLocaleString()}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages - 1 || loading}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:border-blue-400 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 text-gray-400 py-16">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading records...
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>No records found matching your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "linear-gradient(135deg, #0D2B5E, #0F3575)" }}>
                <tr>
                  {["Record ID", "Name / Description", "Module", "Permit Type", "Status", "Open Date", "Parcel"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/90 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r, i) => (
                  <tr key={r.id ?? i} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-700 whitespace-nowrap">{r.RECORD_ID || "—"}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs">
                      <span className="line-clamp-2">{r.RECORD_NAME || "—"}</span>
                      {r.HAS_OPEN_CODE_CASE === "true" && (
                        <span className="inline-flex items-center gap-1 mt-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                          <AlertTriangle className="w-3 h-3" /> Open Code Case
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${MODULE_COLORS[r.RECORD_MODULE] || "bg-gray-100 text-gray-600"}`}>
                        {r.RECORD_MODULE || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{r.PERMIT_TYPE || "—"}</td>
                    <td className="px-4 py-3">
                      {r.STATUS_NORMALIZED ? (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                          style={{
                            backgroundColor: STATUS_NORMALIZED_STYLES[r.STATUS_NORMALIZED]?.bg || "#F1F5F9",
                            color: STATUS_NORMALIZED_STYLES[r.STATUS_NORMALIZED]?.color || "#475569",
                          }}
                        >
                          {r.STATUS_NORMALIZED}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{r.OPEN_DATE || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{r.PARCEL_NBR || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:border-blue-400 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-sm text-gray-500 px-4">Page {page + 1} of {totalPages.toLocaleString()}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:border-blue-400 transition-colors"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}