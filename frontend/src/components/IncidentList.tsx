import React, { useState } from "react";
import type { Incident } from "../types";
import { Search, Flame, Droplets, AlertOctagon, Car, HeartPulse, HelpCircle, Layers } from "lucide-react";

interface IncidentListProps {
  incidents: Incident[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  fire: <Flame className="w-4 h-4 text-[#D32F2F]" />,
  flood: <Droplets className="w-4 h-4 text-[#1565C0]" />,
  industrial_accident: <AlertOctagon className="w-4 h-4 text-[#F57C00]" />,
  road_accident: <Car className="w-4 h-4 text-[#F9A825]" />,
  medical: <HeartPulse className="w-4 h-4 text-[#2E7D32]" />,
  other: <HelpCircle className="w-4 h-4 text-[#607D8B]" />,
};

const SEVERITY_BADGES: Record<string, string> = {
  critical: "bg-[#FDECEC] text-[#B71C1C] border-[#EF9A9A]",
  high: "bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]",
  medium: "bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]",
  low: "bg-[#E3F2FD] text-[#1565C0] border-[#90CAF9]",
  resolved: "bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]",
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
    <div className="w-96 h-full bg-[#0B1F33] border-r border-[#102A43] flex flex-col z-10 select-none">
      {/* Search and Filters Header */}
      <div className="p-4 border-b border-[#102A43] space-y-3 bg-[#0B1F33]">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D32F2F] animate-pulse" />
            Active Incidents ({filtered.length})
          </h2>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#90A4AE] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search address, keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#102A43] border border-[#163A59] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-[#90A4AE] focus:outline-none focus:border-[#1565C0] transition"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
          {["all", "critical", "high", "medium", "low"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition whitespace-nowrap cursor-pointer ${
                severityFilter === sev
                  ? "bg-[#1565C0] text-white shadow-sm"
                  : "bg-[#102A43] text-[#B0BEC5] hover:text-white hover:bg-[#163A59]"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents Scrollable Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-[#102A43]/50 bg-[#0B1F33]">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-[#90A4AE] text-xs">
            No emergency incidents match current filter.
          </div>
        ) : (
          filtered.map((inc) => {
            const isSelected = selectedIncident?.id === inc.id;
            const leftAccent = SEVERITY_LEFT_ACCENTS[inc.severity] || "border-l-[#90A4AE]";
            return (
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className={`pt-2.5 p-3 rounded-xl border border-l-4 transition cursor-pointer ${leftAccent} ${
                  isSelected
                    ? "bg-[#E8F1FA] border-[#1565C0] ring-1 ring-[#1565C0] text-[#263238] shadow-md"
                    : "bg-white hover:bg-[#F4F8FC] border-[#DCE3E8] text-[#263238] shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {TYPE_ICONS[inc.incident_type] || <HelpCircle className="w-4 h-4 text-[#607D8B]" />}
                    <h3 className="text-xs font-bold text-[#263238] line-clamp-1">
                      {inc.title}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border uppercase tracking-wider ${
                      SEVERITY_BADGES[inc.severity] || "bg-[#EEF2F6] text-[#607D8B] border-[#DCE3E8]"
                    }`}
                  >
                    {inc.severity}
                  </span>
                </div>

                <p className="text-[11px] text-[#607D8B] mt-1.5 line-clamp-2 leading-relaxed">
                  {inc.description || "No description provided."}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#607D8B]">
                  <span className="truncate max-w-[180px]">
                    📍 {inc.address || "Sector Coordinates"}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {inc.duplicate_of_id && (
                      <span className="flex items-center gap-1 bg-[#FFF8E1] border border-[#FFE082] text-[#F57F17] px-1.5 py-0.5 rounded font-medium">
                        <Layers className="w-3 h-3" /> Merged
                      </span>
                    )}
                    <span className="text-[#607D8B] bg-[#EEF2F6] border border-[#DCE3E8] px-1.5 py-0.5 rounded font-mono">P{inc.priority}</span>
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
