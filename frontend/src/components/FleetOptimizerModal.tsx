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
  Workflow,
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

  const runOptimization = async () => {
    setIsLoading(true);
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

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="fleet-optimizer-title" className="flex max-h-[min(86vh,820px)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 md:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-950 text-cyan-300 shadow-sm">
                <Workflow className="size-4" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 id="fleet-optimizer-title" className="font-heading text-lg font-semibold tracking-tight text-slate-950">Fleet allocation plan</h2>
                  <span className="rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-sky-700">{plan?.algorithm || "Matching engine"}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">A recommended allocation only. Assignment requires the authenticated dispatch workflow.</p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            autoFocus
            className="text-[#607D8B] hover:text-[#263238] p-1.5 rounded-lg hover:bg-[#EEF2F6] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-5 overflow-y-auto bg-white p-5 md:p-6">
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
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 text-white shadow-sm">
                <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">Proposed allocation</p>
                    <p className="mt-0.5 text-xs text-slate-300">Calculated for the current incident and unit snapshot</p>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 font-mono text-[9px] text-slate-300">Plan {plan.plan_id.slice(0, 8)}</span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-y divide-white/10 md:grid-cols-4 md:divide-y-0">
                  <div className="p-3.5">
                    <span className="text-[10px] font-medium uppercase tracking-[.12em] text-slate-400">Efficiency</span>
                    <div className="mt-1 flex items-center gap-1 text-xl font-semibold text-emerald-300"><TrendingDown className="size-4" />+{plan.metrics.efficiency_gain_pct}%</div>
                    <span className="mt-0.5 block text-[10px] text-slate-400">vs. greedy allocation</span>
                  </div>
                  <div className="p-3.5">
                    <span className="text-[10px] font-medium uppercase tracking-[.12em] text-slate-400">Time reclaimed</span>
                    <div className="mt-1 flex items-center gap-1 text-xl font-semibold text-cyan-200"><Clock className="size-4" />{plan.metrics.time_saved_minutes}m</div>
                    <span className="mt-0.5 block text-[10px] text-slate-400">across assigned sectors</span>
                  </div>
                  <div className="p-3.5">
                    <span className="text-[10px] font-medium uppercase tracking-[.12em] text-slate-400">Matched</span>
                    <div className="mt-1 flex items-center gap-1 text-xl font-semibold text-white"><Shield className="size-4 text-cyan-200" />{plan.metrics.incidents_assigned}</div>
                    <span className="mt-0.5 block text-[10px] text-slate-400">incident-unit pairs</span>
                  </div>
                  <div className="p-3.5">
                    <span className="text-[10px] font-medium uppercase tracking-[.12em] text-slate-400">Exceptions</span>
                    <div className="mt-1 flex items-center gap-1 text-xl font-semibold text-amber-300"><AlertTriangle className="size-4" />{plan.metrics.unassigned_bottlenecks}</div>
                    <span className="mt-0.5 block text-[10px] text-slate-400">need mutual-aid review</span>
                  </div>
                </div>
              </section>

              {/* Optimal Assignment List */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 px-4 py-3.5 text-sm font-semibold text-slate-900">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    Recommended matches <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">{plan.assignments.length}</span>
                  </h4>
                  <span className="mr-4 text-[10px] text-slate-500">
                    Lowest combined ETA
                  </span>
                </div>

                {plan.assignments.length > 0 ? (
                  <div className="divide-y divide-slate-100 border-t border-slate-100">
                    {plan.assignments.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col justify-between gap-3 px-4 py-3.5 text-xs transition-colors hover:bg-slate-50 md:flex-row md:items-center"
                      >
                        {/* Incident Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <SeverityBadge severity={item.severity} size="sm" />
                            <span className="font-semibold text-[#0B1F33] truncate">
                              {item.incident_title}
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] text-slate-500">
                            <span className="capitalize">{item.incident_type.replace(/_/g, " ")}</span><span className="mx-1.5 text-slate-300">•</span>Priority {item.priority}
                          </div>
                        </div>

                        {/* Arrow */}
                        <div className="hidden shrink-0 text-slate-300 md:flex">
                          <ArrowRight className="w-4 h-4" />
                        </div>

                        {/* Matched Unit */}
                        <div className="flex min-w-[200px] items-center justify-between gap-3 md:justify-end">
                          <div>
                            <div className="font-semibold text-slate-800">{item.unit_name}</div>
                            <div className="mt-0.5 text-[10px] capitalize text-slate-500">
                              {item.resource_type} {item.capability ? `(${item.capability})` : ""}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 rounded-lg border border-sky-100 bg-sky-50 px-2 py-1 font-mono text-[10px] font-semibold text-sky-700">
                            <Clock className="size-3" />
                            <span>{item.eta_minutes}m</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-t border-slate-100 py-6 text-center text-xs text-slate-500">
                    No active emergency incidents currently pending assignment.
                  </div>
                )}
              </section>

              {/* Sector Bottlenecks */}
              {plan.bottlenecks.length > 0 && (
                <section className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/40">
                  <div className="flex items-center justify-between border-b border-amber-200 bg-amber-50 px-4 py-3">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                      <AlertTriangle className="size-4 text-amber-600" /> Exceptions requiring review
                    </h4>
                    <span className="rounded-full border border-amber-200 bg-white px-1.5 py-0.5 font-mono text-[9px] font-semibold text-amber-700">{plan.bottlenecks.length}</span>
                  </div>
                  <div className="divide-y divide-amber-200/70">
                    {plan.bottlenecks.map((bot, idx) => (
                      <div
                        key={idx}
                        className="grid gap-2 px-4 py-3 text-xs md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] md:gap-5"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2"><SeverityBadge severity={bot.severity} size="sm" /><span className="truncate font-semibold text-slate-800">{bot.incident_title}</span></div>
                          <p className="mt-1 text-[10px] text-amber-800">Missing: <span className="font-medium">{bot.missing_capability}</span></p>
                        </div>
                        <p className="text-[11px] leading-5 text-slate-600"><span className="font-semibold text-amber-800">Recommended next step: </span>{bot.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <div className="text-xs text-[#90A4AE] text-center py-8">
              Failed to calculate fleet optimization plan.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-3">
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
              type="button"
              disabled
              title="This screen calculates a plan; it does not persist assignments."
              className="text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 bg-[#90A4AE] text-white cursor-not-allowed"
            >
              <Zap className="w-3.5 h-3.5" />
              Plan Only — Dispatch Pending
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
