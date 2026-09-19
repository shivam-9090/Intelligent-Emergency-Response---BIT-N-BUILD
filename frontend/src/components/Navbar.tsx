import React from "react";
import { Activity, AlertTriangle, Plus, BarChart3, Radio, Zap } from "lucide-react";

interface NavbarProps {
  activeTab: "map" | "analytics";
  setActiveTab: (tab: "map" | "analytics") => void;
  onOpenNewIncident: () => void;
  onOpenOptimizer: () => void;
  alertCount: number;
  incidentCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewIncident,
  onOpenOptimizer,
  alertCount,
  incidentCount,
}) => {
  return (
    <header className="bg-white border-b border-[#DCE3E8] px-6 py-3 flex items-center justify-between text-[#263238] select-none shadow-xs">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-[#0B1F33] font-black text-xl tracking-tight">
          <Activity className="w-6 h-6 animate-pulse text-[#1565C0]" />
          <span>RESPONDR<span className="text-[#1565C0] font-semibold text-xs ml-1.5 px-2 py-0.5 bg-[#E3F2FD] border border-[#90CAF9] rounded">AI</span></span>
        </div>
        <div className="hidden md:flex items-center text-xs text-[#607D8B] border-l border-[#DCE3E8] pl-4 space-x-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#E8F5E9] border border-[#A5D6A7] text-[#2E7D32] font-medium">
            Live Dispatch Connected
          </span>
          <span className="text-[#90A4AE]">|</span>
          <span>{incidentCount} active incidents</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex bg-[#EEF2F6] p-1 rounded-lg border border-[#DCE3E8] text-sm">
          <button
            onClick={() => setActiveTab("map")}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "map"
                ? "bg-[#1565C0] text-white shadow-sm"
                : "text-[#607D8B] hover:text-[#263238] hover:bg-[#E8F1FA]"
            }`}
          >
            <Radio className="w-4 h-4" /> Live Map
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "analytics"
                ? "bg-[#1565C0] text-white shadow-sm"
                : "text-[#607D8B] hover:text-[#263238] hover:bg-[#E8F1FA]"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Analytics
          </button>
        </div>

        {alertCount > 0 && (
          <div className="flex items-center gap-1.5 bg-[#FFF3E0] border border-[#FFCC80] text-[#E65100] text-xs px-3 py-1.5 rounded-lg font-medium">
            <AlertTriangle className="w-4 h-4 text-[#F57C00] animate-bounce" />
            <span>{alertCount} Alerts</span>
          </div>
        )}

        <button
          onClick={onOpenOptimizer}
          className="bg-[#1565C0] hover:bg-[#0D47A1] text-white text-sm font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
          title="Global Fleet Optimizer - Hungarian Algorithm Dispatch"
        >
          <Zap className="w-4 h-4 text-[#FFF8E1] animate-pulse" />
          <span>Optimize Fleet</span>
        </button>

        <button
          onClick={onOpenNewIncident}
          className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-sm font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Report Emergency
        </button>
      </div>
    </header>
  );
};
