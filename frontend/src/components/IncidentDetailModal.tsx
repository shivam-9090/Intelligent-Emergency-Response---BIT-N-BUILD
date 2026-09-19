import React, { useState, useEffect, useRef } from "react";
import type { Incident, ResourceBundleResponse, IncidentSummary, HospitalFacility, CascadeRiskResponse, ImageAnalysisResponse, EvacuationRouteResponse } from "../types";
import { fetchResourceBundle, fetchSummary, fetchHospitalRecommendations, fetchCascadeRisk, fetchEvacuationRoute, analyzeIncidentImage } from "../api";
import { X, Sparkles, Clock, ShieldAlert, CheckCircle2, Navigation, Hospital, Bed, TrendingUp, Wind, AlertTriangle, Eye, Camera, Trash2, Zap, Route } from "lucide-react";
import { SeverityBadge } from "./SeverityBadge";

const formatAiBrief = (brief: string) => brief
  .split(/(?=\*\*(?:Situational Summary|Tactical Action Recommendation|Immediate Safety Hazard Protocols|Required PPE\/Equipment):?\*\*)/i)
  .map((section) => {
    const cleaned = section.replace(/\*\*/g, "").trim();
    const divider = cleaned.indexOf(":");
    return divider > 0
      ? { title: cleaned.slice(0, divider), body: cleaned.slice(divider + 1).trim() }
      : { title: "Operational brief", body: cleaned };
  })
  .filter((section) => section.body);

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

  // Vision Analysis State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [visualAudit, setVisualAudit] = useState<ImageAnalysisResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestVersionRef = useRef(0);

  useEffect(() => {
    const requestVersion = ++requestVersionRef.current;
    if (!incident) {
      setBundle(null);
      setSummary(null);
      setHospitals([]);
      setCascadeRisk(null);
      setEvacuationRoute(null);
      setImagePreview(null);
      setVisualAudit(null);
      return;
    }

    setImagePreview(null);
    setVisualAudit(null);
    setBundle(null);
    setSummary(null);
    setHospitals([]);
    setCascadeRisk(null);
    setEvacuationRoute(null);

    // Load bundle recommendations
    setIsLoadingBundle(true);
    fetchResourceBundle(incident.id)
      .then((result) => {
        if (requestVersionRef.current === requestVersion) setBundle(result);
      })
      .catch((err) => console.error("Bundle error:", err))
      .finally(() => {
        if (requestVersionRef.current === requestVersion) setIsLoadingBundle(false);
      });

    // Load hospital recommendations
    setIsLoadingHospitals(true);
    fetchHospitalRecommendations(incident.id)
      .then((res) => {
        if (requestVersionRef.current === requestVersion) setHospitals(res.facilities);
      })
      .catch((err) => console.error("Hospitals error:", err))
      .finally(() => {
        if (requestVersionRef.current === requestVersion) setIsLoadingHospitals(false);
      });

    // Load predictive cascade risk
    setIsLoadingCascade(true);
    fetchCascadeRisk(incident.id)
      .then((res) => {
        if (requestVersionRef.current === requestVersion) setCascadeRisk(res);
      })
      .catch((err) => console.error("Cascade risk error:", err))
      .finally(() => {
        if (requestVersionRef.current === requestVersion) setIsLoadingCascade(false);
      });

    // Load hazard-aware evacuation route
    setIsLoadingEvacuation(true);
    fetchEvacuationRoute(incident.id)
      .then((res) => {
        if (requestVersionRef.current === requestVersion) setEvacuationRoute(res);
      })
      .catch((err) => console.error("Evacuation error:", err))
      .finally(() => {
        if (requestVersionRef.current === requestVersion) setIsLoadingEvacuation(false);
      });

    return () => {
      if (requestVersionRef.current === requestVersion) requestVersionRef.current += 1;
    };
  }, [incident]);

  useEffect(() => {
    if (!incident) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [incident, onClose]);

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

  const resourceGroups = bundle
    ? Object.entries(bundle.bundle).filter(([, items]) => items.length > 0)
    : [];
  const matchedResourceCount = resourceGroups.reduce((count, [, items]) => count + items.length, 0);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" role="presentation">
      <div role="dialog" aria-modal="true" aria-labelledby="incident-detail-title" className="flex max-h-[min(86vh,860px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-slate-200 bg-slate-50 px-5 py-4 md:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-white px-2 py-0.5 rounded text-[#0B1F33] font-bold border border-[#DCE3E8]">
                {incident.incident_type.replace(/_/g, " ")}
              </span>
              <SeverityBadge severity={incident.severity} size="sm" />
              <span className="text-[11px] font-mono text-[#607D8B] bg-[#EEF2F6] px-2 py-0.5 rounded border border-[#DCE3E8]">
                Priority {incident.priority}
              </span>
            </div>
            <h2 id="incident-detail-title" className="mt-2 font-heading text-xl font-semibold tracking-tight text-slate-950">{incident.title}</h2>
            <p className="text-xs text-[#607D8B] mt-1 flex items-center gap-1">
              <span>📍</span>
              <span>{incident.address || `${incident.latitude}, ${incident.longitude}`}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            autoFocus
            className="text-[#607D8B] hover:text-[#263238] p-1.5 rounded-lg hover:bg-[#EEF2F6] transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-5 overflow-y-auto bg-white p-5 md:p-6">
          {/* Description */}
          <div>
            <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
              Incident Overview
            </h4>
            <p className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm leading-6 text-slate-700">
              {incident.description || "No full incident description recorded."}
            </p>
          </div>

          {/* AI Situational Brief Card */}
          <div className="overflow-hidden rounded-xl border border-blue-200 bg-blue-50/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-blue-950">
                <span className="grid size-7 place-items-center rounded-lg bg-blue-600 text-white"><Sparkles className="size-3.5" /></span>
                AI operational brief
              </div>
              {!summary && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={isLoadingSummary}
                  className="mr-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: isLoadingSummary ? '1s' : '0s' }} />
                  {isLoadingSummary ? "Generating..." : "Generate AI Brief"}
                </button>
              )}
            </div>

            {summary ? (
              <div className="space-y-3 border-t border-blue-200 px-4 py-4">
                <div className="grid gap-3 md:grid-cols-2">{formatAiBrief(summary.summary).map((section, index) => <section key={`${section.title}-${index}`} className={index === 0 ? "md:col-span-2" : ""}><p className="mb-1 text-[10px] font-semibold uppercase tracking-[.12em] text-blue-700">{section.title}</p><p className="text-sm leading-6 text-slate-700">{section.body}</p></section>)}</div>
                <div className="flex items-center gap-1.5 border-t border-blue-200 pt-3 text-[10px] font-medium text-blue-700"><CheckCircle2 className="size-3.5" /><span>{summary.ai_generated ? "AI-generated decision support — verify before dispatch" : "Operational summary"}</span></div>
              </div>
            ) : (
              <p className="px-4 pb-4 text-sm leading-6 text-slate-600">
                Generate a concise operational brief with risk, recommended actions, and field-readiness notes.
              </p>
            )}
          </div>

          {/* Predictive Cascade & Secondary Hazard Forecaster Card */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-700"><TrendingUp className="size-4" /></span>
                <div><h4 className="text-sm font-semibold text-slate-900">Secondary risk forecast</h4><p className="mt-0.5 text-[10px] text-slate-500">Weather-adjusted cascade and plume assessment</p></div>
              </div>
              {cascadeRisk && (
                <div className="flex shrink-0 items-center gap-2">
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
                      className={`inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-[10px] font-semibold transition ${
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

            <div className="space-y-3.5 p-4">
            {isLoadingCascade ? (
              <div className="py-3 text-center text-xs text-slate-500">
                Calculating atmospheric dispersion vectors and secondary hazard timelines...
              </div>
            ) : cascadeRisk ? (
              <div className="space-y-3">
                {/* Weather & Advice */}
                <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] sm:grid-cols-2">
                  <div className="flex items-center gap-1.5 text-sky-700">
                    <Wind className="size-3.5" />
                    <span>
                      Wind: <b>{cascadeRisk.weather.wind_speed_kmh} km/h</b> blowing <b>{cascadeRisk.weather.wind_direction_deg}° (NE)</b>
                    </span>
                  </div>
                  <div className="text-slate-500">
                    Temp <span className="font-semibold text-slate-700">{cascadeRisk.weather.temperature_c}°C</span><span className="mx-1.5 text-slate-300">•</span>Humidity <span className="font-semibold text-slate-700">{cascadeRisk.weather.humidity_pct}%</span>
                  </div>
                </div>

                {/* Secondary Hazards Timeline */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                    Predicted cascade events
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {cascadeRisk.secondary_hazards.map((haz, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col gap-1.5 bg-white px-3 py-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <AlertTriangle className="size-3 shrink-0 text-amber-600" />
                            {haz.hazard_type}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono text-[9px] text-amber-700">
                              {(haz.probability * 100).toFixed(0)}% Probability
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              Onset ~{haz.estimated_onset_minutes}m
                            </span>
                          </div>
                        </div>
                        <p className="pl-4.5 text-[11px] leading-5 text-slate-500">
                          {haz.recommended_action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vulnerable Civic Infrastructure in Zone */}
                {cascadeRisk.vulnerable_infrastructure.length > 0 && (
                  <div className="pt-1">
                    <div className="mb-1 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-500">
                      Infrastructure in plume perimeter
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cascadeRisk.vulnerable_infrastructure.map((inf) => (
                        <span
                          key={inf.id}
                          className="flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-700"
                        >
                          🏛️ {inf.name} ({inf.distance_km}km, ~{inf.occupancy_estimate} occupants)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2 text-center text-xs text-slate-500">
                Atmospheric telemetry offline.
              </div>
            )}
            </div>
          </section>

          {/* Hazard-Aware Dynamic Evacuation Router Card */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700"><Route className="size-4" /></span>
                <div><h4 className="text-sm font-semibold text-slate-900">Safe evacuation corridor</h4><p className="mt-0.5 text-[10px] text-slate-500">Route selection avoids the active plume boundary</p></div>
              </div>
              {evacuationRoute && onToggleEvacuationRoute && (
                <button
                  type="button"
                  onClick={() => onToggleEvacuationRoute(isEvacuationActive ? null : evacuationRoute)}
                  className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-semibold transition ${
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

            <div className="space-y-3 p-4">
            {isLoadingEvacuation ? (
              <div className="py-3 text-center text-xs text-slate-500">
                Calculating tangent bypass corridor around active plume...
              </div>
            ) : evacuationRoute ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                  <span className="text-slate-500">Destination</span>
                  <span className="font-semibold text-emerald-700">
                    {evacuationRoute.target_destination_name} · {evacuationRoute.target_destination_category}
                  </span>
                </div>

                {/* Comparative Cards: Naive vs Safe */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Naive Direct Route */}
                  <div className="space-y-1.5 rounded-xl border border-rose-200 bg-rose-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-rose-800">
                        Direct route
                      </span>
                      <span className="rounded-md border border-rose-200 bg-white px-1.5 py-0.5 font-mono text-[9px] font-semibold text-rose-700">
                        UNSAFE
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-rose-800">
                      {Math.round(evacuationRoute.naive_direct_route.hazard_exposure_meters)}m Toxic Plume Exposure
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-600">
                      <span>Distance: {evacuationRoute.naive_direct_route.total_distance_km.toFixed(1)} km</span>
                      <span>ETA: ~{Math.round(evacuationRoute.naive_direct_route.eta_minutes)} min</span>
                    </div>
                    <div className="text-[10px] text-rose-700">
                      Enters the chemical and smoke dispersion zone.
                    </div>
                  </div>

                  {/* Safe Detour Corridor */}
                  <div className="space-y-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[.12em] text-emerald-800">
                        Recommended corridor
                      </span>
                      <span className="rounded-md border border-emerald-200 bg-white px-1.5 py-0.5 font-mono text-[9px] font-semibold text-emerald-700">
                        ZERO EXPOSURE
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-emerald-800">
                      0.0m Hazard Penetration ({Math.round(evacuationRoute.safety_delta_meters_avoided)}m saved)
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-600">
                      <span>Distance: {evacuationRoute.safe_evacuation_corridor.total_distance_km.toFixed(1)} km</span>
                      <span>ETA: ~{Math.round(evacuationRoute.safe_evacuation_corridor.eta_minutes)} min</span>
                    </div>
                    <div className="text-[10px] text-emerald-700">
                      Uses an upwind/crosswind bypass outside the plume boundary.
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-[11px] leading-5 text-slate-700">
                  <span className="font-semibold text-sky-800">Tactical guidance: </span>
                  {evacuationRoute.tactical_advice}
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
                  <span>Waypoints: {evacuationRoute.safe_evacuation_corridor.waypoints.length} nodes</span>
                  <span>Algorithm: {evacuationRoute.routing_algorithm}</span>
                </div>
              </div>
            ) : (
              <div className="py-2 text-center text-xs text-slate-500">
                Evacuation routing inactive.
              </div>
            )}
            </div>
          </section>

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

          {/* Resource matching is intentionally compact: empty classes do not consume dispatcher's attention. */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/80 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-sky-100 text-sky-700"><ShieldAlert className="size-4" /></span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Recommended response package</h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">Best available units, ranked by road ETA</p>
                </div>
              </div>
              {resourceGroups.length > 0 && <span className="shrink-0 rounded-full border border-sky-200 bg-white px-2 py-1 font-mono text-[10px] font-semibold text-sky-700">{matchedResourceCount} matched</span>}
            </div>

            {isLoadingBundle ? (
              <div className="py-6 text-center text-xs text-slate-500">
                Calculating closest optimal units...
              </div>
            ) : resourceGroups.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {resourceGroups.map(([rType, items]) => (
                  <div key={rType} className="px-4 py-3.5">
                    <div className="mb-2 flex items-center gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{rType.replace(/_/g, " ")}</span>
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-500">{items.length}</span>
                    </div>
                    <div className="grid gap-2 lg:grid-cols-2">
                      {items.map((it) => (
                        <div
                          key={it.unit.id}
                          className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-sky-200 hover:bg-sky-50/40"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-xs font-semibold text-slate-800">{it.unit.name}</div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              <span className="capitalize">{it.unit.status}</span>
                              {it.unit.capability && <span className="truncate border-l border-slate-200 pl-1.5">{it.unit.capability}</span>}
                            </div>
                          </div>
                          {it.eta_minutes !== null && (
                            <div className="flex shrink-0 items-center gap-1 rounded-lg border border-sky-100 bg-sky-50 px-2 py-1 font-mono text-[10px] font-semibold text-sky-700">
                              <Clock className="size-3" />
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
              <div className="px-4 py-5 text-center text-xs text-slate-500">
                No currently available units match this incident package.
              </div>
            )}
          </section>

          {/* Designated Medical & Trauma Facilities */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/80 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid size-8 place-items-center rounded-lg bg-emerald-100 text-emerald-700"><Hospital className="size-4" /></span>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Trauma & burn facilities</h4>
                  <p className="mt-0.5 text-[11px] text-slate-500">Capacity and travel time, refreshed from live matching</p>
                </div>
              </div>
              {hospitals.length > 0 && <span className="shrink-0 rounded-full border border-emerald-200 bg-white px-2 py-1 font-mono text-[10px] font-semibold text-emerald-700">{hospitals.length} options</span>}
            </div>

            {isLoadingHospitals ? (
              <div className="py-5 text-center text-xs text-slate-500">
                Matching closest specialized facilities with bed capacity...
              </div>
            ) : hospitals.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {hospitals.map((hosp) => (
                  <div
                    key={hosp.id}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-slate-800">{hosp.name}</span>
                        {hosp.burn_unit_available && (
                          <span className="rounded-md border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[9px] font-semibold text-orange-700">
                            Burn ICU
                          </span>
                        )}
                        {hosp.heliport && (
                          <span className="rounded-md border border-sky-200 bg-sky-50 px-1.5 py-0.5 text-[9px] font-semibold text-sky-700">
                            Heliport
                          </span>
                        )}
                      </div>
                      <div className="mt-1 truncate text-[10px] text-slate-500">
                        {hosp.address} · {hosp.distance_km.toFixed(1)} km away
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {hosp.matched_capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[9px] text-slate-500"
                          >
                            {cap.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                        <Bed className="size-3" />
                        <span>{hosp.available_icu_beds} beds</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[10px] font-semibold text-sky-700">
                        <Clock className="size-3" />
                        <span>{hosp.eta_minutes.toFixed(1)}m</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-5 text-center text-xs text-slate-500">
                No facility data currently matched for this incident sector.
              </div>
            )}
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#DCE3E8] bg-[#EEF2F6] flex items-center justify-between">
          <div className="text-xs text-[#607D8B]">
            <span>Assignment confirmation requires the authenticated dispatch workflow.</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#263238] bg-white border border-[#DCE3E8] hover:bg-[#E8F1FA] transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled
              title="Assignment persistence is not connected in this frontend yet."
              className="text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 bg-[#90A4AE] text-white cursor-not-allowed"
            >
              <Navigation className="w-3.5 h-3.5" />
              Dispatch Integration Pending
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
