import React, { useState } from "react";
import { Activity, AlertTriangleIcon, Plus, BarChart3, Radio, Zap, Menu, X, Bell } from "lucide-react";
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
  const [showAlertModal, setShowAlertModal] = useState(false);

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

        {/* Notification Bell Icon with Badge on Top Right */}
        <button
          onClick={() => setShowAlertModal(true)}
          className="relative p-2 rounded-lg border border-[#DCE3E8] bg-white hover:bg-[#F8FAFC] text-[#263238] transition cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20"
          title={`Alerts & Notifications (${alertCount})`}
          aria-label="Alerts"
        >
          <Bell className="w-4 h-4 text-[#455A64]" />
          {alertCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#D32F2F] text-white text-[10px] font-bold rounded-full h-4.5 min-w-[18px] px-1 flex items-center justify-center border-2 border-white shadow-xs font-mono">
              {alertCount}
            </span>
          )}
        </button>

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

      {/* Middle Notification Modal Dialog */}
      {showAlertModal && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-[#DCE3E8] p-5 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-[#263238]">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3E8]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FFF3E0] border border-[#FFE0B2] flex items-center justify-center text-[#E65100]">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F33]">Emergency Notifications</h3>
                  <p className="text-xs text-[#607D8B]">{alertCount} active priority advisories</p>
                </div>
              </div>
              <button
                onClick={() => setShowAlertModal(false)}
                className="text-[#90A4AE] hover:text-[#263238] p-1.5 rounded-lg hover:bg-[#EEF2F6] transition cursor-pointer"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Amber Alert Card as requested */}
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 shadow-xs">
              <AlertTriangleIcon className="w-5 h-5 text-amber-700" />
              <AlertTitle className="font-bold">Resource & Priority Queue Alert</AlertTitle>
              <AlertDescription className="text-xs mt-1 text-amber-800 leading-relaxed">
                {alertCount > 0
                  ? `${alertCount} critical emergency dispatches require immediate field review. High hazard risk detected in active sector.`
                  : "All monitored sectors report normal status. No pending critical escalation alerts."}
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAlertModal(false)}
                className="px-4 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
