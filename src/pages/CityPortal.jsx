import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import * as db from "@/lib/db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Shield, Phone, MapPin, Globe, Calendar, ChevronDown, ChevronUp, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import CityFeeRulesPanel from "@/components/admin/CityFeeRulesPanel.jsx";
import CityFormModal from "@/components/admin/CityFormModal.jsx";

export default function CityPortal() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showFeeRules, setShowFeeRules] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setCurrentUser);
  }, []);

  const cityName = currentUser?.city_name;

  const { data: cities = [] } = useQuery({
    queryKey: ["cities", cityName],
    queryFn: () => db.City.filter({ name: cityName }),
    enabled: !!cityName,
  });

  const city = cities[0];

  if (!currentUser) return <div className="p-8 text-center text-gray-400">Loading...</div>;

  if (currentUser.role === "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Shield className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-700">You're an Admin</h2>
          <p className="text-gray-500 mt-1">Use the <a href="/admin-city-manager" className="text-blue-600 underline">City Manager</a> to manage all cities.</p>
        </div>
      </div>
    );
  }

  if (!cityName) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-600">No City Assigned</h2>
          <p className="text-gray-500 mt-1">Contact your administrator to be assigned to a city.</p>
        </div>
      </div>
    );
  }

  if (!city) {
    return <div className="p-8 text-center text-gray-400">Loading your city data...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-600" />
                {city.name}
              </h1>
              <p className="text-gray-500 mt-1">{city.county} County, {city.state}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
              <Pencil className="w-3.5 h-3.5" /> Edit Info
            </Button>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {city.building_department_phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4 text-blue-500 flex-shrink-0" />
                {city.building_department_phone}
              </div>
            )}
            {city.building_department_address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                {city.building_department_address}
              </div>
            )}
            {city.portal_url && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Globe className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <a href={city.portal_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">{city.portal_url}</a>
              </div>
            )}
            {city.fee_schedule_effective_date && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
                Fee Schedule Effective: {city.fee_schedule_effective_date}
              </div>
            )}
          </div>
        </div>

        {/* Fee Rules */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowFeeRules(!showFeeRules)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <span className="font-semibold text-gray-900">Fee Schedule Rules</span>
            {showFeeRules ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
          {showFeeRules && (
            <div className="border-t border-gray-100 px-6 py-5 bg-gray-50">
              <CityFeeRulesPanel city={city} />
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <CityFormModal
          city={city}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["cities", cityName] });
            setShowEdit(false);
          }}
        />
      )}
    </div>
  );
}