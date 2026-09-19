import React, { useEffect, useState } from "react";
import { fetchAnalyticsBreakdown, fetchAnalyticsDelays, fetchAnalyticsShortages, fetchPredictiveDemandForecast } from "../api";
import type { Incident, IncidentBreakdownResponse, PredictiveDemandResponse, ResourceShortage, ResponseDelayStats } from "../types";
import { ShieldCheck, AlertTriangle, Clock, Flame, Users, Radio } from "lucide-react";

interface AnalyticsViewProps {
  incidents: Incident[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ incidents }) => {
  const [breakdown, setBreakdown] = useState<IncidentBreakdownResponse | null>(null);
  const [delays, setDelays] = useState<ResponseDelayStats | null>(null);
  const [shortages, setShortages] = useState<ResourceShortage[] | null>(null);
  const [analyticsError, setAnalyticsError] = useState(false);
  const [predictiveDemand, setPredictiveDemand] = useState<PredictiveDemandResponse | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const loadAnalytics = async () => {
      const [breakdownResult, delaysResult, shortagesResult, demandResult] = await Promise.allSettled([
        fetchAnalyticsBreakdown(),
        fetchAnalyticsDelays(),
        fetchAnalyticsShortages(),
        fetchPredictiveDemandForecast(2),
      ]);
      if (!isCurrent) return;
      if (breakdownResult.status === "fulfilled") setBreakdown(breakdownResult.value);
      if (delaysResult.status === "fulfilled") setDelays(delaysResult.value);
      if (shortagesResult.status === "fulfilled") setShortages(shortagesResult.value);
      if (demandResult.status === "fulfilled") setPredictiveDemand(demandResult.value);
      setAnalyticsError([breakdownResult, delaysResult, shortagesResult, demandResult].some((result) => result.status === "rejected"));
    };
    void loadAnalytics();
    return () => { isCurrent = false; };
  }, []);

  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter((i) => i.severity === "critical").length;
  const highCount = incidents.filter((i) => i.severity === "high").length;
  const duplicateCount = incidents.filter((i) => i.duplicate_of_id !== null).length;

  return (
    <div className="w-full h-full bg-[#F4F7FA] p-8 overflow-y-auto space-y-6 text-[#263238]">
      <div>
        <h2 className="text-xl font-bold text-[#263238] flex items-center gap-2">
          Emergency Operations Analytics
        </h2>
        <p className="text-xs text-[#607D8B] mt-1">
          Real-time incident frequency, severity distribution, delay metrics, and resource availability.
        </p>
      </div>

      {analyticsError && (
        <div role="alert" className="rounded-lg border border-[#EF9A9A] bg-[#FDECEC] px-4 py-3 text-xs text-[#B71C1C]">
          Some analytics data is unavailable. Figures shown below may be incomplete; retry the page when the service recovers.
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#DCE3E8] p-4 rounded-xl shadow-xs">
          <div className="text-[#607D8B] text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Total Incidents</span>
            <Flame className="w-4 h-4 text-[#1565C0]" />
          </div>
          <div className="text-2xl font-black text-[#263238] mt-2">{totalIncidents}</div>
          <div className="text-[11px] text-[#90A4AE] mt-1">Logged across all sectors</div>
        </div>

        <div className="bg-white border border-[#DCE3E8] p-4 rounded-xl shadow-xs">
          <div className="text-[#B71C1C] text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Critical Emergencies</span>
            <AlertTriangle className="w-4 h-4 text-[#D32F2F] animate-pulse" />
          </div>
          <div className="text-2xl font-black text-[#D32F2F] mt-2">{criticalCount}</div>
          <div className="text-[11px] text-[#90A4AE] mt-1">Priority 1 immediate threat</div>
        </div>

        <div className="bg-white border border-[#DCE3E8] p-4 rounded-xl shadow-xs">
          <div className="text-[#E65100] text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>High Severity</span>
            <Clock className="w-4 h-4 text-[#F57C00]" />
          </div>
          <div className="text-2xl font-black text-[#F57C00] mt-2">{highCount}</div>
          <div className="text-[11px] text-[#90A4AE] mt-1">Urgent response dispatched</div>
        </div>

        <div className="bg-white border border-[#DCE3E8] p-4 rounded-xl shadow-xs">
          <div className="text-[#2E7D32] text-xs font-semibold uppercase tracking-wider flex items-center justify-between">
            <span>Consolidated Duplicates</span>
            <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
          </div>
          <div className="text-2xl font-black text-[#2E7D32] mt-2">{duplicateCount}</div>
          <div className="text-[11px] text-[#90A4AE] mt-1">Saved multi-caller dispatches</div>
        </div>
      </div>

      {/* Incident Category Breakdown */}
      <div className="bg-white border border-[#DCE3E8] p-6 rounded-xl space-y-4 shadow-xs">
        <h3 className="text-sm font-bold text-[#263238] uppercase tracking-wider">
          Incidents by Emergency Category
        </h3>
        <div className="space-y-3">
          {!breakdown || breakdown.by_type.length === 0 ? (
            <div className="text-xs text-[#90A4AE] py-4">No category data yet.</div>
          ) : (
            breakdown.by_type.map(({ incident_type, count }) => {
              const pct = breakdown.total > 0 ? (count / breakdown.total) * 100 : 0;
              return (
                <div key={incident_type} className="space-y-1">
                  <div className="flex justify-between text-xs text-[#263238] capitalize font-medium">
                    <span>{incident_type.replace("_", " ")}</span>
                    <span className="font-mono text-[#607D8B]">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-[#EEF2F6] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1565C0] rounded-full transition-all duration-500"
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
        <div className="bg-white border border-[#DCE3E8] p-6 rounded-xl space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-[#1565C0] animate-pulse" />
                <h3 className="text-sm font-bold text-[#263238] uppercase tracking-wider">
                  AI Spatio-Temporal Demand Forecast & Patrol Pre-Deployment
                </h3>
              </div>
              <p className="text-xs text-[#607D8B] mt-0.5">
                Forward {predictiveDemand.forecast_horizon_hours}h Poisson surge model & Kernel Density Estimation (KDE) positioning standby units.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-[#FFF3E0] px-2.5 py-1 rounded-md text-[#E65100] font-mono border border-[#FFCC80] font-semibold">
                City Risk Index: <b>{predictiveDemand.city_wide_risk_index}%</b>
              </span>
              <span className="bg-[#E8F5E9] text-[#2E7D32] px-2.5 py-1 rounded-md font-mono border border-[#A5D6A7] font-bold">
                +{predictiveDemand.total_projected_eta_savings_minutes}m Net ETA Saved
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {predictiveDemand.staging_recommendations.map((st) => (
              <div
                key={st.staging_id}
                className="bg-[#EEF2F6] border border-[#DCE3E8] p-3.5 rounded-lg space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#263238]">{st.zone_name}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#E3F2FD] text-[#1565C0] border border-[#90CAF9]">
                      {Math.round(st.predicted_demand_intensity * 100)}% Surge
                    </span>
                  </div>
                  <div className="text-[11px] text-[#1565C0] font-semibold mt-1">
                    🚨 Pre-Deploy: {st.recommended_unit_type.replace(/_/g, " ").toUpperCase()}
                  </div>
                  <p className="text-[11px] text-[#607D8B] mt-1 leading-snug line-clamp-2">
                    {st.tactical_rationale}
                  </p>
                </div>
                <div className="border-t border-[#DCE3E8] pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-[#607D8B]">Response Bonus:</span>
                  <span className="font-bold text-[#2E7D32] font-mono">
                    ~{st.projected_eta_savings_minutes}m faster
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-[#607D8B] font-mono flex items-center justify-between border-t border-[#DCE3E8] pt-2">
            <span>Grid Points Calculated: {predictiveDemand.heatmap_grid.length} cells</span>
            <span>Algorithm: {predictiveDemand.algorithm}</span>
          </div>
        </div>
      )}

      {/* Resource Allocation & Delays */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#DCE3E8] p-6 rounded-xl space-y-3 shadow-xs">
          <h3 className="text-sm font-bold text-[#263238] uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F57C00]" />
            Response Delay Alerts
          </h3>
          {!delays || delays.by_type.length === 0 ? (
            <div className="text-xs text-[#90A4AE] py-4">All response teams are currently within optimal response windows.</div>
          ) : (
            <div className="space-y-2">
              {delays.by_type.map((delay) => (
                <div key={delay.incident_type} className="p-3 bg-[#EEF2F6] border border-[#DCE3E8] rounded-lg text-xs flex justify-between items-center">
                  <span className="text-[#263238] font-semibold capitalize">{delay.incident_type.replace(/_/g, " ")} <span className="font-normal text-[#607D8B]">({delay.sample_size} responses)</span></span>
                  <span className="text-[#D32F2F] font-mono font-bold">Avg: {delay.average_minutes.toFixed(1)}m</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-[#DCE3E8] p-6 rounded-xl space-y-3 shadow-xs">
          <h3 className="text-sm font-bold text-[#263238] uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-[#1565C0]" />
            Sector Resource Constraints
          </h3>
          {!shortages || shortages.length === 0 ? (
            <div className="text-xs text-[#90A4AE] py-4">Resource unit capacity is healthy across all operational sectors.</div>
          ) : (
            <div className="space-y-2">
              {shortages.map((s, i) => (
                <div key={i} className="p-3 bg-[#EEF2F6] border border-[#DCE3E8] rounded-lg text-xs flex justify-between items-center">
                  <span className="text-[#263238] capitalize font-medium">{s.resource_type || "Units"}</span>
                  <span className={s.shortage ? "text-[#F57C00] font-bold" : "text-[#2E7D32] font-bold"}>{s.available}/{s.total} available</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
