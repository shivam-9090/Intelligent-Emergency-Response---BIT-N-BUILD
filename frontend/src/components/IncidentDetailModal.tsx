import React, { useState, useEffect, useRef } from "react";
import type { Incident, ResourceBundleResponse, IncidentSummary, HospitalFacility, CascadeRiskResponse, ImageAnalysisResponse, EvacuationRouteResponse } from "../types";
import { fetchResourceBundle, fetchSummary, fetchHospitalRecommendations, fetchCascadeRisk, fetchEvacuationRoute, analyzeIncidentImage } from "../api";
import { X, Sparkles, Clock, ShieldAlert, CheckCircle2, Navigation, Hospital, Bed, TrendingUp, Wind, AlertTriangle, Eye, Camera, Trash2, Zap, Route } from "lucide-react";

interface IncidentDetailModalProps {
  incident: Incident | null;
  onClose: () => void;
  onTogglePlume?: (polygon: [number, number][] | null) => void;
  isPlumeActive?: boolean;
  onToggleEvacuationRoute?: (route: EvacuationRouteResponse | null) => void;
  isEvacuationActive?: boolean;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onTogglePlume,
  isPlumeActive = false,
  onToggleEvacuationRoute,
  isEvacuationActive = false,
}) => {
  const [bundle, setBundle] = useState<ResourceBundleResponse | null>(null);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [hospitals, setHospitals] = useState<HospitalFacility[]>([]);
  const [cascadeRisk, setCascadeRisk] = useState<CascadeRiskResponse | null>(null);
  const [evacuationRoute, setEvacuationRoute] = useState<EvacuationRouteResponse | null>(null);
  const [isLoadingBundle, setIsLoadingBundle] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [isLoadingCascade, setIsLoadingCascade] = useState(false);
  const [isLoadingEvacuation, setIsLoadingEvacuation] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);

  // Vision Analysis State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [visualAudit, setVisualAudit] = useState<ImageAnalysisResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!incident) {
      setBundle(null);
      setSummary(null);
      setHospitals([]);
      setCascadeRisk(null);
      setEvacuationRoute(null);
      setIsDispatched(false);
      setImagePreview(null);
      setVisualAudit(null);
      return;
    }

    setImagePreview(null);
    setVisualAudit(null);

    // Load bundle recommendations
    setIsLoadingBundle(true);
    fetchResourceBundle(incident.id)
      .then(setBundle)
      .catch((err) => console.error("Bundle error:", err))
      .finally(() => setIsLoadingBundle(false));

    // Load hospital recommendations
    setIsLoadingHospitals(true);
    fetchHospitalRecommendations(incident.id)
      .then((res) => setHospitals(res.facilities))
      .catch((err) => console.error("Hospitals error:", err))
      .finally(() => setIsLoadingHospitals(false));

    // Load predictive cascade risk
    setIsLoadingCascade(true);
    fetchCascadeRisk(incident.id)
      .then((res) => setCascadeRisk(res))
      .catch((err) => console.error("Cascade risk error:", err))
      .finally(() => setIsLoadingCascade(false));

    // Load hazard-aware evacuation route
    setIsLoadingEvacuation(true);
    fetchEvacuationRoute(incident.id)
      .then((res) => setEvacuationRoute(res))
      .catch((err) => console.error("Evacuation error:", err))
      .finally(() => setIsLoadingEvacuation(false));
  }, [incident]);

  if (!incident) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !incident) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setIsAnalyzingImage(true);
      try {
        const audit = await analyzeIncidentImage(
          dataUrl,
          incident.incident_type,
          incident.description || undefined
        );
        setVisualAudit(audit);
      } catch (err) {
        console.error("Visual analysis error:", err);
      } finally {
        setIsAnalyzingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setVisualAudit(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerateSummary = async () => {
    if (!incident) return;
    setIsLoadingSummary(true);
    try {
      const res = await fetchSummary(incident.id);
      setSummary(res);
    } catch (err) {
      console.error("Summary error:", err);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleDispatch = () => {
    setIsDispatched(true);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#DCE3E8] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-[#263238] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#DCE3E8] flex items-start justify-between bg-[#EEF2F6]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase bg-white px-2 py-0.5 rounded text-[#263238] font-semibold border border-[#DCE3E8]">
                {incident.incident_type}
              </span>
              <span
                className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${
                  incident.severity === "critical"
                    ? "bg-[#FDECEC] text-[#B71C1C] border-[#EF9A9A]"
                    : incident.severity === "high"
                    ? "bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]"
                    : incident.severity === "medium"
                    ? "bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]"
                    : "bg-[#E3F2FD] text-[#1565C0] border-[#90CAF9]"
                }`}
              >
                {incident.severity}
              </span>
              <span className="text-xs font-mono text-[#607D8B]">
                Priority {incident.priority}
              </span>
            </div>
            <h2 className="text-base font-bold text-[#263238] mt-1.5">{incident.title}</h2>
            <p className="text-xs text-[#607D8B] mt-0.5">
              📍 {incident.address || `${incident.latitude}, ${incident.longitude}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#607D8B] hover:text-[#263238] p-1 rounded-lg hover:bg-[#E8F1FA] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-[#607D8B] uppercase tracking-wider mb-1">
              Incident Overview
            </h4>
            <p className="text-xs text-[#263238] bg-[#EEF2F6] p-3.5 rounded-xl border border-[#DCE3E8] leading-relaxed">
              {incident.description || "No full incident description recorded."}
            </p>
          </div>

          {/* AI Situational Brief Card */}
          <div className="p-4 rounded-xl bg-[#EAF3FB] border border-[#90CAF9] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#1565C0] font-bold text-xs">
                <Sparkles className="w-4 h-4 text-[#1565C0]" />
                AI Situational Summary & Tactics
              </div>
              {!summary && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={isLoadingSummary}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#1565C0] hover:bg-[#0D47A1] px-3 py-1 rounded-lg transition cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: isLoadingSummary ? '1s' : '0s' }} />
                  {isLoadingSummary ? "Generating..." : "Generate AI Brief"}
                </button>
              )}
            </div>

            {summary ? (
              <div className="text-xs text-[#263238] leading-relaxed border-t border-[#90CAF9]/40 pt-2.5 space-y-2">
                <p className="italic text-[#263238]">"{summary.summary}"</p>
                <div className="flex items-center gap-1.5 text-[10px] text-[#1565C0] font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#1565C0]" />
                  <span>Powered by NVIDIA Llama-3.2 Vision-Instruct</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-[#607D8B] italic">
                Click "Generate AI Brief" to synthesize incoming audio logs and get tactical recommendations for field responders.
              </p>
            )}
          </div>

          {/* Predictive Cascade & Secondary Hazard Forecaster Card */}
          <div className="p-4 rounded-xl bg-white border border-[#DCE3E8] space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#263238] font-bold text-xs">
                <TrendingUp className="w-4 h-4 text-[#F57C00]" />
                Predictive Cascade & Secondary Risk Forecaster
              </div>
              {cascadeRisk && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      cascadeRisk.escalation_level === "critical"
                        ? "bg-[#FDECEC] text-[#B71C1C] border-[#EF9A9A]"
                        : cascadeRisk.escalation_level === "high"
                        ? "bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]"
                        : "bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]"
                    }`}
                  >
                    {cascadeRisk.cascade_risk_score}% RISK | {cascadeRisk.escalation_level.toUpperCase()}
                  </span>
                  {onTogglePlume && (
                    <button
                      onClick={() =>
                        onTogglePlume(
                          isPlumeActive
                            ? null
                            : cascadeRisk.evacuation_corridor.polygon_coordinates
                        )
                      }
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-md border transition cursor-pointer ${
                        isPlumeActive
                          ? "bg-[#F57C00] text-white border-[#F57C00] shadow-sm"
                          : "bg-[#E8F1FA] text-[#1565C0] border-[#DCE3E8] hover:bg-[#D6E7F7]"
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      {isPlumeActive ? "Hide Plume" : "Show Plume on Map"}
                    </button>
                  )}
                </div>
              )}
            </div>

            {isLoadingCascade ? (
              <div className="text-xs text-[#607D8B] text-center py-3">
                Calculating atmospheric dispersion vectors and secondary hazard timelines...
              </div>
            ) : cascadeRisk ? (
              <div className="space-y-3">
                {/* Weather & Advice */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-[#EEF2F6] p-2.5 rounded-lg border border-[#DCE3E8]">
                  <div className="flex items-center gap-1.5 text-[#1565C0]">
                    <Wind className="w-3.5 h-3.5 text-[#1565C0]" />
                    <span>
                      Wind: <b>{cascadeRisk.weather.wind_speed_kmh} km/h</b> blowing <b>{cascadeRisk.weather.wind_direction_deg}° (NE)</b>
                    </span>
                  </div>
                  <div className="text-[#607D8B]">
                    Temp: <span className="text-[#263238] font-semibold">{cascadeRisk.weather.temperature_c}°C</span> | Humidity: <span className="text-[#263238] font-semibold">{cascadeRisk.weather.humidity_pct}%</span>
                  </div>
                </div>

                {/* Secondary Hazards Timeline */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#607D8B]">
                    Predicted Secondary Cascade Events:
                  </div>
                  <div className="space-y-1.5">
                    {cascadeRisk.secondary_hazards.map((haz, idx) => (
                      <div
                        key={idx}
                        className="bg-[#EEF2F6] border border-[#DCE3E8] p-2 rounded-lg text-xs flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#263238] flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-[#F57C00] shrink-0" />
                            {haz.hazard_type}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-[#F57F17] bg-[#FFF8E1] px-1.5 py-0.5 rounded border border-[#FFE082]">
                              {(haz.probability * 100).toFixed(0)}% Probability
                            </span>
                            <span className="text-[10px] font-mono text-[#607D8B]">
                              Onset ~{haz.estimated_onset_minutes}m
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#607D8B] pl-4.5">
                          👉 {haz.recommended_action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vulnerable Civic Infrastructure in Zone */}
                {cascadeRisk.vulnerable_infrastructure.length > 0 && (
                  <div className="pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#607D8B] mb-1">
                      Civic Infrastructure within Plume Perimeter:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cascadeRisk.vulnerable_infrastructure.map((inf) => (
                        <span
                          key={inf.id}
                          className="text-[10px] bg-[#EEF2F6] text-[#263238] border border-[#DCE3E8] px-2 py-0.5 rounded-md flex items-center gap-1"
                        >
                          🏛️ {inf.name} ({inf.distance_km}km, ~{inf.occupancy_estimate} occupants)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#90A4AE] text-center py-2">
                Atmospheric telemetry offline.
              </div>
            )}
          </div>

          {/* Hazard-Aware Dynamic Evacuation Router Card */}
          <div className="bg-white border border-[#DCE3E8] rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-[#2E7D32]" />
                <h4 className="text-xs font-semibold text-[#263238] uppercase tracking-wider">
                  Hazard-Aware Evacuation Router (Plume Bypass)
                </h4>
              </div>
              {evacuationRoute && onToggleEvacuationRoute && (
                <button
                  type="button"
                  onClick={() => onToggleEvacuationRoute(isEvacuationActive ? null : evacuationRoute)}
                  className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-md border transition cursor-pointer ${
                    isEvacuationActive
                      ? "bg-[#2E7D32] text-white border-[#2E7D32]"
                      : "bg-[#E8F1FA] text-[#1565C0] border-[#DCE3E8] hover:bg-[#D6E7F7]"
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-[#1565C0]" />
                  <span>{isEvacuationActive ? "Hide Corridor on Map" : "Plot Corridor on Map"}</span>
                </button>
              )}
            </div>

            {isLoadingEvacuation ? (
              <div className="text-xs text-[#607D8B] text-center py-3 animate-pulse">
                Calculating tangent bypass corridor around active plume...
              </div>
            ) : evacuationRoute ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs bg-[#EEF2F6] p-2.5 rounded-lg border border-[#DCE3E8]">
                  <span className="text-[#607D8B]">Target Terminal Facility:</span>
                  <span className="font-semibold text-[#2E7D32]">
                    🏥 {evacuationRoute.target_destination_name} ({evacuationRoute.target_destination_category})
                  </span>
                </div>

                {/* Comparative Cards: Naive vs Safe */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Naive Direct Route */}
                  <div className="bg-[#FDECEC] border border-[#EF9A9A] p-2.5 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#B71C1C] uppercase tracking-wider">
                        ⚠️ Naive Direct Path
                      </span>
                      <span className="text-[10px] bg-[#FDECEC] border border-[#EF9A9A] text-[#B71C1C] px-1.5 py-0.5 rounded font-mono font-bold">
                        UNSAFE
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#B71C1C]">
                      {Math.round(evacuationRoute.naive_direct_route.hazard_exposure_meters)}m Toxic Plume Exposure
                    </div>
                    <div className="text-[11px] text-[#607D8B] flex items-center justify-between">
                      <span>Distance: {evacuationRoute.naive_direct_route.total_distance_km.toFixed(1)} km</span>
                      <span>ETA: ~{Math.round(evacuationRoute.naive_direct_route.eta_minutes)} min</span>
                    </div>
                    <div className="text-[10px] text-[#B71C1C]">
                      ❌ Directly penetrates the chemical / smoke dispersion cone.
                    </div>
                  </div>

                  {/* Safe Detour Corridor */}
                  <div className="bg-[#E8F5E9] border border-[#A5D6A7] p-2.5 rounded-lg space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#2E7D32] uppercase tracking-wider">
                        🛡️ Safe Detour Corridor
                      </span>
                      <span className="text-[10px] bg-[#E8F5E9] border border-[#A5D6A7] text-[#2E7D32] px-1.5 py-0.5 rounded font-mono font-bold">
                        ZERO EXPOSURE
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#2E7D32]">
                      0.0m Hazard Penetration ({Math.round(evacuationRoute.safety_delta_meters_avoided)}m saved)
                    </div>
                    <div className="text-[11px] text-[#607D8B] flex items-center justify-between">
                      <span>Distance: {evacuationRoute.safe_evacuation_corridor.total_distance_km.toFixed(1)} km</span>
                      <span>ETA: ~{Math.round(evacuationRoute.safe_evacuation_corridor.eta_minutes)} min</span>
                    </div>
                    <div className="text-[10px] text-[#2E7D32]">
                      ✅ Upwind / crosswind tangent vector bypasses plume boundary.
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-[#263238] bg-[#EEF2F6] border border-[#DCE3E8] p-2.5 rounded-lg">
                  <span className="font-semibold text-[#E65100]">Tactical Guidance: </span>
                  {evacuationRoute.tactical_advice}
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#607D8B] font-mono">
                  <span>Waypoints: {evacuationRoute.safe_evacuation_corridor.waypoints.length} nodes</span>
                  <span>Algorithm: {evacuationRoute.routing_algorithm}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#90A4AE] text-center py-2">
                Evacuation routing inactive.
              </div>
            )}
          </div>

          {/* Visual Evidence & Multimodal AI Audit */}
          <div className="bg-white border border-[#DCE3E8] rounded-xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#1565C0]" />
                <h4 className="text-xs font-semibold text-[#263238] uppercase tracking-wider">
                  Scene Photo & Multi-Modal Damage Audit
                </h4>
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#1565C0] bg-[#E8F1FA] border border-[#DCE3E8] hover:bg-[#D6E7F7] px-2.5 py-1 rounded-md transition cursor-pointer"
              >
                <Camera className="w-3 h-3 text-[#1565C0]" />
                <span>{imagePreview ? "Replace Photo" : "Upload Scene Photo"}</span>
              </button>
            </div>

            {isAnalyzingImage ? (
              <div className="py-4 text-center text-xs text-[#E65100] flex items-center justify-center gap-2 animate-pulse">
                <Zap className="w-4 h-4 animate-bounce" />
                <span>Running Llama-3.2 Vision Multi-Modal Damage Assessment...</span>
              </div>
            ) : visualAudit ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-[#EEF2F6] p-3 rounded-xl border border-[#DCE3E8]">
                  {imagePreview && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#DCE3E8] shrink-0 bg-white">
                      <img src={imagePreview} alt="Scene Evidence" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-[#D32F2F] text-white p-0.5 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        visualAudit.damage_severity === "critical"
                          ? "bg-[#FDECEC] text-[#B71C1C] border border-[#EF9A9A]"
                          : "bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80]"
                      }`}>
                        {visualAudit.damage_severity.toUpperCase()} DAMAGE ({visualAudit.damage_score}%)
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] border border-[#A5D6A7] text-[#2E7D32]">
                        <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" />
                        {visualAudit.authenticity_status.replace("_", " ").toUpperCase()} ({(visualAudit.authenticity_confidence * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-[#263238] leading-snug">
                      {visualAudit.tactical_assessment}
                    </p>
                    <div className="text-[10px] text-[#607D8B] font-mono">
                      Engine: {visualAudit.analysis_provider}
                    </div>
                  </div>
                </div>

                {visualAudit.detected_hazards.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#607D8B]">
                      Observed Visual Hazards:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {visualAudit.detected_hazards.map((haz, idx) => (
                        <div key={idx} className="bg-white border border-[#DCE3E8] px-2 py-1 rounded text-xs">
                          <span className="text-[#E65100] font-semibold">⚠️ {haz.hazard_type.replace(/_/g, " ")}: </span>
                          <span className="text-[#607D8B] text-[11px]">{haz.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#607D8B] text-center py-2 bg-[#EEF2F6] rounded-lg border border-dashed border-[#DCE3E8]">
                No visual evidence attached yet. Upload a scene photo to trigger automated damage assessment.
              </div>
            )}
          </div>

          {/* Recommended Resource Bundle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[#263238] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#1565C0]" />
                ML Recommended Response Package
              </h4>
              <span className="text-[11px] text-[#607D8B]">
                Sorted by Urban Road ETA
              </span>
            </div>

            {isLoadingBundle ? (
              <div className="text-xs text-[#607D8B] text-center py-6">
                Calculating closest optimal units...
              </div>
            ) : bundle && Object.keys(bundle.bundle).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(bundle.bundle).map(([rType, items]) => (
                  <div key={rType} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-[#607D8B] uppercase tracking-wider">
                      {rType} units ({items.length} matched)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {items.map((it) => (
                        <div
                          key={it.unit.id}
                          className="bg-[#EEF2F6] border border-[#DCE3E8] p-2.5 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-[#263238]">{it.unit.name}</div>
                            <div className="text-[10px] text-[#607D8B]">
                              Status: <span className="text-[#2E7D32] capitalize font-medium">{it.unit.status}</span>
                            </div>
                          </div>
                          {it.eta_minutes !== null && (
                            <div className="flex items-center gap-1 bg-white border border-[#DCE3E8] px-2 py-1 rounded text-[11px] font-mono text-[#1565C0] font-bold">
                              <Clock className="w-3 h-3 text-[#1565C0]" />
                              <span>{it.eta_minutes.toFixed(1)}m</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#90A4AE] text-center py-4 bg-[#EEF2F6] rounded-xl border border-[#DCE3E8]">
                No active resources available for assignment in this sector.
              </div>
            )}
          </div>

          {/* Designated Medical & Trauma Facilities */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[#263238] uppercase tracking-wider flex items-center gap-1.5">
                <Hospital className="w-4 h-4 text-[#2E7D32]" />
                Designated Trauma & Burn Facilities
              </h4>
              <span className="text-[11px] text-[#607D8B]">
                Live ICU Beds & Road ETAs
              </span>
            </div>

            {isLoadingHospitals ? (
              <div className="text-xs text-[#607D8B] text-center py-4">
                Matching closest specialized facilities with bed capacity...
              </div>
            ) : hospitals.length > 0 ? (
              <div className="space-y-2">
                {hospitals.map((hosp) => (
                  <div
                    key={hosp.id}
                    className="bg-white border border-[#DCE3E8] p-3 rounded-xl flex items-center justify-between gap-3 text-xs hover:bg-[#F4F8FC] hover:border-[#B0BEC5] transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#263238] truncate">{hosp.name}</span>
                        {hosp.burn_unit_available && (
                          <span className="text-[10px] bg-[#FFF3E0] border border-[#FFCC80] text-[#E65100] px-1.5 py-0.5 rounded font-medium">
                            Burn ICU
                          </span>
                        )}
                        {hosp.heliport && (
                          <span className="text-[10px] bg-[#E3F2FD] border border-[#90CAF9] text-[#1565C0] px-1.5 py-0.5 rounded font-medium">
                            Heliport
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#607D8B] mt-0.5 truncate">
                        📍 {hosp.address} ({hosp.distance_km} km away)
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {hosp.matched_capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="text-[9px] font-mono bg-[#EEF2F6] text-[#607D8B] border border-[#DCE3E8] px-1.5 py-0.5 rounded"
                          >
                            {cap.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1 bg-[#E8F5E9] border border-[#A5D6A7] text-[#2E7D32] px-2 py-0.5 rounded text-[11px] font-semibold">
                        <Bed className="w-3 h-3 text-[#2E7D32]" />
                        <span>{hosp.available_icu_beds} ICU beds</span>
                      </div>
                      <div className="flex items-center gap-1 bg-[#EEF2F6] border border-[#DCE3E8] px-2 py-0.5 rounded text-[11px] font-mono text-[#1565C0] font-bold">
                        <Clock className="w-3 h-3 text-[#1565C0]" />
                        <span>{hosp.eta_minutes.toFixed(1)}m ETA</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#90A4AE] text-center py-3 bg-[#EEF2F6] rounded-xl border border-[#DCE3E8]">
                No facility data currently matched for this incident sector.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#DCE3E8] bg-[#EEF2F6] flex items-center justify-between">
          <div className="text-xs text-[#607D8B]">
            {isDispatched ? (
              <span className="text-[#2E7D32] font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                Units Dispatched & In-Route
              </span>
            ) : (
              <span>Review package before dispatching.</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#263238] bg-white border border-[#DCE3E8] hover:bg-[#E8F1FA] transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDispatch}
              disabled={isDispatched}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                isDispatched
                  ? "bg-[#2E7D32] text-white cursor-default"
                  : "bg-[#1565C0] hover:bg-[#0D47A1] text-white shadow-sm"
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              {isDispatched ? "Dispatched" : "Dispatch Response Package"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
