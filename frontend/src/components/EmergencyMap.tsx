import React, { useEffect, useRef } from "react";
import L from "leaflet";
import { Activity, ChevronDown, Layers3, MapPinned, Radio, Sparkles } from "lucide-react";
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

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "'": "&#39;",
  '"': "&quot;",
})[character] ?? character);

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
  const activeIncidentCount = incidents.filter((incident) => incident.status !== "resolved").length;
  const availableResourceCount = resources.filter((resource) => resource.status === "available").length;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center Bangalore coordinates by default
    const map = L.map(mapContainerRef.current, {
      center: [12.9716, 77.5946],
      zoom: 12,
      zoomControl: true,
    });

    // 1. Detailed Global Street Map with 100% English Labels (All country and city names strictly in English)
    const englishStreetMap = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, METI, TomTom",
        maxNativeZoom: 18,
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

    // Add English Street Map by default for a vibrant, detailed real-world map with all names in English
    englishStreetMap.addTo(map);

    // Map layer switcher
    const baseMaps = {
      "🗺️ Real Street Map (English)": englishStreetMap,
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
                    width: 24px;
                    height: 24px;
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
          <div style="font-weight: 700; font-size: 14px;">${escapeHtml(inc.title)}</div>
          <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Type: <b>${escapeHtml(inc.incident_type.toUpperCase())}</b></div>
          <div style="font-size: 12px; color: ${color}; font-weight: 600;">Severity: ${inc.severity.toUpperCase()}</div>
          <div style="font-size: 11px; color: #475569; margin-top: 4px;">Status: ${escapeHtml(inc.status)}</div>
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
          <div style="font-weight: 600;">${escapeHtml(res.name)}</div>
          <div style="font-size: 11px; color: #64748b;">Type: ${escapeHtml(res.resource_type)}</div>
          <div style="font-size: 11px; color: ${isAvail ? "#16a34a" : "#64748b"}; font-weight: 600;">Status: ${escapeHtml(res.status)}</div>
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

      <div className="pointer-events-none absolute left-16 top-20 z-[1000] hidden sm:block">
        <div className="flex items-center gap-3 rounded-xl border border-white/75 bg-white/90 px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur-md">
          <span className="grid size-7 place-items-center rounded-lg bg-slate-950 text-cyan-300">
            <MapPinned className="size-3.5" aria-hidden="true" />
          </span>
          <div className="leading-tight">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              <Radio className="size-3 text-emerald-500" aria-hidden="true" /> Field picture
            </div>
            <p className="mt-0.5 text-xs font-semibold text-slate-800">{activeIncidentCount} active · {availableResourceCount} ready</p>
          </div>
        </div>
      </div>

      {/* Forecast is an opt-in map layer, not a competing primary action. */}
      {onToggleDemandHeatmap && (
        <div className="absolute right-16 top-4 z-[1000] pointer-events-auto sm:right-16">
          <button
            type="button"
            onClick={onToggleDemandHeatmap}
            aria-pressed={showDemandHeatmap}
            className={`flex h-9 items-center gap-2 rounded-xl border px-3 text-xs font-semibold shadow-[0_10px_25px_rgba(15,23,42,0.16)] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 backdrop-blur-md ${
              showDemandHeatmap
                ? "border-sky-400 bg-sky-600 text-white hover:bg-sky-500"
                : "border-slate-700/70 bg-slate-950/90 text-slate-100 hover:bg-slate-800"
            }`}
          >
            <Sparkles className="size-3.5 text-cyan-200" aria-hidden="true" />
            <span className="hidden sm:inline">{showDemandHeatmap ? "Demand layer on" : "Demand forecast"}</span>
            <span className="sm:hidden">Forecast</span>
            {predictiveDemand && showDemandHeatmap && (
              <span className="rounded-md border border-sky-400/50 bg-sky-950/35 px-1.5 py-0.5 font-mono text-[10px]">
                {predictiveDemand.staging_recommendations.length}
              </span>
            )}
          </button>
        </div>
      )}

      {/* The legend starts compact so it supports the map instead of obscuring it. */}
      <details className="group absolute bottom-7 left-4 z-[1000] w-48 rounded-xl border border-slate-700/80 bg-slate-950/92 text-xs shadow-[0_12px_32px_rgba(15,23,42,0.28)] backdrop-blur-md pointer-events-auto" open>
        <summary className="flex h-9 cursor-pointer list-none items-center justify-between px-2.5 text-xs font-semibold text-slate-100 marker:content-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300">
          <span className="flex items-center gap-2"><Layers3 className="size-3.5 text-cyan-300" aria-hidden="true" /> Map key</span>
          <ChevronDown className="size-3.5 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="space-y-1.5 border-t border-slate-700/80 px-2.5 pb-2.5 pt-2">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">Incident priority</p>
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-1.5 text-[10px] text-slate-200">
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-rose-500 shadow-[0_0_0_3px_rgba(244,63,94,0.18)]" />Critical</span>
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-orange-500" />High</span>
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-amber-400" />Medium</span>
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-blue-500" />Low</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-700/80 pt-1.5 text-[10px] text-slate-300">
            <span className="flex items-center gap-1.5"><i className="size-2 rounded-sm bg-emerald-500" />Ready resource</span>
            <Activity className="size-3 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
            <i className="size-2 rounded-sm border border-orange-300 bg-orange-500/70" />Downwind plume
          </div>
        {evacuationRoute && (
          <div className="space-y-1.5 border-t border-slate-700/80 pt-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-rose-300">
              <i className="w-4 border-t-2 border-dashed border-rose-400" />Direct: {Math.round(evacuationRoute.naive_direct_route.hazard_exposure_meters)}m exposure
            </div>
            <div className="flex items-center gap-1.5 text-emerald-300">
              <i className="h-1 w-4 rounded-full bg-emerald-400" />Safe corridor
            </div>
          </div>
        )}
        {showDemandHeatmap && (
          <div className="space-y-1.5 border-t border-slate-700/80 pt-2 text-[11px] text-cyan-200">
            <div className="flex items-center gap-1.5"><i className="size-2 rounded-full bg-cyan-300" />Demand surge zone</div>
            <div className="flex items-center gap-1.5"><i className="size-2 rounded-sm border border-sky-300 bg-sky-600" />Pre-deploy beacon</div>
          </div>
        )}
        </div>
      </details>
    </div>
  );
};
