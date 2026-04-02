import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Database, Play, RefreshCw } from "lucide-react";

const ENTITIES = [
  "City",
  "Property",
  "Project",
  "PermitType",
  "FeeRule",
  "CitySurcharge",
  "ZoningRule",
  "CodeOfOrdinance",
  "PermitRecord",
];

const TABLE_MAP = {
  City: "cities",
  Property: "properties",
  Project: "projects",
  PermitType: "permit_types",
  FeeRule: "fee_rules",
  CitySurcharge: "city_surcharges",
  ZoningRule: "zoning_rules",
  CodeOfOrdinance: "code_of_ordinances",
  PermitRecord: "permit_records",
};

export default function AdminMigration() {
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [runningEntity, setRunningEntity] = useState(null);

  const runMigration = async (entity = null) => {
    setRunning(true);
    setRunningEntity(entity || "all");
    if (!entity) setResults({});

    const response = await base44.functions.invoke("migrateToSupabase", { entity });
    const data = response.data;

    setResults(prev => ({ ...prev, ...data.results }));
    setRunning(false);
    setRunningEntity(null);
  };

  const getStatusIcon = (status) => {
    if (status === "success") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === "error") return <XCircle className="w-4 h-4 text-red-500" />;
    if (status === "empty") return <Database className="w-4 h-4 text-gray-400" />;
    return null;
  };

  const getStatusBadge = (status) => {
    if (status === "success") return <Badge className="bg-green-100 text-green-700 border-green-200">Migrated</Badge>;
    if (status === "error") return <Badge className="bg-red-100 text-red-700 border-red-200">Error</Badge>;
    if (status === "empty") return <Badge className="bg-gray-100 text-gray-500 border-gray-200">Empty</Badge>;
    return null;
  };

  const successCount = Object.values(results).filter(r => r.status === "success").length;
  const errorCount = Object.values(results).filter(r => r.status === "error").length;
  const totalMigrated = Object.values(results).reduce((sum, r) => sum + (r.count || 0), 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          Base44 → Supabase Migration
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Export all Base44 entity data and upsert into existing Supabase tables.
        </p>
      </div>

      {/* Summary */}
      {Object.keys(results).length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
            <div className="text-2xl font-bold text-blue-700">{totalMigrated.toLocaleString()}</div>
            <div className="text-xs text-blue-600 mt-1">Records Migrated</div>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
            <div className="text-2xl font-bold text-green-700">{successCount}</div>
            <div className="text-xs text-green-600 mt-1">Entities Success</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
            <div className="text-2xl font-bold text-red-700">{errorCount}</div>
            <div className="text-xs text-red-600 mt-1">Entities Failed</div>
          </div>
        </div>
      )}

      {/* Main action */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-4">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-800">Migrate All Entities</h2>
            <p className="text-xs text-gray-500 mt-0.5">{ENTITIES.length} entities → Supabase</p>
          </div>
          <Button
            onClick={() => runMigration()}
            disabled={running}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {running && runningEntity === "all" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Migrating...</>
            ) : (
              <><Play className="w-4 h-4" /> Run Full Migration</>
            )}
          </Button>
        </div>

        {/* Entity rows */}
        <div className="divide-y divide-gray-100">
          {ENTITIES.map(entity => {
            const result = results[entity];
            const isRunning = running && runningEntity === entity;

            return (
              <div key={entity} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  ) : result ? (
                    getStatusIcon(result.status)
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
                  )}
                  <div>
                    <span className="text-sm font-medium text-gray-800">{entity}</span>
                    <span className="ml-2 text-xs text-gray-400">→ {TABLE_MAP[entity]}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {result && (
                    <span className="text-xs text-gray-500">
                      {result.count?.toLocaleString()} / {result.total?.toLocaleString() ?? result.count} records
                    </span>
                  )}
                  {result ? getStatusBadge(result.status) : null}
                  <button
                    onClick={() => runMigration(entity)}
                    disabled={running}
                    className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40 transition-colors"
                    title={`Re-run ${entity} only`}
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Errors */}
      {Object.entries(results).filter(([, r]) => r.status === "error").map(([entity, r]) => (
        <div key={entity} className="mt-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-red-700">{entity} error:</p>
          <p className="text-xs text-red-600 mt-1 font-mono">{r.error}</p>
        </div>
      ))}

      <p className="text-xs text-gray-400 mt-4 text-center">
        Uses <code>Prefer: resolution=merge-duplicates</code> — safe to re-run without duplicating data.
      </p>
    </div>
  );
}