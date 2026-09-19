import React, { useState } from "react";
import type { Incident } from "../types";
import { Search, ChevronDown, Flame, Droplets, AlertOctagon, Car, HeartPulse, HelpCircle, Layers, ShieldCheck, ChevronRight, MapPin } from "lucide-react";
import { SeverityBadge } from "./SeverityBadge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "./ui/input-group";

interface IncidentListProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  fire: <Flame className="w-3.5 h-3.5 text-[#D32F2F]" />,
  flood: <Droplets className="w-3.5 h-3.5 text-[#1565C0]" />,
  industrial_accident: <AlertOctagon className="w-3.5 h-3.5 text-[#F57C00]" />,
  road_accident: <Car className="w-3.5 h-3.5 text-[#F9A825]" />,
  medical: <HeartPulse className="w-3.5 h-3.5 text-[#2E7D32]" />,
  other: <HelpCircle className="w-3.5 h-3.5 text-[#607D8B]" />,
};

const SEVERITY_LEFT_ACCENTS: Record<string, string> = {
  critical: "border-l-[#D32F2F]",
  high: "border-l-[#F57C00]",
  medium: "border-l-[#F9A825]",
  low: "border-l-[#1565C0]",
  resolved: "border-l-[#2E7D32]",
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
    <aside className="z-10 flex h-full w-88 shrink-0 flex-col bg-white text-slate-900 lg:w-96">
      {/* Search and Filters Header */}
      <div className="space-y-3 border-b border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div><p className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">Response queue</p><h2 className="mt-0.5 text-sm font-semibold tracking-tight text-slate-950">Active incidents</h2></div>
            <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-600">
              {filtered.length}
            </span>
          </div>
          <span className="text-[10px] font-mono font-semibold text-emerald-600">● LIVE</span>
        </div>

        <div className="flex items-center gap-2">
          <InputGroup className="flex-1 bg-white border-[#DCE3E8] focus-within:border-[#1565C0]">
            <InputGroupAddon>
              <Search className="w-3.5 h-3.5 text-[#607D8B]" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-[#0B1F33] font-medium placeholder:text-[#90A4AE]"
            />
          </InputGroup>

          {/* Severity Dropdown next to Search */}
          <div className="relative shrink-0">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-white border border-[#DCE3E8] text-[#263238] hover:border-[#B0BEC5] focus:border-[#1565C0] text-xs rounded-lg pl-2.5 pr-7 py-1.5 focus:outline-none cursor-pointer capitalize appearance-none font-medium h-9 shadow-xs transition"
              aria-label="Filter severity"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown className="w-3 h-3 text-[#607D8B] absolute right-2 top-3 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Incidents Scrollable Feed */}
      <div className="flex-1 space-y-1.5 overflow-y-auto bg-slate-50/70 p-2.5">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-[#E8F1FA] border border-[#DCE3E8] flex items-center justify-center text-[#2E7D32] mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-[#0B1F33]">All monitored sectors are currently clear.</p>
            <p className="text-xs text-[#607D8B] mt-1">No emergency incidents match current filter.</p>
          </div>
        ) : (
          filtered.map((inc) => {
            const isSelected = selectedIncident?.id === inc.id;
            const leftAccent = SEVERITY_LEFT_ACCENTS[inc.severity] || "border-l-[#90A4AE]";
            return (
              <button
                type="button"
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                aria-pressed={isSelected}
                className={`group relative w-full rounded-2xl border p-3 text-left transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1565C0] ${leftAccent} ${
                  isSelected
                    ? "bg-slate-950 border-slate-950 text-white shadow-lg shadow-slate-300/70"
                    : "bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md border-slate-200 text-slate-900 shadow-sm"
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.12em] ${isSelected ? "text-cyan-300" : "text-slate-500"}`}>
                    {TYPE_ICONS[inc.incident_type] || <HelpCircle className="w-3.5 h-3.5 text-[#607D8B]" />}
                    <span>{inc.incident_type.replace(/_/g, " ")}</span>
                  </div>
                  <SeverityBadge severity={inc.severity} size="sm" />
                </div>
                <div className="flex items-start gap-2"><div className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg ${isSelected ? "bg-white/10" : "bg-slate-100"}`}>{TYPE_ICONS[inc.incident_type] || <HelpCircle className="size-3.5 text-slate-500" />}</div><div className="min-w-0 flex-1"><h3 className={`line-clamp-2 text-[13px] font-semibold leading-snug ${isSelected ? "text-white" : "text-slate-900"}`}>{inc.title}</h3><p className={`mt-0.5 line-clamp-2 text-[11px] leading-relaxed ${isSelected ? "text-slate-300" : "text-slate-500"}`}>{inc.description || "No description recorded."}</p></div><ChevronRight className={`mt-1 size-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${isSelected ? "text-cyan-300" : "text-slate-400"}`} /></div>
                <div className={`mt-2 flex items-center justify-between border-t pt-2 text-[10px] ${isSelected ? "border-white/10 text-slate-300" : "border-slate-100 text-slate-500"}`}><span className="flex min-w-0 items-center gap-1.5 font-medium"><MapPin className="size-3 shrink-0 text-rose-400" /><span className="truncate">{inc.address || "Coordinates pending"}</span></span><div className="ml-2 flex shrink-0 items-center gap-1.5">
                    {inc.duplicate_of_id && (
                      <span className="flex items-center gap-0.5 rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">
                        <Layers className="w-3 h-3" /> Merged
                      </span>
                    )}
                    <span className={`rounded px-1.5 py-0.5 font-mono font-bold ${isSelected ? "bg-white/10 text-white" : "bg-slate-100 text-slate-700"}`}>
                      P{inc.priority}
                    </span>
                  </div></div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
