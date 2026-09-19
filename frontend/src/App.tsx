import { useState, useEffect, useCallback } from "react";
import { fetchIncidents, fetchResources, fetchAlerts } from "./api";
import type { Incident, ResourceUnit, Alert, EvacuationRouteResponse } from "./types";
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
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isOptimizerOpen, setIsOptimizerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "analytics">("map");

  const loadData = useCallback(async () => {
    try {
      const [incData, resData, alertData] = await Promise.all([
        fetchIncidents(),
        fetchResources(),
        fetchAlerts(),
      ]);
      setIncidents(incData);
      setResources(resData);
      setAlerts(alertData);
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

  const handleIncidentCreated = (newInc: Incident) => {
    setIncidents((prev) => [newInc, ...prev]);
    setSelectedIncident(newInc);
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-950 text-slate-100">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewIncident={() => setIsNewModalOpen(true)}
        onOpenOptimizer={() => setIsOptimizerOpen(true)}
        alertCount={alerts.filter((a) => !a.is_resolved).length}
        incidentCount={incidents.length}
      />

      <main className="flex-1 relative flex overflow-hidden">
        {activeTab === "map" ? (
          <>
            <IncidentList
              incidents={incidents}
              selectedIncident={selectedIncident}
              onSelectIncident={(inc) => {
                setSelectedIncident(inc);
                setActiveEvacuationRoute(null);
              }}
            />
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
