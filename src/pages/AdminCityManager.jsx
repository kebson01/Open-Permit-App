import React, { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import * as db from "@/lib/db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Shield, Users } from "lucide-react";
import CityFormModal from "@/components/admin/CityFormModal.jsx";
import CityFeeRulesPanel from "@/components/admin/CityFeeRulesPanel.jsx";
import CityPermitTypesPanel from "@/components/admin/CityPermitTypesPanel.jsx";
import CodeOfOrdinancesPanel from "@/components/admin/CodeOfOrdinancesPanel.jsx";
import InviteCityAdminModal from "@/components/admin/InviteCityAdminModal.jsx";
import PermitImportTool from "@/components/admin/PermitImportTool.jsx";
import CitySupabaseStats from "@/components/admin/CitySupabaseStats.jsx";

export default function AdminCityManager() {
  const [currentUser, setCurrentUser] = useState(null);
  const [expandedCity, setExpandedCity] = useState(null);
  const [activeTab, setActiveTab] = useState({});
  const [mainTab, setMainTab] = useState("cities");
  const [showCityForm, setShowCityForm] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTargetCity, setInviteTargetCity] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    getCurrentUser().then(user => {
      if (user) setCurrentUser(user);
    }).catch(() => {});
  }, []);

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ["cities"],
    queryFn: () => db.City.list(),
  });

  const deleteCityMutation = useMutation({
    mutationFn: (id) => db.City.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cities"] }),
  });

  if (!currentUser) return <div className="p-8 text-center text-gray-500">Loading...</div>;
  if (currentUser.role !== "admin" && currentUser.role !== "city_admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
          <p className="text-gray-500 mt-1">Admin access required.</p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = currentUser.role === "admin";
  // Scope a city_admin to their own city. Prefer assigned_city_id, but fall back
  // to city_name since the invite flow sets city_name (not the id) on the user.
  const cityAdminAssignedCity = currentUser.assigned_city_id;
  const cityAdminCityName = currentUser.city_name;

  let filtered = cities.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
  if (!isSuperAdmin && (cityAdminAssignedCity || cityAdminCityName)) {
    filtered = filtered.filter(c =>
      c.id === cityAdminAssignedCity ||
      (cityAdminCityName && c.name?.toLowerCase() === cityAdminCityName.toLowerCase())
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-600" /> City Manager
            </h1>
            <p className="text-gray-500 text-sm mt-1">{isSuperAdmin ? "Manage municipalities and their fee schedules" : "Manage your city configuration"}</p>
          </div>
          {isSuperAdmin && (
            <Button onClick={() => { setEditingCity(null); setShowCityForm(true); }} className="gradient-primary text-white">
              <Plus className="w-4 h-4" /> Add City
            </Button>
          )}
        </div>

        {/* Top-level tabs (admin only) */}
        {isSuperAdmin && (
          <div className="flex gap-1 border-b border-gray-200 mb-6">
            {[
              { id: "cities", label: "Cities" },
              { id: "import", label: "⬇ Import Permits" },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setMainTab(t.id)}
                className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  mainTab === t.id
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Import tab */}
        {mainTab === "import" && isSuperAdmin && (
          <PermitImportTool />
        )}

        {/* Search (only in cities tab) */}
        {mainTab === "cities" && (
        <Input
          placeholder="Search cities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-5 max-w-sm"
        />
        )}

        {/* City List */}
        {mainTab === "cities" && isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading cities...</div>
        ) : mainTab === "cities" && filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No cities found. Add one to get started.</div>
        ) : mainTab === "cities" ? (
          <div className="space-y-3">
            {filtered.map(city => (
              <div key={city.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{city.name}</h3>
                    <p className="text-sm text-gray-500">{city.county} County, {city.state}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {isSuperAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setInviteTargetCity(city); setShowInviteModal(true); }}
                        >
                          <Users className="w-3.5 h-3.5" /> Invite Admin
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteCityMutation.mutate(city.id)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => { setEditingCity(city); setShowCityForm(true); }}>
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setExpandedCity(expandedCity === city.id ? null : city.id)}>
                      {expandedCity === city.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {expandedCity === city.id && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    {/* Tabs */}
                    <div className="flex gap-0 border-b border-gray-200 overflow-x-auto">
                      {["data_overview", "permit_types", "fee_rules", "ordinances"].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(prev => ({ ...prev, [city.id]: tab }))}
                          className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            (activeTab[city.id] || "data_overview") === tab
                              ? "border-blue-600 text-blue-700 bg-white"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          {tab === "data_overview" ? "📊 Data Overview" : tab === "permit_types" ? "Permit Types" : tab === "fee_rules" ? "Fee Rules" : "Code of Ordinances"}
                        </button>
                      ))}
                    </div>
                    <div className="px-5 py-4">
                      {(activeTab[city.id] || "data_overview") === "data_overview" ? (
                        <CitySupabaseStats city={city} />
                      ) : (activeTab[city.id]) === "permit_types" ? (
                        <CityPermitTypesPanel city={city} />
                      ) : (activeTab[city.id]) === "ordinances" ? (
                        <CodeOfOrdinancesPanel city={city} />
                      ) : (
                        <CityFeeRulesPanel city={city} />
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {showCityForm && (
        <CityFormModal
          city={editingCity}
          onClose={() => setShowCityForm(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["cities"] });
            setShowCityForm(false);
          }}
        />
      )}

      {showInviteModal && inviteTargetCity && (
        <InviteCityAdminModal
          city={inviteTargetCity}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
}