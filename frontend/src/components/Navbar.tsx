import React, { useState } from "react";
import { Activity, AlertTriangleIcon, Plus, BarChart3, Radio, Zap, X, Bell, PanelLeft, Clock, Flame, CheckCircle2, ChevronRight } from "lucide-react";
import type { Alert as AlertType, Incident } from "../types";

interface NavbarProps {
  activeTab: "map" | "analytics";
  setActiveTab: (tab: "map" | "analytics") => void;
  onOpenNewIncident: () => void;
  onOpenOptimizer: () => void;
  alertCount: number;
  alerts?: AlertType[];
  incidents?: Incident[];
  onSelectIncident?: (inc: Incident) => void;
  onDismissAlert?: (alertId: string) => void;
  onDismissAllAlerts?: () => void;
  incidentCount?: number;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewIncident,
  onOpenOptimizer,
  alertCount,
  alerts,
  incidents,
  onSelectIncident,
  onDismissAlert,
  onDismissAllAlerts,
  isSidebarOpen = true,
  onToggleSidebar,
}) => {
  const [showAlertModal, setShowAlertModal] = useState(false);

  return (
    <header className="bg-white border-b border-[#DCE3E8] flex items-center justify-between text-[#263238] select-none shadow-xs relative z-30 h-13">
      {/* Left Column: Aligned with the sidebar below */}
      <div
        className={`flex items-center justify-between px-3.5 h-full border-r border-[#DCE3E8] transition-all duration-200 ${
          isSidebarOpen ? "w-88 lg:w-96 shrink-0" : "w-auto shrink-0 gap-3"
        }`}
      >
        <div className="flex items-center space-x-2 text-[#0B1F33] font-black text-xl tracking-tight">
          <Activity className="w-5.5 h-5.5 text-[#1565C0]" />
          <span>RESPONDR<span className="text-[#1565C0] font-semibold text-xs ml-1.5 px-2 py-0.5 bg-[#E3F2FD] border border-[#90CAF9] rounded">AI</span></span>
        </div>

        {/* Sidebar Open/Close Toggle Button (Icon-only, no text written) */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg border border-[#DCE3E8] bg-[#F8FAFC] hover:bg-[#EEF2F6] text-[#1565C0] hover:text-[#0D47A1] transition cursor-pointer shadow-xs flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#1565C0]/20"
            title={isSidebarOpen ? "Close panel" : "Open panel"}
            aria-label="Toggle Sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center space-x-2 md:space-x-3 px-4 md:px-6">
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
        <div
          className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setShowAlertModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-[#DCE3E8] p-5 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-[#263238]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE3E8]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FFF3E0] border border-[#FFE0B2] flex items-center justify-center text-[#E65100]">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0B1F33]">Emergency Notifications</h3>
                  <p className="text-xs text-[#607D8B]">{alerts?.length ?? alertCount} active priority advisories</p>
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

            {/* Notification Items List (Renders each alert individually) */}
            <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
              {alerts && alerts.length > 0 ? (
                alerts.map((alert, idx) => {
                  const matchedInc = incidents?.find((inc) => inc.id === alert.incident_id);
                  const isDelayed = alert.alert_type === "delayed_response";
                  const isCritical = alert.alert_type === "critical_incident";

                  return (
                    <div
                      key={alert.id || idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isCritical
                          ? "bg-[#FDECEC] border-[#EF9A9A] text-[#B71C1C]"
                          : isDelayed
                          ? "bg-[#FFF8E1] border-[#FFE082] text-[#B78103]"
                          : "bg-[#FFF3E0] border-[#FFCC80] text-[#E65100]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5">
                          <div className="p-1.5 rounded-lg bg-white/90 shrink-0 mt-0.5 shadow-xs">
                            {isCritical ? (
                              <Flame className="w-4 h-4 text-[#D32F2F]" />
                            ) : isDelayed ? (
                              <Clock className="w-4 h-4 text-[#F57C00]" />
                            ) : (
                              <AlertTriangleIcon className="w-4 h-4 text-[#E65100]" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-white/90 border border-current">
                                {isDelayed ? "DELAYED DISPATCH" : isCritical ? "CRITICAL EMERGENCY" : "OPERATIONAL ADVISORY"}
                              </span>
                              <span className="text-[10px] opacity-70 font-mono">
                                {alert.created_at ? new Date(alert.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Active"}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-[#263238] mt-1 leading-snug">
                              {alert.message}
                            </p>
                          </div>
                        </div>

                        {onDismissAlert && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDismissAlert(alert.id);
                            }}
                            className="text-[#90A4AE] hover:text-[#D32F2F] hover:bg-red-50 p-1.5 rounded-lg transition cursor-pointer shrink-0"
                            title="Dismiss notification"
                            aria-label="Dismiss notification"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {matchedInc && (
                        <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between">
                          <span className="text-[11px] text-[#607D8B] truncate max-w-[65%]">
                            📍 {matchedInc.address || "Sector Point"} ({matchedInc.severity.toUpperCase()})
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAlertModal(false);
                              onSelectIncident?.(matchedInc);
                            }}
                            className="text-[11px] font-bold text-[#1565C0] hover:text-[#0D47A1] inline-flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded shadow-xs border border-[#DCE3E8]"
                          >
                            <span>Inspect Incident</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-[#90A4AE] bg-[#F8FAFC] rounded-xl border border-dashed border-[#DCE3E8]">
                  <CheckCircle2 className="w-8 h-8 text-[#2E7D32] mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-[#263238]">All Operational Corridors Clear</p>
                  <p className="text-[11px] text-[#607D8B] mt-0.5">No pending emergency alerts or delayed dispatch advisories.</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#DCE3E8]">
              {alerts && alerts.length > 0 && onDismissAllAlerts ? (
                <button
                  type="button"
                  onClick={() => {
                    onDismissAllAlerts();
                    setShowAlertModal(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-[#607D8B] hover:text-[#D32F2F] hover:bg-[#FDECEC] rounded-lg transition cursor-pointer"
                >
                  Clear All Alerts
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setShowAlertModal(false)}
                className="px-4 py-2 bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
