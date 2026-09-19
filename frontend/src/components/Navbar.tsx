import React from "react";
import { Activity, AlertTriangle, Plus, BarChart3, Radio } from "lucide-react";

interface NavbarProps {
  activeTab: "map" | "analytics";
  setActiveTab: (tab: "map" | "analytics") => void;
  onOpenNewIncident: () => void;
  alertCount: number;
  incidentCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewIncident,
  alertCount,
  incidentCount,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between text-white select-none">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 text-rose-500 font-black text-xl tracking-tight">
          <Activity className="w-6 h-6 animate-pulse text-rose-500" />
          <span>RESPONDR<span className="text-rose-400 font-light text-sm ml-1.5 px-2 py-0.5 bg-rose-950/60 border border-rose-800 rounded">AI</span></span>
        </div>
        <div className="hidden md:flex items-center text-xs text-slate-400 border-l border-slate-700 pl-4 space-x-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Live Dispatch Connected
          </span>
          <span className="text-slate-400">|</span>
          <span>{incidentCount} active incidents</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="flex bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-sm">
          <button
            onClick={() => setActiveTab("map")}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
              activeTab === "map"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Radio className="w-4 h-4" /> Live Map
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
              activeTab === "analytics"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Analytics
          </button>
        </div>

        {alertCount > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-950/80 border border-amber-600 text-amber-300 text-xs px-3 py-1.5 rounded-lg font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>{alertCount} Alerts</span>
          </div>
        )}

        <button
          onClick={onOpenNewIncident}
          className="bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-lg shadow-rose-950 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Report Emergency
        </button>
      </div>
    </header>
  );
};

