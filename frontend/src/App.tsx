import { lazy, Suspense, useState, useEffect, useCallback } from "react";
import { fetchIncidents, fetchResources, fetchAlerts, fetchPredictiveDemandForecast } from "./api";
import type { Incident, ResourceUnit, Alert, EvacuationRouteResponse, PredictiveDemandResponse } from "./types";
import { Navbar } from "./components/Navbar";
import { EmergencyMap } from "./components/EmergencyMap";
import { IncidentList } from "./components/IncidentList";
const QuickIntakeModal = lazy(() => import("./components/QuickIntakeModal").then((module) => ({ default: module.QuickIntakeModal })));
const IncidentDetailModal = lazy(() => import("./components/IncidentDetailModal").then((module) => ({ default: module.IncidentDetailModal })));
const AnalyticsView = lazy(() => import("./components/AnalyticsView").then((module) => ({ default: module.AnalyticsView })));
const FleetOptimizerModal = lazy(() => import("./components/FleetOptimizerModal").then((module) => ({ default: module.FleetOptimizerModal })));

function App() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [resources, setResources] = useState<ResourceUnit[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [activePlumePolygon, setActivePlumePolygon] = useState<[number, number][] | null>(null);
  const [activeEvacuationRoute, setActiveEvacuationRoute] = useState<EvacuationRouteResponse | null>(null);
  const [predictiveDemand, setPredictiveDemand] = useState<PredictiveDemandResponse | null>(null);
  const [showDemandHeatmap, setShowDemandHeatmap] = useState(false);
  const [dataStatus, setDataStatus] = useState<"loading" | "live" | "degraded">("loading");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "analytics">("map");

  const loadData = useCallback(async () => {
    const [incidentsResult, resourcesResult, alertsResult, demandResult] = await Promise.allSettled([
      fetchIncidents(),
      fetchResources(),
      fetchAlerts(),
      fetchPredictiveDemandForecast(2),
    ]);
    if (incidentsResult.status === "fulfilled") setIncidents(incidentsResult.value);
    if (resourcesResult.status === "fulfilled") setResources(resourcesResult.value);
    if (alertsResult.status === "fulfilled") setAlerts(alertsResult.value);
    if (demandResult.status === "fulfilled") setPredictiveDemand(demandResult.value);
    setDataStatus([incidentsResult, resourcesResult, alertsResult].some((result) => result.status === "rejected") ? "degraded" : "live");
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
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#e8edf5] text-slate-950">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewIncident={() => setIsNewModalOpen(true)}
        onOpenOptimizer={() => setIsOptimizerOpen(true)}
        alertCount={alerts.filter((a) => !a.is_resolved).length}
        incidentCount={incidents.length}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        dataStatus={dataStatus}
      />

      <main className="relative flex flex-1 gap-2 overflow-hidden bg-[#e8edf5] p-2 sm:gap-3 sm:p-3">
        {activeTab === "map" ? (
          <>
            {/* Desktop Incident Sidebar */}
            {isSidebarOpen && (
              <div className="hidden h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
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
                <div className="relative z-10 h-full w-80 max-w-[85vw] overflow-hidden rounded-r-2xl bg-white shadow-2xl animate-in slide-in-from-left duration-200">
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

            <div className="relative h-full min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm sm:rounded-2xl">
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
            </div>
          </>
        ) : (
          <Suspense fallback={<div className="flex flex-1 items-center justify-center text-sm text-slate-500">Loading intelligence workspace…</div>}>
            <AnalyticsView incidents={incidents} />
          </Suspense>
        )}
      </main>

      {isNewModalOpen && <Suspense fallback={null}><QuickIntakeModal isOpen onClose={() => setIsNewModalOpen(false)} onIncidentCreated={handleIncidentCreated} /></Suspense>}

      {isOptimizerOpen && <Suspense fallback={null}><FleetOptimizerModal isOpen onClose={() => {
          setIsOptimizerOpen(false);
          loadData();
        }} /></Suspense>}

      {selectedIncident && <Suspense fallback={null}><IncidentDetailModal incident={selectedIncident}
        onClose={() => {
          setSelectedIncident(null);
          setActivePlumePolygon(null);
          setActiveEvacuationRoute(null);
        }}
        onTogglePlume={setActivePlumePolygon}
        isPlumeActive={activePlumePolygon !== null}
        onToggleEvacuationRoute={setActiveEvacuationRoute}
        isEvacuationActive={activeEvacuationRoute !== null}
      /></Suspense>}
    </div>
  );
}

export default App;
