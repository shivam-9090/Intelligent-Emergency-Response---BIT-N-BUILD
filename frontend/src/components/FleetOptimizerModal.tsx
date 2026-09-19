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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Zap className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white">
                Global Fleet Optimization Engine
              </h2>
              <span className="text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800/80 px-2 py-0.5 rounded-full font-semibold">
                Hungarian Algorithm
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Solves the Mass-Casualty Resource Scarcity Dilemma via Scipy bipartite minimum-cost matching.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Zap className="w-8 h-8 text-amber-400 animate-bounce mx-auto" />
              <p className="text-xs text-slate-300 font-medium">
                Constructing bipartite cost matrix & minimizing city-wide response delay...
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                scipy.optimize.linear_sum_assignment()
              </p>
            </div>
          ) : plan ? (
            <>
              {/* Metrics Highlights Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Efficiency Gain
                  </span>
                  <div className="text-xl font-extrabold text-emerald-400 mt-1 flex items-center gap-1">
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                    +{plan.metrics.efficiency_gain_pct}%
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5">vs. Naive Greedy</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Time Saved
                  </span>
                  <div className="text-xl font-extrabold text-cyan-400 mt-1 flex items-center gap-1">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    {plan.metrics.time_saved_minutes}m
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5">Across All Sectors</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Units Assigned
                  </span>
                  <div className="text-xl font-extrabold text-purple-400 mt-1 flex items-center gap-1">
                    <Shield className="w-4 h-4 text-purple-400" />
                    {plan.metrics.incidents_assigned}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5">Optimal Pairs</span>
                </div>

                <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-xl flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Bottlenecks
                  </span>
                  <div className="text-xl font-extrabold text-amber-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    {plan.metrics.unassigned_bottlenecks}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5">Demand Exceeds Fleet</span>
                </div>
              </div>

              {/* Optimal Assignment List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Globally Optimal Dispatch Matches ({plan.assignments.length})
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Session: {plan.plan_id}
                  </span>
                </div>

                {plan.assignments.length > 0 ? (
                  <div className="space-y-2">
                    {plan.assignments.map((item, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800/70 border border-slate-700/80 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        {/* Incident Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                item.severity === "critical"
                                  ? "bg-rose-950 text-rose-300 border border-rose-800"
                                  : "bg-amber-950 text-amber-300 border border-amber-800"
                              }`}
                            >
                              {item.severity}
                            </span>
                            <span className="font-semibold text-slate-100 truncate">
                              {item.incident_title}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Sector Type: <span className="capitalize text-slate-300">{item.incident_type}</span> | Priority {item.priority}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="hidden md:flex text-slate-500 shrink-0">
                          <ArrowRight className="w-4 h-4" />
                        </div>

                        {/* Matched Unit */}
                        <div className="flex items-center justify-between md:justify-end gap-3 min-w-[200px]">
                          <div>
                            <div className="font-semibold text-slate-200">{item.unit_name}</div>
                            <div className="text-[10px] text-slate-400 capitalize">
                              {item.resource_type} {item.capability ? `(${item.capability})` : ""}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 px-2 py-1 rounded text-xs font-mono text-cyan-300">
                            <Clock className="w-3 h-3 text-cyan-400" />
                            <span>{item.eta_minutes}m</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 text-center py-6 bg-slate-800/30 rounded-xl border border-slate-800">
                    No active emergency incidents currently pending assignment.
                  </div>
                )}
              </div>

              {/* Sector Bottlenecks */}
              {plan.bottlenecks.length > 0 && (
                <div className="space-y-2 pt-1">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Resource Deficit & Sector Bottlenecks ({plan.bottlenecks.length})
                  </h4>
                  <div className="space-y-2">
                    {plan.bottlenecks.map((bot, idx) => (
                      <div
                        key={idx}
                        className="bg-amber-950/30 border border-amber-800/50 p-3 rounded-xl text-xs space-y-1"
                      >
                        <div className="font-semibold text-amber-200">
                          ⚠️ {bot.incident_title} ({bot.severity.toUpperCase()} {bot.incident_type.toUpperCase()})
                        </div>
                        <div className="text-[11px] text-slate-300">
                          {bot.missing_capability}
                        </div>
                        <div className="text-[10px] text-amber-400/90 font-mono">
                          Recommendation: {bot.recommendation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-xs text-slate-500 text-center py-8">
              Failed to calculate fleet optimization plan.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            onClick={runOptimization}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Recalculate
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={() => setIsCommitted(true)}
              disabled={isCommitted || !plan || plan.assignments.length === 0}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                isCommitted
                  ? "bg-emerald-700 text-white cursor-default"
                  : "bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-950"
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

