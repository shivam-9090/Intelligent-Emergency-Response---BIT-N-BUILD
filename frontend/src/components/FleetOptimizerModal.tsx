import React, { useState, useEffect } from "react";
import type { FleetOptimizationResponse } from "../types";
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
} from "lucide-react";

import { SeverityBadge } from "./SeverityBadge";

interface FleetOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FleetOptimizerModal: React.FC<FleetOptimizerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [plan, setPlan] = useState<FleetOptimizationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitted, setIsCommitted] = useState(false);

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
                        className="bg-white border border-[#DCE3E8] p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs hover:bg-[#F8FAFC] transition shadow-xs"
                      >
                        {/* Incident Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <SeverityBadge severity={item.severity} size="sm" />
                            <span className="font-semibold text-[#0B1F33] truncate">
                              {item.incident_title}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#607D8B] mt-0.5">
                            Sector Type: <span className="capitalize text-[#263238] font-medium">{item.incident_type.replace(/_/g, " ")}</span> | Priority {item.priority}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="hidden md:flex text-[#90A4AE] shrink-0">
                          <ArrowRight className="w-4 h-4" />
                        </div>

                        {/* Matched Unit */}
                        <div className="flex items-center justify-between md:justify-end gap-3 min-w-[200px]">
                          <div>
                            <div className="font-semibold text-[#263238]">{item.unit_name}</div>
                            <div className="text-[10px] text-[#607D8B] capitalize">
                              {item.resource_type} {item.capability ? `(${item.capability})` : ""}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-[#EEF2F6] border border-[#DCE3E8] px-2 py-1 rounded text-xs font-mono text-[#1565C0] font-bold">
                            <Clock className="w-3 h-3 text-[#1565C0]" />
                            <span>{item.eta_minutes}m</span>
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
    </div>
  );
};
