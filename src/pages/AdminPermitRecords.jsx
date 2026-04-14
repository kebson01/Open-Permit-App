import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Search, Loader2, AlertTriangle, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const SUPABASE_URL = "https://gbknnjidqpmjrwlooluw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdia25uamlkcXBtanJ3bG9vbHV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NTQzNDIsImV4cCI6MjA5MDIzMDM0Mn0.qwDACgXe3hesxBRQOzP53Hdc44z_UOka1_uYQScyi68";
const TABLE = "weston_permit_records";
const PAGE_SIZE = 50;
const TOTAL_RECORDS = 116873;

const MODULES = ["Building", "Planning", "Engineering", "Enforcement", "Landscaping"];

const MODULE_COLORS = {
  Building:    "bg-blue-100 text-blue-700",
  Planning:    "bg-purple-100 text-purple-700",
  Engineering: "bg-indigo-100 text-indigo-700",
  Enforcement: "bg-red-100 text-red-700",
  Landscaping: "bg-green-100 text-green-700",
};

async function fetchRecords({ page, search, filterModule, filterStatus }) {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let url = `${SUPABASE_URL}/rest/v1/${TABLE}?select=*`;

  // Search filter (OR across RECORD_ID, RECORD_NAME, PARCEL_NBR)
  if (search.trim()) {
    const q = encodeURIComponent(search.trim());
    url += `&or=(RECORD_ID.ilike.*${q}*,RECORD_NAME.ilike.*${q}*,PARCEL_NBR.ilike.*${q}*)`;
  }
  if (filterModule !== "all") {
    url += `&RECORD_MODULE=eq.${encodeURIComponent(filterModule)}`;
  }
  if (filterStatus !== "all") {
    url += `&PERMIT_STATUS=eq.${encodeURIComponent(filterStatus)}`;
  }

  url += `&order=OPEN_DATE.desc.nullslast&offset=${from}&limit=${PAGE_SIZE}`;

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: "count=exact",
    },
  });

  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);

  const data = await res.json();
  // Extract count from Content-Range header
  const contentRange = res.headers.get("content-range");
  let total = TOTAL_RECORDS;
  if (contentRange) {
    const match = contentRange.match(/\/(\d+)$/);
    if (match) total = parseInt(match[1]);
  }

  return { records: data, total };
}

async function fetchDistinctStatuses() {
  const url = `${SUPABASE_URL}/rest/v1/${TABLE}?select=PERMIT_STATUS&limit=1000`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  });
  const data = await res.json();
  const statuses = [...new Set(data.map(r => r.PERMIT_STATUS).filter(Boolean))].sort();
  return statuses;
}

export default function AdminPermitRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(TOTAL_RECORDS);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [filterModule, setFilterModule] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [statuses, setStatuses] = useState([]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchRecords({ page, search, filterModule, filterStatus });
    setRecords(result.records);
    setTotal(result.total);
    setLoading(false);
  }, [page, search, filterModule, filterStatus]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetchDistinctStatuses().then(setStatuses).catch(() => {});
  }, []);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(0);
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleModuleChange = (v) => { setFilterModule(v); setPage(0); };
  const handleStatusChange = (v) => { setFilterStatus(v); setPage(0); };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
          <ClipboardList className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Permit Records</h1>
          <p className="text-gray-500 text-sm">
            Weston municipal permit data — <span className="font-semibold text-gray-700">{TOTAL_RECORDS.toLocaleString()}</span> total records
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search Record ID, name, or parcel..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <select
            className="h-9 rounded-md border border-input bg-white px-3 text-sm min-w-36"
            value={filterModule}
            onChange={e => handleModuleChange(e.target.value)}
          >
            <option value="all">All Departments</option>
            {MODULES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            className="h-9 rounded-md border border-input bg-white px-3 text-sm min-w-36"
            value={filterStatus}
            onChange={e => handleStatusChange(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-between mb-3 text-sm text-gray-500">
        <div>
          {loading ? (
            <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading...</span>
          ) : (
            <span>
              Showing <span className="font-semibold text-gray-700">{(page * PAGE_SIZE + 1).toLocaleString()}–{Math.min((page + 1) * PAGE_SIZE, total).toLocaleString()}</span> of <span className="font-semibold text-gray-700">{total.toLocaleString()}</span> records
              {filterModule !== "all" && <> · <span className="text-blue-600">{filterModule}</span></>}
              {filterStatus !== "all" && <> · <span className="text-blue-600">{filterStatus}</span></>}
              {search && <> · searching "<span className="italic">{search}</span>"</>}
            </span>
          )}
        </div>
        {/* Pagination controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0 || loading}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium text-gray-600 px-1">
            Page {page + 1} of {totalPages.toLocaleString()}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1 || loading}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Table */}
      {loading && records.length === 0 ? (
        <div className="flex items-center justify-center gap-2 text-gray-400 py-20">
          <Loader2 className="w-6 h-6 animate-spin" /> Loading permit records...
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p>No records match your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: "linear-gradient(135deg, #0D2B5E 0%, #0F3575 100%)" }}>
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-blue-100 uppercase tracking-wide">Record ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-blue-100 uppercase tracking-wide">Record Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-blue-100 uppercase tracking-wide">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-blue-100 uppercase tracking-wide">Permit Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-blue-100 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-blue-100 uppercase tracking-wide">Open Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-blue-100 uppercase tracking-wide">Parcel #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.map((r, i) => (
                  <tr key={r.id ?? i} className={`hover:bg-blue-50/40 transition-colors ${loading ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs text-blue-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {r.RECORD_ID || "—"}
                        {(r.HAS_OPEN_CODE_CASE === "true" || r.HAS_OPEN_CODE_CASE === true) && (
                          <span title="Has open code enforcement case">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs">
                      <span className="line-clamp-2 leading-snug">{r.RECORD_NAME || "—"}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.RECORD_MODULE ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODULE_COLORS[r.RECORD_MODULE] || "bg-gray-100 text-gray-600"}`}>
                          {r.RECORD_MODULE}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{r.PERMIT_TYPE || "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {r.PERMIT_STATUS ? (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          {r.PERMIT_STATUS}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{r.OPEN_DATE || "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">{r.PARCEL_NBR || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom pagination */}
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50">
            <span className="text-xs text-gray-400">{PAGE_SIZE} records per page</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <span className="text-xs text-gray-500 px-1">Page {page + 1} / {totalPages.toLocaleString()}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}