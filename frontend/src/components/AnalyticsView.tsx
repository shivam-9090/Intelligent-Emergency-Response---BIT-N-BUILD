import React, { useEffect, useState } from "react";
import { fetchAnalyticsBreakdown, fetchAnalyticsDelays, fetchAnalyticsShortages, fetchPredictiveDemandForecast } from "../api";
import type { Incident, PredictiveDemandResponse, PreDeploymentStagingPoint } from "../types";
import { ShieldCheck, AlertTriangle, Clock, Flame, Users, Radio, MapPin, X, CheckCircle2, Zap, ArrowRight, Navigation } from "lucide-react";

interface AnalyticsViewProps {
  incidents: Incident[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ incidents }) => {
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [delays, setDelays] = useState<any[]>([]);
  const [shortages, setShortages] = useState<any[]>([]);
  const [predictiveDemand, setPredictiveDemand] = useState<PredictiveDemandResponse | null>(null);
  const [selectedStaging, setSelectedStaging] = useState<PreDeploymentStagingPoint | null>(null);
  const [dispatchedStagings, setDispatchedStagings] = useState<Record<string, boolean>>({});

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

  const displayBreakdown = { ...breakdown };
  if (Object.keys(displayBreakdown).length === 0 && incidents.length > 0) {
    for (const inc of incidents) {
      displayBreakdown[inc.incident_type] = (displayBreakdown[inc.incident_type] || 0) + 1;
    }
  }

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
          {Object.entries(displayBreakdown).length === 0 ? (
            <div className="text-xs text-[#90A4AE] py-4">No category data yet.</div>
          ) : (
            Object.entries(displayBreakdown).map(([cat, count]) => {
              const pct = totalIncidents > 0 ? (count / totalIncidents) * 100 : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs text-[#263238] capitalize font-medium">
                    <span>{cat.replace("_", " ")}</span>
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
            {predictiveDemand.staging_recommendations.map((st) => {
              const isDispatched = !!dispatchedStagings[st.staging_id];
              return (
                <div
                  key={st.staging_id}
                  onClick={() => setSelectedStaging(st)}
                  className="bg-[#EEF2F6] hover:bg-[#EAF3FB] border border-[#DCE3E8] hover:border-[#1565C0] p-3.5 rounded-lg space-y-2 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:shadow-md group active:scale-[0.99] select-none"
                  title="Click to open full staging information box"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-xs font-bold text-[#263238] group-hover:text-[#1565C0] transition-colors flex items-center gap-1 truncate">
                        <MapPin className="w-3.5 h-3.5 text-[#1565C0] shrink-0" />
                        <span className="truncate">{st.zone_name}</span>
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 border ${
                        st.predicted_demand_intensity >= 0.8
                          ? "bg-[#FDECEC] text-[#B71C1C] border-[#EF9A9A]"
                          : st.predicted_demand_intensity >= 0.5
                          ? "bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]"
                          : "bg-[#E3F2FD] text-[#1565C0] border-[#90CAF9]"
                      }`}>
                        {Math.round(st.predicted_demand_intensity * 100)}% Surge
                      </span>
                    </div>

                    <div className="text-[11px] text-[#1565C0] font-semibold mt-1 flex items-center justify-between">
                      <span>🚨 Pre-Deploy: {st.recommended_unit_type.replace(/_/g, " ").toUpperCase()}</span>
                      {isDispatched && (
                        <span className="text-[10px] text-[#2E7D32] bg-[#E8F5E9] px-1.5 py-0.2 rounded border border-[#A5D6A7] font-bold">
                          DEPLOYED
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#607D8B] mt-1 leading-snug line-clamp-2">
                      {st.tactical_rationale}
                    </p>
                  </div>

                  <div>
                    <div className="border-t border-[#DCE3E8] pt-2 flex items-center justify-between text-[11px]">
                      <span className="text-[#607D8B]">Response Bonus:</span>
                      <span className="font-bold text-[#2E7D32] font-mono">
                        ~{st.projected_eta_savings_minutes}m faster
                      </span>
                    </div>

                    <div className="mt-1.5 pt-1.5 border-t border-dashed border-[#DCE3E8] text-[10px] text-[#1565C0] font-semibold flex items-center justify-between group-hover:text-[#0D47A1]">
                      <span>Open Information Box</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
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
          {(!Array.isArray(delays) || delays.length === 0) ? (
            <div className="text-xs text-[#90A4AE] py-4">All response teams are currently within optimal response windows.</div>
          ) : (
            <div className="space-y-2">
              {delays.map((d, i) => (
                <div key={i} className="p-3 bg-[#EEF2F6] border border-[#DCE3E8] rounded-lg text-xs flex justify-between items-center">
                  <span className="text-[#263238] font-semibold">{d.title || d.incident_type || `Incident #${i+1}`}</span>
                  <span className="text-[#D32F2F] font-mono font-bold">Delay: {d.delay_minutes || d.average_delay_minutes || 15}m</span>
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
          {(!Array.isArray(shortages) || shortages.filter((s) => s.shortage).length === 0) ? (
            <div className="text-xs text-[#90A4AE] py-4">Resource unit capacity is healthy across all operational sectors.</div>
          ) : (
            <div className="space-y-2">
              {shortages.filter((s) => s.shortage).map((s, i) => (
                <div key={i} className="p-3 bg-[#EEF2F6] border border-[#DCE3E8] rounded-lg text-xs flex justify-between items-center">
                  <span className="text-[#263238] capitalize font-medium">{s.resource_type || "Units"}</span>
                  <span className="text-[#F57C00] font-bold">Capacity low in Sector</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Information Box Modal for Staging Recommendation */}
      {selectedStaging && (
        <div
          className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedStaging(null)}
        >
          <div
            className="bg-white border border-[#DCE3E8] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col text-[#263238] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 md:p-5 border-b border-[#DCE3E8] flex items-start justify-between bg-[#F8FAFC]">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-[#E3F2FD] border border-[#90CAF9] rounded-lg text-[#1565C0] mt-0.5">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-[#0B1F33]">
                      {selectedStaging.zone_name}
                    </h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      selectedStaging.predicted_demand_intensity >= 0.8
                        ? "bg-[#FDECEC] text-[#B71C1C] border-[#EF9A9A]"
                        : selectedStaging.predicted_demand_intensity >= 0.5
                        ? "bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]"
                        : "bg-[#E3F2FD] text-[#1565C0] border-[#90CAF9]"
                    }`}>
                      {Math.round(selectedStaging.predicted_demand_intensity * 100)}% Surge
                    </span>
                  </div>
                  <p className="text-xs text-[#607D8B] mt-0.5">
                    Patrol Pre-Deployment & AI Demand Forecast Information
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStaging(null)}
                className="text-[#607D8B] hover:text-[#263238] p-1.5 rounded-lg hover:bg-[#EEF2F6] transition cursor-pointer"
                title="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[72vh] overflow-y-auto">
              {/* Stat Highlight Cards */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-[#F8FAFC] border border-[#DCE3E8] p-3 rounded-lg text-center">
                  <div className="text-[10px] uppercase font-semibold text-[#607D8B]">Demand Intensity</div>
                  <div className="text-lg font-black text-[#1565C0] mt-0.5">
                    {Math.round(selectedStaging.predicted_demand_intensity * 100)}%
                  </div>
                  <div className="text-[10px] text-[#607D8B]">Poisson Surge</div>
                </div>

                <div className="bg-[#F8FAFC] border border-[#DCE3E8] p-3 rounded-lg text-center">
                  <div className="text-[10px] uppercase font-semibold text-[#607D8B]">ETA Savings</div>
                  <div className="text-lg font-black text-[#2E7D32] mt-0.5">
                    ~{selectedStaging.projected_eta_savings_minutes}m
                  </div>
                  <div className="text-[10px] text-[#2E7D32] font-semibold">Faster Response</div>
                </div>

                <div className="bg-[#F8FAFC] border border-[#DCE3E8] p-3 rounded-lg text-center">
                  <div className="text-[10px] uppercase font-semibold text-[#607D8B]">Target Hazard</div>
                  <div className="text-xs font-bold text-[#E65100] mt-1 capitalize truncate">
                    {selectedStaging.target_incident_type.replace(/_/g, " ")}
                  </div>
                  <div className="text-[10px] text-[#607D8B]">Predicted Event</div>
                </div>
              </div>

              {/* Tactical Rationale Box */}
              <div className="bg-[#EAF3FB] border border-[#90CAF9] p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1565C0]">
                  <Zap className="w-4 h-4 text-[#1565C0]" />
                  <span>Tactical Staging Rationale</span>
                </div>
                <p className="text-xs text-[#263238] leading-relaxed">
                  {selectedStaging.tactical_rationale}
                </p>
              </div>

              {/* Geographical & Technical Parameters */}
              <div className="bg-white border border-[#DCE3E8] rounded-lg p-3.5 space-y-2.5 text-xs">
                <div className="font-bold text-[#0B1F33] flex items-center gap-1.5 pb-1 border-b border-[#DCE3E8]">
                  <Navigation className="w-3.5 h-3.5 text-[#1565C0]" />
                  <span>Staging Specifications & Operational Coordinates</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                  <div>
                    <span className="text-[#607D8B] block">Sector Staging ID:</span>
                    <span className="font-mono font-bold text-[#263238]">{selectedStaging.staging_id}</span>
                  </div>
                  <div>
                    <span className="text-[#607D8B] block">Recommended Unit:</span>
                    <span className="font-bold text-[#1565C0] uppercase">
                      {selectedStaging.recommended_unit_type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#607D8B] block">Latitude:</span>
                    <span className="font-mono text-[#263238]">{selectedStaging.latitude.toFixed(5)}° N</span>
                  </div>
                  <div>
                    <span className="text-[#607D8B] block">Longitude:</span>
                    <span className="font-mono text-[#263238]">{selectedStaging.longitude.toFixed(5)}° E</span>
                  </div>
                </div>
              </div>

              {/* Tactical Checklist */}
              <div className="bg-[#F8FAFC] border border-[#DCE3E8] rounded-lg p-3.5 space-y-2 text-xs">
                <div className="font-bold text-[#0B1F33] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#2E7D32]" />
                  <span>Pre-Deployment Protocol Checklist</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-[#607D8B]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                    <span>Corridor clearance along high-probability transit routes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                    <span>Standby perimeter staging active within 500m of target cluster</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2E7D32] shrink-0" />
                    <span>Direct radio telemetry link synced with Dispatch Command</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#DCE3E8] bg-[#F8FAFC] flex items-center justify-between gap-2">
              <div className="text-[11px]">
                {dispatchedStagings[selectedStaging.staging_id] ? (
                  <span className="text-[#2E7D32] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Unit active on standby in {selectedStaging.zone_name.split(" - ")[0]}
                  </span>
                ) : (
                  <span className="text-[#607D8B]">Status: Ready for pre-deployment</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStaging(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#DCE3E8] text-xs font-semibold text-[#607D8B] hover:text-[#263238] hover:bg-[#EEF2F6] transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDispatchedStagings((prev) => ({
                      ...prev,
                      [selectedStaging.staging_id]: !prev[selectedStaging.staging_id],
                    }));
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs transition cursor-pointer flex items-center gap-1.5 ${
                    dispatchedStagings[selectedStaging.staging_id]
                      ? "bg-[#2E7D32] hover:bg-[#1B5E20]"
                      : "bg-[#1565C0] hover:bg-[#0D47A1]"
                  }`}
                >
                  {dispatchedStagings[selectedStaging.staging_id] ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Unit Pre-Positioned
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      Deploy Standby Unit
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
