import React, { useEffect, useState } from "react";
import { fetchAnalyticsBreakdown, fetchAnalyticsDelays, fetchAnalyticsShortages, fetchPredictiveDemandForecast } from "../api";
import type { Incident, PredictiveDemandResponse } from "../types";
import { ShieldCheck, AlertTriangle, Clock, Flame, Users, Radio } from "lucide-react";

interface AnalyticsViewProps {
  incidents: Incident[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ incidents }) => {
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [delays, setDelays] = useState<any[]>([]);
  const [shortages, setShortages] = useState<any[]>([]);
  const [predictiveDemand, setPredictiveDemand] = useState<PredictiveDemandResponse | null>(null);

  useEffect(() => {
    fetchAnalyticsBreakdown().then(setBreakdown).catch(console.error);
    fetchAnalyticsDelays().then(setDelays).catch(console.error);
    fetchAnalyticsShortages().then(setShortages).catch(console.error);
    fetchPredictiveDemandForecast(2).then(setPredictiveDemand).catch(console.error);
  }, []);

  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter((i) => i.severity === "critical").length;
  const highCount = incidents.filter((i) => i.severity === "high").length;
  const duplicateCount = incidents.filter((i) => i.duplicate_of_id !== null).length;

  return (
    <div className="w-full h-full bg-slate-950 p-8 overflow-y-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Emergency Operations Analytics
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Real-time incident frequency, severity distribution, delay metrics, and resource availability.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Total Incidents</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-white mt-2">{totalIncidents}</div>
          <div className="text-[11px] text-slate-500 mt-1">Logged across all sectors</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-rose-400 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Critical Emergencies</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-2">{criticalCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Priority 1 immediate threat</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-amber-400 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>High Severity</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">{highCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Urgent response dispatched</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
          <div className="text-purple-400 text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Consolidated Duplicates</span>
            <ShieldCheck className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 mt-2">{duplicateCount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Saved multi-caller dispatches</div>
        </div>
      </div>

      {/* Incident Category Breakdown */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Incidents by Emergency Category
        </h3>
        <div className="space-y-3">
          {Object.entries(breakdown).length === 0 ? (
            <div className="text-xs text-slate-500 py-4">No category data yet.</div>
          ) : (
            Object.entries(breakdown).map(([cat, count]) => {
              const pct = totalIncidents > 0 ? (count / totalIncidents) * 100 : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-300 capitalize font-medium">
                    <span>{cat.replace("_", " ")}</span>
                    <span className="font-mono text-slate-400">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* AI Spatio-Temporal Demand Forecast & Pre-Deployment Staging Panel */}
      {predictiveDemand && (
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-sky-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  AI Spatio-Temporal Demand Forecast & Patrol Pre-Deployment
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Forward {predictiveDemand.forecast_horizon_hours}h Poisson surge model & Kernel Density Estimation (KDE) positioning standby units.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-slate-800 px-2.5 py-1 rounded-md text-slate-300 font-mono border border-slate-700">
                City Risk Index: <b className="text-amber-400">{predictiveDemand.city_wide_risk_index}%</b>
              </span>
              <span className="bg-emerald-950/80 text-emerald-300 px-2.5 py-1 rounded-md font-mono border border-emerald-800 font-bold">
                +{predictiveDemand.total_projected_eta_savings_minutes}m Net ETA Saved
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {predictiveDemand.staging_recommendations.map((st) => (
              <div
                key={st.staging_id}
                className="bg-slate-800/70 border border-slate-700/80 p-3.5 rounded-lg space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{st.zone_name}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
                      {Math.round(st.predicted_demand_intensity * 100)}% Surge
                    </span>
                  </div>
                  <div className="text-[11px] text-sky-400 font-semibold mt-1">
                    🚨 Pre-Deploy: {st.recommended_unit_type.replace(/_/g, " ").toUpperCase()}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug line-clamp-2">
                    {st.tactical_rationale}
                  </p>
                </div>
                <div className="border-t border-slate-700/60 pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Response Bonus:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    ~{st.projected_eta_savings_minutes}m faster
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-800 pt-2">
            <span>Grid Points Calculated: {predictiveDemand.heatmap_grid.length} cells</span>
            <span>Algorithm: {predictiveDemand.algorithm}</span>
          </div>
        </div>
      )}

      {/* Resource Allocation & Delays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Response Delay Alerts
          </h3>
          {delays.length === 0 ? (
            <div className="text-xs text-slate-500 py-4">All response teams are currently within optimal response windows.</div>
          ) : (
            <div className="space-y-2">
              {delays.map((d, i) => (
                <div key={i} className="p-3 bg-slate-800/60 rounded-lg text-xs flex justify-between items-center">
                  <span className="text-slate-200 font-semibold">{d.title || `Incident #${i+1}`}</span>
                  <span className="text-rose-400 font-mono font-bold">Delay: {d.delay_minutes || 15}m</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Sector Resource Constraints
          </h3>
          {shortages.length === 0 ? (
            <div className="text-xs text-slate-500 py-4">Resource unit capacity is healthy across all operational sectors.</div>
          ) : (
            <div className="space-y-2">
              {shortages.map((s, i) => (
                <div key={i} className="p-3 bg-slate-800/60 rounded-lg text-xs flex justify-between items-center">
                  <span className="text-slate-200 capitalize font-medium">{s.resource_type || "Units"}</span>
                  <span className="text-amber-400 font-bold">Capacity low in Sector</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
