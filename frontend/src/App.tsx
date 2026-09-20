import { useState, useEffect, useCallback, useRef } from "react";
import { fetchIncidents, fetchResources, fetchAlerts, fetchPredictiveDemandForecast } from "./api";
import type { Incident, ResourceUnit, Alert, EvacuationRouteResponse, PredictiveDemandResponse } from "./types";
import { Navbar } from "./components/Navbar";
import { EmergencyMap } from "./components/EmergencyMap";
import { IncidentList } from "./components/IncidentList";
import { QuickIntakeModal } from "./components/QuickIntakeModal";
import { IncidentDetailModal } from "./components/IncidentDetailModal";
import { AnalyticsView } from "./components/AnalyticsView";
import { FleetOptimizerModal } from "./components/FleetOptimizerModal";
import { X } from "lucide-react";

function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<ResourceUnit[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activePlumePolygon, setActivePlumePolygon] = useState<[number, number][] | null>(null);
  const [activeEvacuationRoute, setActiveEvacuationRoute] = useState<EvacuationRouteResponse | null>(null);
  const [predictiveDemand, setPredictiveDemand] = useState<PredictiveDemandResponse | null>(null);
  const [showDemandHeatmap, setShowDemandHeatmap] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "analytics">("map");
  const [activeEmergencyToast, setActiveEmergencyToast] = useState<{
    id: string;
    title: string;
    type: string;
    severity: string;
    address?: string | null;
    timestamp: string;
    incident?: Incident;
  } | null>(null);

  const prevAlertCountRef = useRef<number>(0);

  const loadData = useCallback(async () => {
    try {
      const [incData, resData, alertData, demandData] = await Promise.all([
        fetchIncidents(),
        fetchResources(),
        fetchAlerts(),
        fetchPredictiveDemandForecast(2).catch(() => null),
      ]);
      setIncidents(incData);
      setResources(resData);
      setAlerts(alertData);
      if (demandData) setPredictiveDemand(demandData);

      // Trigger notification toast if a new unresolved alert appears
      const unresolvedAlerts = alertData.filter((a: Alert) => !a.resolved && !a.is_resolved);
      if (unresolvedAlerts.length > prevAlertCountRef.current && unresolvedAlerts.length > 0) {
        const latestAlert = unresolvedAlerts[0];
        const matchingInc = incData.find((i: Incident) => i.id === latestAlert.incident_id);
        setActiveEmergencyToast({
          id: latestAlert.id,
          title: latestAlert.alert_type === "delayed_response" ? "DELAYED DISPATCH ADVISORY" : "CRITICAL ALERT",
          type: "alert",
          severity: "high",
          address: latestAlert.message,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          incident: matchingInc,
        });
      }
      prevAlertCountRef.current = unresolvedAlerts.length;
    } catch (err) {
      console.error("Failed to load initial data:", err);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Auto-refresh periodically to catch new events
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Auto-dismiss emergency toast after 8 seconds
  useEffect(() => {
    if (!activeEmergencyToast) return;
    const timer = setTimeout(() => {
      setActiveEmergencyToast(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeEmergencyToast]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleIncidentCreated = (newInc: Incident) => {
    setIncidents((prev) => [newInc, ...prev]);
    setSelectedIncident(newInc);
    setActiveEmergencyToast({
      id: newInc.id,
      title: newInc.title,
      type: newInc.incident_type,
      severity: newInc.severity,
      address: newInc.address,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      incident: newInc,
    });
  };

  const activeAlerts = alerts.filter((a) => !a.resolved && !a.is_resolved);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F4F7FA] text-[#263238]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewIncident={() => setIsNewModalOpen(true)}
        onOpenOptimizer={() => setIsOptimizerOpen(true)}
        alertCount={activeAlerts.length}
        alerts={activeAlerts}
        incidents={incidents}
        onSelectIncident={(inc) => {
          setSelectedIncident(inc);
          setActiveEvacuationRoute(null);
        }}
        onDismissAlert={(alertId) => {
          setAlerts((prev) => prev.filter((a) => a.id !== alertId));
        }}
        incidentCount={incidents.length}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <main className="flex-1 relative flex overflow-hidden">
        {/* Desktop Incident Sidebar (Available on both Map and Analytics) */}
        {isSidebarOpen && (
          <div className="hidden md:block h-full animate-in slide-in-from-left duration-200 shrink-0 z-20">
            <IncidentList
              incidents={incidents}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => {
                setSelectedIncident(inc);
                setActiveEvacuationRoute(null);
              }}
            />
          </div>
        )}

        {/* Mobile Drawer Overlay */}
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-[1500] flex">
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
              onClick={() => setIsSidebarOpen(false)}
            />
            <div className="relative z-10 w-80 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
              <IncidentList
                incidents={incidents}
                selectedIncident={selectedIncident}
                onSelectIncident={(inc) => {
                  setSelectedIncident(inc);
                  setActiveEvacuationRoute(null);
                  setIsSidebarOpen(false);
                }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 h-full relative overflow-hidden">
          {activeTab === "map" ? (
            <EmergencyMap
              incidents={incidents}
              resources={resources}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => {
                setSelectedIncident(inc);
                setActiveEvacuationRoute(null);
              }}
              activePlumePolygon={activePlumePolygon}
              evacuationRoute={activeEvacuationRoute}
              predictiveDemand={predictiveDemand}
              showDemandHeatmap={showDemandHeatmap}
              onToggleDemandHeatmap={() => setShowDemandHeatmap((prev) => !prev)}
              isSidebarOpen={isSidebarOpen}
            />
          ) : (
            <AnalyticsView incidents={incidents} />
          )}
        </div>
      </main>

      <QuickIntakeModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onIncidentCreated={handleIncidentCreated}
      />

      <FleetOptimizerModal
        isOpen={isOptimizerOpen}
        onClose={() => {
          setIsOptimizerOpen(false);
          loadData();
        }}
      />

      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => {
          setSelectedIncident(null);
          setActivePlumePolygon(null);
          setActiveEvacuationRoute(null);
        }}
        onTogglePlume={setActivePlumePolygon}
        isPlumeActive={activePlumePolygon !== null}
        onToggleEvacuationRoute={setActiveEvacuationRoute}
        isEvacuationActive={activeEvacuationRoute !== null}
      />

      {/* Real-Time Floating Emergency Notification Toast */}
      {activeEmergencyToast && (
        <div className="fixed top-16 right-4 sm:right-6 z-[2800] max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-white border-2 border-[#D32F2F] rounded-xl shadow-2xl p-4 text-[#263238] space-y-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#D32F2F] animate-pulse" />

            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D32F2F] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#D32F2F]"></span>
                </span>
                <span className="text-[11px] font-black text-[#D32F2F] tracking-wider uppercase">
                  Emergency Alert Received
                </span>
              </div>
              <button
                onClick={() => setActiveEmergencyToast(null)}
                className="text-[#90A4AE] hover:text-[#263238] p-0.5 rounded transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h4 className="text-sm font-bold text-[#0B1F33] leading-snug">
                {activeEmergencyToast.title}
              </h4>
              <p className="text-xs text-[#607D8B] mt-0.5 line-clamp-1">
                📍 {activeEmergencyToast.address || "Sector Point"} • {activeEmergencyToast.timestamp}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#EEF2F6]">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FDECEC] text-[#B71C1C] border border-[#EF9A9A] uppercase">
                {activeEmergencyToast.severity} Priority
              </span>

              {activeEmergencyToast.incident && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIncident(activeEmergencyToast.incident!);
                    setActiveEvacuationRoute(null);
                    setActiveEmergencyToast(null);
                  }}
                  className="text-xs font-bold text-white bg-[#D32F2F] hover:bg-[#B71C1C] px-3 py-1 rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1"
                >
                  View on Map →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
