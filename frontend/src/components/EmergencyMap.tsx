import React, { useEffect, useRef } from "react";
import L from "leaflet";
import type { Incident, ResourceUnit } from "../types";

interface EmergencyMapProps {
  incidents: Incident[];
  resources: ResourceUnit[];
  selectedIncident: Incident | null;
  onSelectIncident: (inc: Incident) => void;
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

    // Dark-themed OpenStreetMap tiles (CartoDB Dark Matter)
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    layerGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

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
  }, [incidents, resources, selectedIncident, onSelectIncident]);

  // Center on selected incident if changed
  useEffect(() => {
    if (
      selectedIncident &&
      selectedIncident.latitude !== null &&
      selectedIncident.longitude !== null &&
      mapInstanceRef.current
    ) {
      mapInstanceRef.current.flyTo(
        [selectedIncident.latitude, selectedIncident.longitude],
        14,
        { duration: 1.2 }
      );
    }
  }, [selectedIncident]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
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
      </div>
    </div>
  );
};
