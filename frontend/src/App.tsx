import { useState, useEffect, useCallback } from "react";
import { fetchIncidents, fetchResources, fetchAlerts, fetchPredictiveDemandForecast } from "./api";
import type { Incident, ResourceUnit, Alert, EvacuationRouteResponse, PredictiveDemandResponse } from "./types";
import { Navbar } from "./components/Navbar";
import { EmergencyMap } from "./components/EmergencyMap";
import { IncidentList } from "./components/IncidentList";
import { QuickIntakeModal } from "./components/QuickIntakeModal";
import { IncidentDetailModal } from "./components/IncidentDetailModal";
import { AnalyticsView } from "./components/AnalyticsView";
import { FleetOptimizerModal } from "./components/FleetOptimizerModal";

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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleIncidentCreated = (newInc: Incident) => {
    setIncidents((prev) => [newInc, ...prev]);
    setSelectedIncident(newInc);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#F4F7FA] text-[#263238]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewIncident={() => setIsNewModalOpen(true)}
        onOpenOptimizer={() => setIsOptimizerOpen(true)}
        alertCount={alerts.filter((a) => !a.is_resolved).length}
        incidentCount={incidents.length}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <main className="flex-1 relative flex overflow-hidden">
        {activeTab === "map" ? (
          <>
            {/* Desktop Incident Sidebar */}
            {isSidebarOpen && (
              <div className="hidden md:block h-full animate-in slide-in-from-left duration-200">
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

            <div className="flex-1 h-full relative">
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
              />
            </div>
          </>
        ) : (
          <AnalyticsView incidents={incidents} />
        )}
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
    </div>
  );
}

export default App;
