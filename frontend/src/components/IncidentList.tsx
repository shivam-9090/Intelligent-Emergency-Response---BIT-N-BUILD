import React, { useState } from "react";
import type { Incident } from "../types";
import { Search, ChevronDown, Flame, Droplets, AlertOctagon, Car, HeartPulse, HelpCircle, Layers, ShieldCheck } from "lucide-react";
import { SeverityBadge } from "./SeverityBadge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

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
    <aside className="w-88 lg:w-96 h-full bg-white border-r border-[#DCE3E8] flex flex-col z-10 select-none shrink-0 shadow-xs">
      {/* Search and Filters Header */}
      <div className="p-3.5 border-b border-[#DCE3E8] space-y-2.5 bg-[#F8FAFC]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-[#0B1F33] uppercase tracking-wider">
              Active Incidents
            </h2>
            <span className="text-[10px] font-mono font-bold bg-[#EEF2F6] border border-[#DCE3E8] text-[#1565C0] px-2 py-0.5 rounded">
              {filtered.length}
            </span>
          </div>
          <span className="text-[10px] text-[#607D8B] font-mono font-semibold">LIVE FEED</span>
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
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#F1F5F9]">
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
              <div
                key={inc.id}
                onClick={() => onSelectIncident(inc)}
                className={`p-3 rounded-lg border border-l-4 transition cursor-pointer ${leftAccent} ${
                  isSelected
                    ? "bg-[#EAF3FB] border-[#1565C0] ring-1 ring-[#1565C0] text-[#263238] shadow-md"
                    : "bg-white hover:bg-[#F8FAFC] border-[#DCE3E8] text-[#263238] shadow-xs"
                }`}
              >
                {/* 1. Severity & Type Icon */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {TYPE_ICONS[inc.incident_type] || <HelpCircle className="w-3.5 h-3.5 text-[#607D8B]" />}
                    <span className="text-[10px] font-bold text-[#607D8B] uppercase tracking-wider">
                      {inc.incident_type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <SeverityBadge severity={inc.severity} size="sm" />
                </div>

                {/* 2. Incident Title */}
                <h3 className="text-xs font-bold text-[#263238] line-clamp-1 leading-snug">
                  {inc.title}
                </h3>

                {/* 3. Description */}
                <p className="text-[11px] text-[#607D8B] mt-1 line-clamp-2 leading-relaxed">
                  {inc.description || "No description provided."}
                </p>

                {/* 4. Location & Priority */}
                <div className="mt-2.5 pt-2 border-t border-[#DCE3E8]/70 flex items-center justify-between text-[10px] text-[#607D8B]">
                  <span className="truncate max-w-[170px] font-medium flex items-center gap-1">
                    <span>📍</span>
                    <span className="truncate">{inc.address || "Sector Coordinates"}</span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {inc.duplicate_of_id && (
                      <span className="flex items-center gap-0.5 bg-[#FFF8E1] border border-[#FFE082] text-[#F57F17] px-1.5 py-0.5 rounded font-medium">
                        <Layers className="w-3 h-3" /> Merged
                      </span>
                    )}
                    <span className="text-[#0B1F33] bg-[#EEF2F6] border border-[#DCE3E8] px-1.5 py-0.5 rounded font-mono font-bold">
                      P{inc.priority}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};

