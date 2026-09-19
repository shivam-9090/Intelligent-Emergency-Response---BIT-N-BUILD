import React, { useEffect, useState } from "react";
import { fetchAnalyticsBreakdown, fetchAnalyticsDelays, fetchAnalyticsShortages } from "../api";
import type { Incident } from "../types";
import { ShieldCheck, AlertTriangle, Clock, Flame, Users } from "lucide-react";

interface AnalyticsViewProps {
  incidents: Incident[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ incidents }) => {
  const [breakdown, setBreakdown] = useState<Record<string, number>>({});
  const [delays, setDelays] = useState<any[]>([]);
  const [shortages, setShortages] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalyticsBreakdown().then(setBreakdown).catch(console.error);
    fetchAnalyticsDelays().then(setDelays).catch(console.error);
    fetchAnalyticsShortages().then(setShortages).catch(console.error);
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
