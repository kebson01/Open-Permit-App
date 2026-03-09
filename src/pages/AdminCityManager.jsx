import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Plus, Pencil, Trash2, ChevronDown, ChevronUp, Shield, Users, Link2, Copy } from "lucide-react";
import { createPageUrl } from "@/utils";
import CityFormModal from "@/components/admin/CityFormModal.jsx";
import CityFeeRulesPanel from "@/components/admin/CityFeeRulesPanel.jsx";
import InviteCityAdminModal from "@/components/admin/InviteCityAdminModal.jsx";

export default function AdminCityManager() {
  const [currentUser, setCurrentUser] = useState(null);
  const [expandedCity, setExpandedCity] = useState(null);
  const [showCityForm, setShowCityForm] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTargetCity, setInviteTargetCity] = useState(null);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const { data: cities = [], isLoading } = useQuery({
    queryKey: ["cities"],
    queryFn: () => base44.entities.City.list(),
  });

  const deleteCityMutation = useMutation({
    mutationFn: (id) => base44.entities.City.delete(id),
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
  const cityAdminAssignedCity = currentUser.assigned_city_id;
  
  let filtered = cities.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
  if (!isSuperAdmin && cityAdminAssignedCity) {
    filtered = filtered.filter(c => c.id === cityAdminAssignedCity);
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

        {/* Search */}
        <Input
          placeholder="Search cities..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="mb-5 max-w-sm"
        />

        {/* City List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading cities...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No cities found. Add one to get started.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map(city => (
              <div key={city.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{city.name}</h3>
                    <p className="text-sm text-gray-500">{city.county} County, {city.state}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    {city.slug && (
                      <button
                        className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 hover:bg-blue-100 transition-colors"
                        onClick={() => {
                          const pagePath = createPageUrl(`CityPortalPublic?slug=${city.slug}`);
                          const url = `${window.location.origin}${pagePath}`;
                          navigator.clipboard.writeText(url);
                          alert("Portal URL copied:\n" + url);
                        }}
                        title="Copy portal URL"
                      >
                        <Copy className="w-3 h-3" /> Copy URL
                      </button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setInviteTargetCity(city); setShowInviteModal(true); }}
                    >
                      <Users className="w-3.5 h-3.5" /> Invite Admin
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingCity(city); setShowCityForm(true); }}>
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCityMutation.mutate(city.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setExpandedCity(expandedCity === city.id ? null : city.id)}>
                      {expandedCity === city.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {expandedCity === city.id && (
                  <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
                    <CityFeeRulesPanel city={city} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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