import { useState, useEffect } from "react";
import * as db from "@/lib/db";
import { Loader2, ChevronDown } from "lucide-react";

const ROLE_STYLES = {
  admin:      { bg: "bg-red-100",    text: "text-red-700" },
  city_admin: { bg: "bg-blue-100",   text: "text-blue-700" },
  user:       { bg: "bg-slate-100",  text: "text-slate-600" },
};

const ALL_ROLES = ["user", "city_admin", "admin"];

function RoleBadge({ role }) {
  const style = ROLE_STYLES[role] || ROLE_STYLES.user;
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>{role || "user"}</span>;
}

export default function AdminUsers({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await db.User.list("-created_date", 200);
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    await db.User.update(userId, { role: newRole });
    setUpdating(null);
    load();
  };

  if (loading) return <div className="flex items-center gap-2 text-slate-500 py-12 justify-center"><Loader2 className="w-5 h-5 animate-spin" /> Loading users...</div>;

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800">Users</h2>
        <p className="text-sm text-slate-500 mt-0.5">{users.length} registered users</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Email", "Full Name", "Role", "City", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{user.email}</td>
                  <td className="px-4 py-3 text-slate-800 font-medium whitespace-nowrap">{user.full_name || "—"}</td>
                  <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{user.city || "—"}</td>
                  <td className="px-4 py-3">
                    {currentUser?.role === "admin" && user.email !== currentUser?.email ? (
                      <div className="relative inline-block">
                        <select
                          value={user.role || "user"}
                          disabled={updating === user.id}
                          onChange={e => handleRoleChange(user.id, e.target.value)}
                          className="appearance-none pl-3 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs bg-white cursor-pointer hover:border-blue-400 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-400"
                        >
                          {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}