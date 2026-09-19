import React, { useEffect, useRef } from "react";
import L from "leaflet";
import type { EvacuationRouteResponse, Incident, PredictiveDemandResponse, ResourceUnit } from "../types";

interface EmergencyMapProps {
  incidents: Incident[];
  resources: ResourceUnit[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
  activePlumePolygon?: [number, number][] | null;
  evacuationRoute?: EvacuationRouteResponse | null;
  predictiveDemand?: PredictiveDemandResponse | null;
  showDemandHeatmap?: boolean;
  onToggleDemandHeatmap?: () => void;
  isSidebarOpen?: boolean;
}

const SEVERITY_COLORS = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#3b82f6",
};

export const EmergencyMap: React.FC<EmergencyMapProps> = ({
  incidents,
  resources,
  selectedIncident,
  onSelectIncident,
  activePlumePolygon,
  evacuationRoute,
  predictiveDemand,
  showDemandHeatmap = false,
  onToggleDemandHeatmap,
  isSidebarOpen = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center Bangalore coordinates by default
    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: true,
    });

    // 1. Detailed Real Street Map (Full color, real streets, landmarks, buildings, parks, waterways - zero watermarks)
    const realStreetMap = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }
    );

    // 2. Real Satellite Imagery (Esri World Imagery + Labels - zero watermarks)
    const satelliteLayer = L.layerGroup([
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
          maxZoom: 19,
        }
      ),
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "",
          maxZoom: 19,
        }
      ),
    ]);

    // 3. Command Center Tactical Dark (Esri World Dark Gray - zero watermarks)
    const darkMapLayer = L.layerGroup([
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ",
          maxNativeZoom: 16,
          maxZoom: 19,
        }
      ),
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "",
          maxNativeZoom: 16,
          maxZoom: 19,
        }
      ),
    ]);

    // Add Real Street Map by default for a vibrant, detailed real-world map
    realStreetMap.addTo(map);

    // Map layer switcher
    const baseMaps = {
      "🗺️ Real Street Map": realStreetMap,
      "🛰️ Satellite Map": satelliteLayer,
      "🌙 Tactical Dark": darkMapLayer,
    };
    L.control.layers(baseMaps, undefined, { position: "topright" }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    // Observe container resizing so Leaflet automatically adapts without blank spaces
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Invalidate map size on sidebar hide/show transitions
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.invalidateSize();
    const t1 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
    const t2 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 250);
    const t3 = setTimeout(() => mapInstanceRef.current?.invalidateSize(), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isSidebarOpen]);

  // Update Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Render Incidents
    incidents.forEach((inc) => {
      if (inc.latitude === null || inc.longitude === null) return;

      const color = SEVERITY_COLORS[inc.severity] || "#94a3b8";
      const isSelected = selectedIncident?.id === inc.id;

      const icon = L.divIcon({
        className: "custom-incident-icon",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="
              width: ${isSelected ? 26 : 18}px;
              height: ${isSelected ? 26 : 18}px;
              background-color: ${color};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 0 14px ${color};
            "></div>
            ${
              inc.severity === "critical"
                ? `<div style="
                    position: absolute;
                    width: 32px;
                    height: 32px;
                    border: 2px solid ${color};
                    border-radius: 50%;
                    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                  "></div>`
                : ""
            }
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([inc.latitude, inc.longitude], { icon });
      marker.on("click", () => onSelectIncident(inc));

      const popupContent = `
        <div style="color: #0f172a; font-family: sans-serif; min-width: 180px;">
          <div style="font-weight: 700; font-size: 14px;">${inc.title}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Type: <b>${inc.incident_type.toUpperCase()}</b></div>
          <div style="font-size: 12px; color: ${color}; font-weight: 600;">Severity: ${inc.severity.toUpperCase()}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 4px;">Status: ${inc.status}</div>
          ${inc.duplicate_of_id ? `<div style="font-size: 10px; background: #fef08a; color: #854d0e; padding: 2px 4px; border-radius: 4px; margin-top: 4px;">⚠️ Duplicate Report</div>` : ""}
        </div>
      `;
      marker.bindPopup(popupContent);
      layerGroup.addLayer(marker);
    });

    // 2. Render Available Resources
    resources.forEach((res) => {
      if (res.latitude === null || res.longitude === null) return;
      const isAvail = res.status === "available";

      const icon = L.divIcon({
        className: "custom-resource-icon",
        html: `
          <div style="
            width: 14px;
            height: 14px;
            background-color: ${isAvail ? "#10b981" : "#64748b"};
            border: 2px solid #0f172a;
            border-radius: 3px;
            box-shadow: 0 0 6px ${isAvail ? "#10b981" : "#475569"};
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([res.latitude, res.longitude], { icon });
      marker.bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif;">
          <div style="font-weight: 600;">${res.name}</div>
          <div style="font-size: 11px; color: #64748b;">Type: ${res.resource_type}</div>
          <div style="font-size: 11px; color: ${isAvail ? "#16a34a" : "#64748b"}; font-weight: 600;">Status: ${res.status}</div>
        </div>
      `);
      layerGroup.addLayer(marker);
    });

    // 3. Render Atmospheric Hazard Plume Polygon
    if (activePlumePolygon && activePlumePolygon.length > 0) {
      const polygon = L.polygon(activePlumePolygon, {
        color: "#f97316",
        weight: 2,
        dashArray: "4, 6",
        fillColor: "#ea580c",
        fillOpacity: 0.28,
      });
      polygon.bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif; min-width: 170px;">
          <div style="font-weight: 700; color: #ea580c; font-size: 13px;">⚠️ Atmospheric Hazard Plume</div>
          <div style="font-size: 11px; color: #475569; margin-top: 3px;">
            Predicted downwind dispersion corridor based on meteorological wind vectors.
          </div>
        </div>
      `);
      layerGroup.addLayer(polygon);
    }

    // 4. Render Hazard-Aware Evacuation Routes
    if (evacuationRoute) {
      // 4a. Naive Direct Path (Red Dashed Line - Plume Penetration)
      const naiveWaypoints = evacuationRoute.naive_direct_route.waypoints.map(
        (w) => [w.latitude, w.longitude] as [number, number]
      );
      if (naiveWaypoints.length > 1) {
        const naiveLine = L.polyline(naiveWaypoints, {
          color: "#f43f5e",
          weight: 3,
          dashArray: "6, 8",
          opacity: 0.85,
        });
        naiveLine.bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; min-width: 200px;">
            <div style="font-weight: 700; color: #e11d48; font-size: 13px;">⚠️ Naive Direct Path (Hazard Penetration)</div>
            <div style="font-size: 11px; color: #475569; margin-top: 3px;">
              Direct trajectory penetrates the active toxic plume corridor.
            </div>
            <div style="margin-top: 5px; font-size: 12px; font-weight: 700; color: #be123c;">
              Toxic Exposure: ${Math.round(evacuationRoute.naive_direct_route.hazard_exposure_meters)}m
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              Distance: ${evacuationRoute.naive_direct_route.total_distance_km.toFixed(1)} km | Transit: ${Math.round(evacuationRoute.naive_direct_route.eta_minutes)} min
            </div>
          </div>
        `);
        layerGroup.addLayer(naiveLine);
      }

      // 4b. Safe Evacuation Corridor (Glowing Emerald Line - Zero Plume Exposure)
      const safeWaypoints = evacuationRoute.safe_evacuation_corridor.waypoints.map(
        (w) => [w.latitude, w.longitude] as [number, number]
      );
      if (safeWaypoints.length > 1) {
        const safeLine = L.polyline(safeWaypoints, {
          color: "#10b981",
          weight: 4.5,
          opacity: 0.95,
        });
        safeLine.bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; min-width: 220px;">
            <div style="font-weight: 700; color: #059669; font-size: 13px;">🛡️ Safe Evacuation Corridor (Zero Exposure)</div>
            <div style="font-size: 11px; color: #047857; font-weight: 700; margin-top: 2px;">
              ✅ 0.0m Plume Penetration Guaranteed
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.3;">
              ${evacuationRoute.tactical_advice}
            </div>
            <div style="margin-top: 6px; font-size: 11px; color: #334155; border-top: 1px solid #e2e8f0; padding-top: 4px;">
              Distance: <b>${evacuationRoute.safe_evacuation_corridor.total_distance_km.toFixed(1)} km</b> | 
              ETA: <b>${Math.round(evacuationRoute.safe_evacuation_corridor.eta_minutes)} min</b> | 
              Exposure Avoided: <b style="color: #059669;">${Math.round(evacuationRoute.safety_delta_meters_avoided)}m</b>
            </div>
          </div>
        `);
        layerGroup.addLayer(safeLine);

        // Render Detour Waypoint Nodes
        evacuationRoute.safe_evacuation_corridor.waypoints.forEach((wp) => {
          const wpIcon = L.divIcon({
            className: "custom-wp-icon",
            html: `
              <div style="
                width: 10px;
                height: 10px;
                background-color: #10b981;
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 0 6px #10b981;
              "></div>
            `,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          });
          const wpMarker = L.marker([wp.latitude, wp.longitude], { icon: wpIcon });
          wpMarker.bindPopup(`
            <div style="color: #0f172a; font-family: sans-serif; font-size: 11px;">
              <span style="font-weight: 700; color: #059669;">Waypoint #${wp.step_index}:</span> ${wp.description}
            </div>
          `);
          layerGroup.addLayer(wpMarker);
        });

        // Render Target Destination Terminal Pin
        const destCoords = evacuationRoute.target_destination_coords;
        const destIcon = L.divIcon({
          className: "custom-dest-icon",
          html: `
            <div style="
              background-color: #065f46;
              color: #ecfdf5;
              padding: 3px 7px;
              border-radius: 4px;
              border: 1.5px solid #34d399;
              font-size: 10px;
              font-weight: 700;
              box-shadow: 0 4px 10px rgba(0,0,0,0.5);
              white-space: nowrap;
            ">
              🏥 ${evacuationRoute.target_destination_name}
            </div>
          `,
          iconSize: [90, 24],
          iconAnchor: [45, 12],
        });
        const destMarker = L.marker(destCoords, { icon: destIcon });
        destMarker.bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif;">
            <div style="font-weight: 700; font-size: 13px;">${evacuationRoute.target_destination_name}</div>
            <div style="font-size: 11px; color: #059669; font-weight: 600;">Destination ${evacuationRoute.target_destination_category}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Safe Evacuation Terminal Facility</div>
          </div>
        `);
        layerGroup.addLayer(destMarker);
      }
    }

    // 5. Render Predictive Demand Heatmap & Patrol Pre-Deployment Staging Beacons
    if (showDemandHeatmap && predictiveDemand) {
      // 5a. Render Spatio-Temporal KDE Density Nodes
      predictiveDemand.heatmap_grid.forEach((pt) => {
        if (pt.intensity < 0.12) return;
        const color =
          pt.intensity >= 0.75
            ? "#f43f5e"
            : pt.intensity >= 0.5
            ? "#f97316"
            : pt.intensity >= 0.25
            ? "#eab308"
            : "#06b6d4";

        const circle = L.circle([pt.latitude, pt.longitude], {
          radius: 800 + pt.intensity * 900,
          color: color,
          weight: 1.5,
          opacity: 0.6,
          fillColor: color,
          fillOpacity: 0.12 + pt.intensity * 0.26,
        });

        circle.bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; min-width: 190px;">
            <div style="font-weight: 700; color: ${color}; font-size: 13px;">
              🔮 Predicted Surge: ${pt.risk_level.toUpperCase()}
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 3px;">
              Demand Surge Index: <b>${Math.round(pt.intensity * 100)}%</b>
            </div>
            <div style="font-size: 11px; color: #334155; margin-top: 2px;">
              Dominant Hazard: <b>${pt.predicted_incident_type.replace(/_/g, " ").toUpperCase()}</b>
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 3px;">
              Historical Influence: ${pt.historical_event_count} incidents
            </div>
          </div>
        `);
        layerGroup.addLayer(circle);
      });

      // 5b. Render Tactical Pre-Deployment Staging Centroids (Beacons)
      predictiveDemand.staging_recommendations.forEach((st) => {
        const beaconIcon = L.divIcon({
          className: "custom-staging-beacon",
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center;">
              <div style="
                background-color: #0369a1;
                color: #f0f9ff;
                padding: 3px 8px;
                border-radius: 6px;
                border: 2px solid #38bdf8;
                font-size: 10px;
                font-weight: 800;
                box-shadow: 0 0 14px rgba(56, 189, 248, 0.8);
                white-space: nowrap;
              ">
                🚨 STAGING: ${st.recommended_unit_type.replace(/_/g, " ").toUpperCase()}
              </div>
            </div>
          `,
          iconSize: [120, 24],
          iconAnchor: [60, 12],
        });

        const beaconMarker = L.marker([st.latitude, st.longitude], { icon: beaconIcon });
        beaconMarker.bindPopup(`
          <div style="color: #0f172a; font-family: sans-serif; min-width: 220px;">
            <div style="font-weight: 700; color: #0284c7; font-size: 13px;">
              🛡️ Tactical Standby Pre-Positioning
            </div>
            <div style="font-size: 12px; font-weight: 600; color: #0f172a; margin-top: 2px;">
              ${st.zone_name}
            </div>
            <div style="font-size: 11px; color: #0369a1; font-weight: 600; margin-top: 3px;">
              Unit: <b>${st.recommended_unit_type.replace(/_/g, " ").toUpperCase()}</b> ➔ ${st.target_incident_type}
            </div>
            <div style="font-size: 11px; color: #16a34a; font-weight: 700; margin-top: 3px;">
              ⏱️ Projected Response Savings: ~${st.projected_eta_savings_minutes} mins faster
            </div>
            <div style="font-size: 11px; color: #475569; margin-top: 4px; line-height: 1.3;">
              ${st.tactical_rationale}
            </div>
          </div>
        `);
        layerGroup.addLayer(beaconMarker);
      });
    }
  }, [
    incidents,
    resources,
    selectedIncident,
    onSelectIncident,
    activePlumePolygon,
    evacuationRoute,
    predictiveDemand,
    showDemandHeatmap,
  ]);

  // Center or fit bounds on selected incident or evacuation corridor
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (evacuationRoute && evacuationRoute.safe_evacuation_corridor.waypoints.length > 0) {
      const allPoints = evacuationRoute.safe_evacuation_corridor.waypoints.map(
        (w) => [w.latitude, w.longitude] as [number, number]
      );
      const bounds = L.latLngBounds(allPoints);
      mapInstanceRef.current.fitBounds(bounds, { padding: [60, 60], duration: 1.2 });
    } else if (
      selectedIncident &&
      selectedIncident.latitude !== null &&
      selectedIncident.longitude !== null
    ) {
      mapInstanceRef.current.flyTo(
        [selectedIncident.latitude, selectedIncident.longitude],
        14,
        { duration: 1.2 }
      );
    }
  }, [selectedIncident, evacuationRoute]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Toggle: Spatio-Temporal Demand Forecast Layer */}
      {onToggleDemandHeatmap && (
        <div className="absolute top-4 right-4 z-[1000] pointer-events-auto">
          <button
            type="button"
            onClick={onToggleDemandHeatmap}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition shadow-xl cursor-pointer backdrop-blur ${
              showDemandHeatmap
                ? "bg-sky-600/90 hover:bg-sky-500 text-white border-sky-400 shadow-sky-500/25"
                : "bg-slate-900/85 hover:bg-slate-800 text-slate-300 border-slate-700"
            }`}
          >
            <span>🔮</span>
            <span>{showDemandHeatmap ? "Hide Demand Heatmap" : "Predictive Demand (KDE)"}</span>
            {predictiveDemand && showDemandHeatmap && (
              <span className="text-[10px] bg-sky-950 px-1.5 py-0.5 rounded font-mono border border-sky-700">
                {predictiveDemand.staging_recommendations.length} Staged
              </span>
            )}
          </button>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3.5 py-2.5 rounded-lg shadow-xl text-xs space-y-1.5 pointer-events-auto">
        <div className="text-slate-400 font-semibold mb-1 text-[11px] uppercase tracking-wider">
          Incident Severity
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block -ml-4.5" />
          <span className="text-slate-200">Critical (Immediate)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
          <span className="text-slate-200">High Severity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
          <span className="text-slate-200">Medium Severity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
          <span className="text-slate-200">Low Severity</span>
        </div>
        <div className="border-t border-slate-700 pt-1.5 mt-1 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
          <span className="text-slate-300">Available Resource</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-orange-500/70 border border-orange-400 inline-block" />
          <span className="text-slate-300">Downwind Hazard Plume</span>
        </div>
        {evacuationRoute && (
          <>
            <div className="border-t border-slate-700 pt-1.5 mt-1 flex items-center gap-2">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-rose-500 inline-block" />
              <span className="text-rose-400 font-medium">Naive Path ({Math.round(evacuationRoute.naive_direct_route.hazard_exposure_meters)}m Exposure)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-1 bg-emerald-500 rounded-full inline-block" />
              <span className="text-emerald-400 font-medium">Safe Corridor (0m Exposure)</span>
            </div>
          </>
        )}
        {showDemandHeatmap && (
          <>
            <div className="border-t border-slate-700 pt-1.5 mt-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400/80 inline-block" />
              <span className="text-cyan-300 font-medium">KDE Demand Surge Zone</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm bg-sky-600 border border-sky-300 inline-block" />
              <span className="text-sky-300 font-medium">Tactical Pre-Deploy Beacon</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
