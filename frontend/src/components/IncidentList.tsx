import React, { useState } from "react";
import type { Incident } from "../types";
import { Search, Flame, Droplets, AlertOctagon, Car, HeartPulse, HelpCircle, Layers } from "lucide-react";

interface IncidentListProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  fire: <Flame className="w-4 h-4 text-rose-500" />,
  flood: <Droplets className="w-4 h-4 text-blue-400" />,
  industrial_accident: <AlertOctagon className="w-4 h-4 text-purple-400" />,
  road_accident: <Car className="w-4 h-4 text-amber-400" />,
  medical: <HeartPulse className="w-4 h-4 text-emerald-400" />,
  other: <HelpCircle className="w-4 h-4 text-slate-400" />,
};

const SEVERITY_BADGES: Record<string, string> = {
  critical: "bg-rose-950/80 text-rose-300 border-rose-700",
  high: "bg-orange-950/80 text-orange-300 border-orange-700",
  medium: "bg-amber-950/80 text-amber-300 border-amber-700",
  low: "bg-blue-950/80 text-blue-300 border-blue-700",
};

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  selectedIncident,
  onSelectIncident,
}) => {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const filtered = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(search.toLowerCase()) ||
      (inc.address && inc.address.toLowerCase().includes(search.toLowerCase())) ||
      (inc.description && inc.description.toLowerCase().includes(search.toLowerCase()));
    const matchesSeverity =
      severityFilter === "all" || inc.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="w-96 h-full bg-slate-900/95 backdrop-blur border-r border-slate-800 flex flex-col z-10">
      {/* Search and Filters Header */}
      <div className="p-4 border-b border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Active Incidents ({filtered.length})
          </h2>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search address, keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
          {["all", "critical", "high", "medium", "low"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition whitespace-nowrap ${
                severityFilter === sev
                  ? "bg-rose-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Scrollable Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-slate-800/50">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No emergency incidents match current filter.
          </div>
        ) : (
          filtered.map((inc) => {
            const isSelected = selectedIncident?.id === inc.id;
            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className={`pt-2.5 p-3 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? "bg-rose-950/30 border-rose-600/80 shadow-md shadow-rose-950/50"
                    : "bg-slate-800/50 hover:bg-slate-800 border-slate-700/60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {TYPE_ICONS[inc.incident_type] || <HelpCircle className="w-4 h-4 text-slate-400" />}
                    <h3 className="text-xs font-bold text-slate-100 line-clamp-1">
                      {inc.title}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border uppercase tracking-wider ${
                      SEVERITY_BADGES[inc.severity] || "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {inc.description || "No description provided."}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-500">
                  <span className="truncate max-w-[180px]">
                    📍 {inc.address || "Sector Coordinates"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {inc.duplicate_of_id && (
                      <span className="flex items-center gap-1 bg-amber-950/60 border border-amber-800 text-amber-300 px-1.5 py-0.5 rounded font-medium">
                        <Layers className="w-3 h-3" /> Merged
                      </span>
                    )}
                    <span className="text-slate-400 font-mono">P{inc.priority}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
