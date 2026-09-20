import React, { useState, useEffect } from "react";
import type { FleetOptimizationResponse, OptimizedAssignmentItem } from "../types";
import { optimizeFleet } from "../api";
import {
  X,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  RotateCcw,
  Shield,
  MapPin,
  Compass,
  Navigation,
  ChevronRight,
  Radio,
  Flame,
} from "lucide-react";

import { SeverityBadge } from "./SeverityBadge";

interface FleetOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIncident?: (incidentId: string) => void;
}

export const FleetOptimizerModal: React.FC<FleetOptimizerModalProps> = ({
  isOpen,
  onClose,
  onSelectIncident,
}) => {
  const [plan, setPlan] = useState<FleetOptimizationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitted, setIsCommitted] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<OptimizedAssignmentItem | null>(null);

  const runOptimization = async () => {
    setIsLoading(true);
    setIsCommitted(false);
    try {
      const res = await optimizeFleet();
      setPlan(res);
    } catch (err) {
      console.error("Fleet optimization error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runOptimization();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#DCE3E8] w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-[#263238] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#DCE3E8] flex items-start justify-between bg-[#F8FAFC] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-[#E3F2FD] text-[#1565C0] border border-[#90CAF9]">
                <Zap className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-[#0B1F33]">
                Global Fleet Optimization Engine
              </h2>
              <span className="text-[10px] font-mono bg-[#E8F1FA] text-[#1565C0] border border-[#90CAF9] px-2 py-0.5 rounded font-bold">
                Hungarian Algorithm
              </span>
            </div>
            <p className="text-xs text-[#607D8B] mt-1">
              Solves the Mass-Casualty Resource Scarcity Dilemma via Scipy bipartite minimum-cost matching.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#607D8B] hover:text-[#263238] p-1.5 rounded-lg hover:bg-[#EEF2F6] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Zap className="w-8 h-8 text-[#1565C0] animate-bounce mx-auto" />
              <p className="text-xs text-[#263238] font-medium">
                Constructing bipartite cost matrix & minimizing city-wide response delay...
              </p>
              <p className="text-[11px] text-[#607D8B] font-mono">
                scipy.optimize.linear_sum_assignment()
              </p>
            </div>
          ) : plan ? (
            <>
              {/* Metrics Highlights Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#EEF2F6] border border-[#DCE3E8] p-3 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-[#607D8B] uppercase tracking-wider">
                    Efficiency Gain
                  </span>
                  <div className="text-xl font-extrabold text-[#2E7D32] mt-1 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-[#2E7D32]" />
                    +{plan.metrics.efficiency_gain_pct}%
                  </div>
                  <span className="text-[10px] text-[#90A4AE] mt-0.5">vs. Naive Greedy</span>
                </div>

                <div className="bg-[#EEF2F6] border border-[#DCE3E8] p-3 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-[#607D8B] uppercase tracking-wider">
                    Total Time Saved
                  </span>
                  <div className="text-xl font-extrabold text-[#1565C0] mt-1 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-[#1565C0]" />
                    {plan.metrics.time_saved_minutes}m
                  </div>
                  <span className="text-[10px] text-[#90A4AE] mt-0.5">Across All Sectors</span>
                </div>

                <div className="bg-[#EEF2F6] border border-[#DCE3E8] p-3 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-[#607D8B] uppercase tracking-wider">
                    Units Assigned
                  </span>
                  <div className="text-xl font-extrabold text-[#1565C0] mt-1 flex items-center gap-1">
                    <Shield className="w-4 h-4 text-[#1565C0]" />
                    {plan.metrics.incidents_assigned}
                  </div>
                  <span className="text-[10px] text-[#90A4AE] mt-0.5">Optimal Pairs</span>
                </div>

                <div className="bg-[#EEF2F6] border border-[#DCE3E8] p-3 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-[#607D8B] uppercase tracking-wider">
                    Bottlenecks
                  </span>
                  <div className="text-xl font-extrabold text-[#F57C00] mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-[#F57C00]" />
                    {plan.metrics.unassigned_bottlenecks}
                  </div>
                  <span className="text-[10px] text-[#90A4AE] mt-0.5">Demand Exceeds Fleet</span>
                </div>
              </div>

              {/* Optimal Assignment List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#263238] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                    Globally Optimal Dispatch Matches ({plan.assignments.length})
                  </h4>
                  <span className="text-[10px] text-[#607D8B] font-mono">
                    Session: {plan.plan_id}
                  </span>
                </div>

                {plan.assignments.length > 0 ? (
                  <div className="space-y-2">
                    {plan.assignments.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedAssignment(item)}
                        className="bg-white border border-[#DCE3E8] hover:border-[#1565C0] p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:bg-[#F0F7FF] transition shadow-xs cursor-pointer group active:scale-[0.99]"
                        title="Click to inspect information and tactical location"
                      >
                        {/* Incident Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <SeverityBadge severity={item.severity} size="sm" />
                            <span className="font-semibold text-[#0B1F33] truncate group-hover:text-[#1565C0] transition">
                              {item.incident_title}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#607D8B] mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>
                              Sector: <span className="capitalize text-[#263238] font-medium">{item.incident_type.replace(/_/g, " ")}</span>
                            </span>
                            <span>•</span>
                            <span>Priority {item.priority}</span>
                            {item.address && (
                              <>
                                <span>•</span>
                                <span className="text-[#1565C0] font-medium truncate flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3 text-[#D32F2F]" />
                                  {item.address}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="hidden md:flex text-[#90A4AE] group-hover:text-[#1565C0] transition shrink-0">
                          <ArrowRight className="w-4 h-4" />
                        </div>

                        {/* Matched Unit */}
                        <div className="flex items-center justify-between md:justify-end gap-3 min-w-[200px]">
                          <div>
                            <div className="font-semibold text-[#263238] group-hover:text-[#1565C0] transition">{item.unit_name}</div>
                            <div className="text-[10px] text-[#607D8B] capitalize">
                              {item.resource_type} {item.capability ? `(${item.capability})` : ""}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-[#EEF2F6] border border-[#DCE3E8] px-2.5 py-1 rounded text-xs font-mono text-[#1565C0] font-bold shrink-0">
                            <Clock className="w-3 h-3 text-[#1565C0]" />
                            <span>{item.eta_minutes}m</span>
                          </div>

                          <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-[#1565C0] group-hover:translate-x-0.5 transition shrink-0">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-[#90A4AE] text-center py-6 bg-[#EEF2F6] rounded-xl border border-[#DCE3E8]">
                    No active emergency incidents currently pending assignment.
                  </div>
                )}
              </div>

              {/* Sector Bottlenecks */}
              {plan.bottlenecks.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold text-[#E65100] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#F57C00]" />
                    Resource Deficit & Sector Bottlenecks ({plan.bottlenecks.length})
                  </h4>
                  <div className="space-y-2">
                    {plan.bottlenecks.map((bot, idx) => (
                      <div
                        key={idx}
                        className="bg-[#FFF3E0] border border-[#FFCC80] p-3 rounded-xl text-xs space-y-1"
                      >
                        <div className="font-semibold text-[#E65100]">
                          ⚠️ {bot.incident_title} ({bot.severity.toUpperCase()} {bot.incident_type.toUpperCase()})
                        </div>
                        <div className="text-[11px] text-[#263238]">
                          {bot.missing_capability}
                        </div>
                        <div className="text-[10px] text-[#E65100] font-mono">
                          Recommendation: {bot.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-[#90A4AE] text-center py-8">
              Failed to calculate fleet optimization plan.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#DCE3E8] bg-[#EEF2F6] flex items-center justify-between">
          <button
            onClick={runOptimization}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#263238] hover:text-[#1565C0] bg-white hover:bg-[#E8F1FA] border border-[#DCE3E8] flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Recalculate
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#263238] bg-white border border-[#DCE3E8] hover:bg-[#E8F1FA] transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => setIsCommitted(true)}
              disabled={isCommitted || !plan || plan.assignments.length === 0}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                isCommitted
                  ? "bg-[#2E7D32] text-white cursor-default"
                  : "bg-[#1565C0] hover:bg-[#0D47A1] text-white shadow-sm"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              {isCommitted ? "Fleet Dispatched" : "Commit Optimal Dispatch"}
            </button>
          </div>
        </div>
      </div>

      {/* Information & Location Box Modal for Selected Optimal Match */}
      {selectedAssignment && (
        <div
          className="fixed inset-0 z-[2200] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedAssignment(null)}
        >
          <div
            className="bg-white rounded-2xl border border-[#DCE3E8] p-5 sm:p-6 max-w-xl w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-[#263238]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#DCE3E8]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#E3F2FD] border border-[#90CAF9] flex items-center justify-center text-[#1565C0]">
                  <MapPin className="w-5 h-5 text-[#1565C0]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#0B1F33]">
                      Dispatch Match Intelligence
                    </h3>
                    <SeverityBadge severity={selectedAssignment.severity} size="sm" />
                  </div>
                  <p className="text-xs text-[#607D8B]">
                    Hungarian Algorithm Optimal Deployment Telemetry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-[#90A4AE] hover:text-[#263238] p-1.5 rounded-lg hover:bg-[#EEF2F6] transition cursor-pointer"
                aria-label="Close information box"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Location & GPS Telemetry Card */}
            <div className="bg-[#F8FAFC] border border-[#DCE3E8] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#607D8B] flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#1565C0]" />
                  Incident Geographic Location
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#DCE3E8] text-[#1565C0] font-bold">
                  Target Zone
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-[#DCE3E8]">
                  <div className="text-[10px] text-[#90A4AE] uppercase font-bold">Incident Address</div>
                  <div className="text-xs font-bold text-[#0B1F33] mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#D32F2F] shrink-0" />
                    <span className="truncate">{selectedAssignment.address || "Bangalore City Center"}</span>
                  </div>
                  <div className="text-[11px] text-[#607D8B] font-mono mt-1">
                    📍 {selectedAssignment.latitude?.toFixed(4) ?? "12.9716"}° N, {selectedAssignment.longitude?.toFixed(4) ?? "77.5946"}° E
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-[#DCE3E8]">
                  <div className="text-[10px] text-[#90A4AE] uppercase font-bold">Matched Unit Location</div>
                  <div className="text-xs font-bold text-[#0B1F33] mt-0.5 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-[#1565C0] shrink-0" />
                    <span className="truncate">{selectedAssignment.unit_name}</span>
                  </div>
                  <div className="text-[11px] text-[#607D8B] font-mono mt-1">
                    🚒 {selectedAssignment.unit_latitude?.toFixed(4) ?? "12.9716"}° N, {selectedAssignment.unit_longitude?.toFixed(4) ?? "77.5946"}° E
                  </div>
                </div>
              </div>

              {/* Transit Corridor & Transit ETA */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#E8F1FA] border border-[#B3D7F5] text-xs">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-[#1565C0]" />
                  <span className="font-semibold text-[#0B1F33]">Transit Corridor:</span>
                  <span className="text-[#607D8B]">Direct Emergency Response Lane</span>
                </div>
                <div className="flex items-center gap-1 font-mono font-bold text-[#1565C0]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>ETA: {selectedAssignment.eta_minutes}m</span>
                </div>
              </div>
            </div>

            {/* Incident & Resource Assignment Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Incident Side */}
              <div className="p-3 rounded-xl bg-white border border-[#DCE3E8] space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-[#607D8B] flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-[#D32F2F]" />
                  Incident Intelligence
                </div>
                <div className="font-bold text-[#0B1F33] text-sm">
                  {selectedAssignment.incident_title}
                </div>
                <div className="text-[#607D8B] capitalize">
                  Type: <span className="font-semibold text-[#263238]">{selectedAssignment.incident_type.replace(/_/g, " ")}</span>
                </div>
                <div className="text-[#607D8B]">
                  Priority: <span className="font-bold text-[#0B1F33]">Level {selectedAssignment.priority}</span>
                </div>
                {selectedAssignment.incident_description && (
                  <p className="text-[11px] text-[#455A64] bg-[#F8FAFC] p-2 rounded border border-[#EEF2F6] italic line-clamp-2 mt-1">
                    "{selectedAssignment.incident_description}"
                  </p>
                )}
              </div>

              {/* Resource Side */}
              <div className="p-3 rounded-xl bg-white border border-[#DCE3E8] space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-[#607D8B] flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-[#1565C0]" />
                  Assigned Response Unit
                </div>
                <div className="font-bold text-[#0B1F33] text-sm">
                  {selectedAssignment.unit_name}
                </div>
                <div className="text-[#607D8B] capitalize">
                  Resource: <span className="font-semibold text-[#263238]">{selectedAssignment.resource_type}</span>
                </div>
                <div className="text-[#607D8B] capitalize">
                  Capability: <span className="font-semibold text-[#1565C0]">{selectedAssignment.capability || "All-Hazard Standard"}</span>
                </div>
                <div className="text-[11px] font-mono text-[#2E7D32] bg-[#E8F5E9] px-2 py-0.5 rounded border border-[#C8E6C9] inline-block font-semibold mt-1">
                  Status: Optimal Match Dispatched
                </div>
              </div>
            </div>

            {/* Algorithmic Optimality Rationale */}
            <div className="p-3 rounded-xl bg-[#FFF8E1] border border-[#FFE082] text-xs space-y-1">
              <div className="font-bold text-[#B78103] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#F57C00]" />
                Hungarian Algorithm Mathematical Rationale
              </div>
              <p className="text-[11px] text-[#455A64]">
                This assignment achieved a minimized total urgency-cost score of{" "}
                <span className="font-bold font-mono text-[#0B1F33]">{selectedAssignment.urgency_cost_score}</span>.
                Severity priority was weighted to guarantee minimal response latency for high-risk hazards.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#DCE3E8]">
              {onSelectIncident ? (
                <button
                  type="button"
                  onClick={() => {
                    const id = selectedAssignment.incident_id;
                    setSelectedAssignment(null);
                    onSelectIncident(id);
                  }}
                  className="px-4 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>View Location on Live Map</span>
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="px-4 py-2 bg-white hover:bg-[#EEF2F6] text-[#263238] border border-[#DCE3E8] text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
