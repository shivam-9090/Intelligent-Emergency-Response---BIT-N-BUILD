import React, { useState } from "react";
import { Activity, AlertTriangle, AlertTriangleIcon, Plus, BarChart3, Radio, Zap, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface NavbarProps {
  activeTab: "map" | "analytics";
  setActiveTab: (tab: "map" | "analytics") => void;
  onOpenNewIncident: () => void;
  onOpenOptimizer: () => void;
  alertCount: number;
  incidentCount: number;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewIncident,
  onOpenOptimizer,
  alertCount,
  incidentCount,
  onToggleSidebar,
}) => {
  const [showAlertPopover, setShowAlertPopover] = useState(false);

  return (
    <header className="bg-white border-b border-[#DCE3E8] px-4 md:px-6 py-2.5 flex items-center justify-between text-[#263238] select-none shadow-xs relative z-30">
      <div className="flex items-center space-x-3 md:space-x-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-1.5 rounded-lg border border-[#DCE3E8] hover:bg-[#EEF2F6] text-[#607D8B] cursor-pointer"
            aria-label="Toggle incident list"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center space-x-2 text-[#0B1F33] font-black text-xl tracking-tight">
          <Activity className="w-6 h-6 text-[#1565C0]" />
          <span>RESPONDR<span className="text-[#1565C0] font-semibold text-xs ml-1.5 px-2 py-0.5 bg-[#E3F2FD] border border-[#90CAF9] rounded">AI</span></span>
        </div>
        <div className="hidden md:flex items-center text-xs text-[#607D8B] border-l border-[#DCE3E8] pl-4 space-x-2">
          <Badge variant="outline" className="border-[#A5D6A7] bg-[#E8F5E9] text-[#2E7D32] font-medium py-1">
            Live Dispatch Connected
          </Badge>
          <span className="text-[#90A4AE]">|</span>
          <span className="font-medium text-[#607D8B]">{incidentCount} active incidents</span>
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-3">
        {/* Navigation Tabs */}
        <div className="flex bg-[#EEF2F6] p-1 rounded-lg border border-[#DCE3E8] text-xs font-semibold">
          <button
            onClick={() => setActiveTab("map")}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "map"
                ? "bg-[#1565C0] text-white shadow-xs"
                : "text-[#607D8B] hover:text-[#263238] hover:bg-[#E8F1FA]"
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> Live Map
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "analytics"
                ? "bg-[#1565C0] text-white shadow-xs"
                : "text-[#607D8B] hover:text-[#263238] hover:bg-[#E8F1FA]"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </button>
        </div>

        {/* Alerts Trigger with Badge */}
        {alertCount > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowAlertPopover((prev) => !prev)}
              className="flex items-center gap-1.5 bg-[#FFF3E0] hover:bg-[#FFE0B2] border border-[#FFCC80] text-[#E65100] text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer transition"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#F57C00]" />
              <span className="hidden sm:inline">Alerts</span>
              <Badge variant="destructive" className="px-1.5 py-0 text-[10px] ml-0.5">
                {alertCount}
              </Badge>
            </button>

            {/* Alert Popover */}
            {showAlertPopover && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 p-3 bg-white border border-[#DCE3E8] rounded-xl shadow-2xl z-50 animate-in fade-in-90 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#DCE3E8]">
                  <span className="text-xs font-bold text-[#0B1F33] uppercase tracking-wider">
                    Emergency Dispatch Alerts ({alertCount})
                  </span>
                  <button
                    onClick={() => setShowAlertPopover(false)}
                    className="text-[#90A4AE] hover:text-[#263238] p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                  <AlertTriangleIcon className="w-4 h-4 text-amber-700" />
                  <AlertTitle>Resource & Priority Queue Alert</AlertTitle>
                  <AlertDescription>
                    {alertCount} critical emergency dispatches require immediate field review. High hazard risk detected in active sector.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <button
          onClick={onOpenOptimizer}
          className="bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold px-3 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
          title="Global Fleet Optimizer - Hungarian Algorithm Dispatch"
        >
          <Zap className="w-3.5 h-3.5 text-[#FFF8E1]" />
          <span className="hidden sm:inline">Optimize Fleet</span>
        </button>

        <button
          onClick={onOpenNewIncident}
          className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-xs font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Report Emergency</span>
        </button>
      </div>
    </header>
  );
};
