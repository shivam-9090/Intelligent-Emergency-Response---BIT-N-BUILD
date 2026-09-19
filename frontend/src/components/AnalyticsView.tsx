import React, { useEffect, useState } from "react";
import {
  fetchAnalyticsBreakdown,
  fetchAnalyticsDelays,
  fetchAnalyticsShortages,
  fetchModelEvaluation,
  fetchPredictiveDemandForecast,
} from "../api";
import type {
  Incident,
  IncidentBreakdownResponse,
  ModelEvaluationSummary,
  PredictiveDemandResponse,
  ResourceShortage,
  ResponseDelayStats,
} from "../types";
import { ShieldCheck, AlertTriangle, Clock, Flame, Users, Radio, Activity, CheckCircle2, Cpu } from "lucide-react";

interface AnalyticsViewProps {
  incidents: Incident[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ incidents }) => {
  const [breakdown, setBreakdown] = useState<IncidentBreakdownResponse | null>(null);
  const [delays, setDelays] = useState<ResponseDelayStats | null>(null);
  const [shortages, setShortages] = useState<ResourceShortage[] | null>(null);
  const [analyticsError, setAnalyticsError] = useState(false);
  const [predictiveDemand, setPredictiveDemand] = useState<PredictiveDemandResponse | null>(null);
  const [modelEval, setModelEval] = useState<ModelEvaluationSummary | null>(null);

  useEffect(() => {
    let isCurrent = true;
    const loadAnalytics = async () => {
      const [breakdownResult, delaysResult, shortagesResult, demandResult, evalResult] = await Promise.allSettled([
        fetchAnalyticsBreakdown(),
        fetchAnalyticsDelays(),
        fetchAnalyticsShortages(),
        fetchPredictiveDemandForecast(2),
        fetchModelEvaluation(),
      ]);
      if (!isCurrent) return;
      if (breakdownResult.status === "fulfilled") setBreakdown(breakdownResult.value);
      if (delaysResult.status === "fulfilled") setDelays(delaysResult.value);
      if (shortagesResult.status === "fulfilled") setShortages(shortagesResult.value);
      if (demandResult.status === "fulfilled") setPredictiveDemand(demandResult.value);
      if (evalResult.status === "fulfilled") setModelEval(evalResult.value);
      setAnalyticsError(
        [breakdownResult, delaysResult, shortagesResult, demandResult].some((result) => result.status === "rejected")
      );
    };
    void loadAnalytics();
    return () => {
      isCurrent = false;
    };
  }, []);

  const totalIncidents = incidents.length;
  const criticalCount = incidents.filter((i) => i.severity === "critical").length;
  const highCount = incidents.filter((i) => i.severity === "high").length;
  const duplicateCount = incidents.filter((i) => i.duplicate_of_id !== null).length;

  return (
    <div className="h-full w-full space-y-5 overflow-y-auto bg-[#e8edf5] p-4 text-slate-900 md:p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-sky-700">Decision intelligence</p><h2 className="mt-1 font-heading text-2xl font-semibold tracking-tight text-slate-950">City operations pulse</h2>
        <p className="mt-1 text-sm text-slate-500">
          A live read on incident pressure, response capacity, and near-term demand.
        </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500"><span className="size-2 rounded-full bg-emerald-500" />Live operational snapshot</div>
      </div>

      {analyticsError && (
        <div role="alert" className="rounded-lg border border-[#EF9A9A] bg-[#FDECEC] px-4 py-3 text-xs text-[#B71C1C]">
          Some analytics data is unavailable. Figures shown below may be incomplete; retry the page when the service recovers.
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.13em] text-slate-500">
            <span>Total incidents</span><Flame className="size-4 text-sky-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{totalIncidents}</div>
          <div className="mt-1 text-[10px] text-slate-500">across all sectors</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.13em] text-rose-700">
            <span>Critical</span><AlertTriangle className="size-4 text-rose-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-rose-700">{criticalCount}</div>
          <div className="mt-1 text-[10px] text-slate-500">priority 1 threats</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.13em] text-orange-700">
            <span>High severity</span><Clock className="size-4 text-orange-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-orange-700">{highCount}</div>
          <div className="mt-1 text-[10px] text-slate-500">urgent coordination</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[.13em] text-emerald-700">
            <span>Consolidated</span><ShieldCheck className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-emerald-700">{duplicateCount}</div>
          <div className="mt-1 text-[10px] text-slate-500">duplicate reports merged</div>
        </div>
      </section>

      {/* Incident Category Breakdown */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-slate-900">Incident mix</h3><p className="mt-0.5 text-[11px] text-slate-500">Where the current response load is concentrated</p></div><Activity className="size-4 text-sky-600" /></div>
        <div className="space-y-3.5">
          {!breakdown || breakdown.by_type.length === 0 ? (
            <div className="text-xs text-[#90A4AE] py-4">No category data yet.</div>
          ) : (
            breakdown.by_type.map(({ incident_type, count }) => {
              const pct = breakdown.total > 0 ? (count / breakdown.total) * 100 : 0;
              return (
                <div key={incident_type} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium capitalize text-slate-700">
                    <span>{incident_type.replace("_", " ")}</span>
                    <span className="font-mono text-slate-500">{count} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-sky-600 transition-all duration-500"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* AI Spatio-Temporal Demand Forecast & Pre-Deployment Staging Panel */}
      {predictiveDemand && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white shadow-sm md:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-white/10 text-cyan-200"><Radio className="size-4" /></span>
                <div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-cyan-300">Forecast window</p><h3 className="mt-0.5 text-sm font-semibold">Pre-deployment recommendations</h3></div>
              </div>
              <p className="mt-2 text-xs text-slate-300">
                A {predictiveDemand.forecast_horizon_hours}h scenario layer suggests where standby capacity may protect response time; validate before dispatch.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-md border border-amber-300/40 bg-amber-300/10 px-2.5 py-1 font-mono text-amber-200">
                Risk {predictiveDemand.city_wide_risk_index}%
              </span>
              <span className="rounded-md border border-emerald-300/40 bg-emerald-300/10 px-2.5 py-1 font-mono font-semibold text-emerald-200">
                +{predictiveDemand.total_projected_eta_savings_minutes}m saved
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {predictiveDemand.staging_recommendations.map((st) => (
              <div key={st.staging_id} className="flex flex-col justify-between space-y-2 rounded-xl border border-white/10 bg-white/[0.06] p-3.5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{st.zone_name}</span>
                    <span className="rounded-md border border-sky-300/30 bg-sky-300/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-sky-200">
                      {Math.round(st.predicted_demand_intensity * 100)}% Surge
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
                    Stage: {st.recommended_unit_type.replace(/_/g, " ")}
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-300">
                    {st.tactical_rationale}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-white/10 pt-2 text-[10px]">
                  <span className="text-slate-400">Projected benefit</span>
                  <span className="font-mono font-semibold text-emerald-200">
                    ~{st.projected_eta_savings_minutes}m faster
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-3 font-mono text-[10px] text-slate-400">
            <span>Grid Points Calculated: {predictiveDemand.heatmap_grid.length} cells</span>
              <span title={predictiveDemand.validation_status}>Scenario only · {predictiveDemand.validation_status}</span>
          </div>
        </section>
      )}

      {/* Resource Allocation & Delays */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3.5"><Clock className="size-4 text-orange-600" /><div><h3 className="text-sm font-semibold text-slate-900">Response delays</h3><p className="text-[10px] text-slate-500">Average response time by incident category</p></div></div>
          {!delays || delays.by_type.length === 0 ? (
            <div className="px-4 py-5 text-xs text-slate-500">All response teams are currently within optimal response windows.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {delays.by_type.map((delay) => (
                <div key={delay.incident_type} className="flex items-center justify-between px-4 py-3 text-xs">
                  <span className="font-medium capitalize text-slate-700">{delay.incident_type.replace(/_/g, " ")} <span className="font-normal text-slate-400">· {delay.sample_size} responses</span></span>
                  <span className="font-mono font-semibold text-rose-700">{delay.average_minutes.toFixed(1)}m</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3.5"><Users className="size-4 text-sky-600" /><div><h3 className="text-sm font-semibold text-slate-900">Resource capacity</h3><p className="text-[10px] text-slate-500">Available units across operational sectors</p></div></div>
          {!shortages || shortages.length === 0 ? (
            <div className="px-4 py-5 text-xs text-slate-500">Resource unit capacity is healthy across all operational sectors.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {shortages.map((s, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3 text-xs">
                  <span className="font-medium capitalize text-slate-700">{s.resource_type || "Units"}</span>
                  <span className={s.shortage ? "font-mono font-semibold text-orange-700" : "font-mono font-semibold text-emerald-700"}>{s.available}/{s.total} ready</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ML Classifier Evaluation & Calibration Card */}
      {modelEval && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col justify-between gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Cpu className="size-5 text-indigo-600" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  ML Classifier Evaluation & Calibration Diagnostics
                </h3>
                <p className="text-[11px] text-slate-500">
                  Holdout validation metrics: precision, recall, and calibration status by class and severity.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-mono font-medium text-indigo-700">
                v{modelEval.model_version}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700">
                <CheckCircle2 className="size-3 text-emerald-600" />
                {modelEval.calibration_status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Incident Type Acc</div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-900">
                {(modelEval.incident_type_accuracy * 100).toFixed(1)}%
              </div>
              <div className="mt-0.5 text-[10px] text-slate-400">Macro F1: {(modelEval.incident_type_macro_f1 * 100).toFixed(1)}%</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Severity Acc</div>
              <div className="mt-1 font-mono text-xl font-bold text-slate-900">
                {(modelEval.severity_accuracy * 100).toFixed(1)}%
              </div>
              <div className="mt-0.5 text-[10px] text-slate-400">Macro F1: {(modelEval.severity_macro_f1 * 100).toFixed(1)}%</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Split Protocol</div>
              <div className="mt-1 text-xs font-medium text-slate-800 line-clamp-1" title={modelEval.split_strategy}>
                {modelEval.split_strategy}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-400">Holdout validation</div>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Dataset Hash</div>
              <div className="mt-1 font-mono text-xs text-slate-700 truncate" title={modelEval.dataset_sha256 || "N/A"}>
                {modelEval.dataset_sha256 ? `${modelEval.dataset_sha256.slice(0, 10)}...` : "synthetic-v1"}
              </div>
              <div className="mt-0.5 text-[10px] text-slate-400">Reproducibility key</div>
            </div>
          </div>

          {/* Breakdown by Incident Type */}
          {Object.keys(modelEval.incident_type_classes).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-800 mb-2">Class Precision & Recall (Incident Type)</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {Object.entries(modelEval.incident_type_classes).map(([cName, metric]) => (
                  <div key={cName} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-[11px]">
                    <div className="font-semibold capitalize text-slate-800 truncate">{cName.replace(/_/g, " ")}</div>
                    <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-slate-600">
                      <span>P: {(metric.precision * 100).toFixed(0)}%</span>
                      <span>R: {(metric.recall * 100).toFixed(0)}%</span>
                      <span>F1: {(metric.f1_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown by Severity */}
          {Object.keys(modelEval.severity_classes).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-800 mb-2">Class Precision & Recall (Severity)</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(modelEval.severity_classes).map(([sName, metric]) => (
                  <div key={sName} className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-[11px]">
                    <div className="font-semibold capitalize text-slate-800">{sName}</div>
                    <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-slate-600">
                      <span>Precision: {(metric.precision * 100).toFixed(0)}%</span>
                      <span>Recall: {(metric.recall * 100).toFixed(0)}%</span>
                      <span>F1: {(metric.f1_score * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
