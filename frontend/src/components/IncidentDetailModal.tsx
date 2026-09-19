import React, { useState, useEffect } from "react";
import type { Incident, ResourceBundleResponse, IncidentSummary, HospitalFacility, CascadeRiskResponse } from "../types";
import { fetchResourceBundle, fetchSummary, fetchHospitalRecommendations, fetchCascadeRisk } from "../api";
import { X, Sparkles, Clock, ShieldAlert, CheckCircle2, Navigation, Hospital, Bed, TrendingUp, Wind, AlertTriangle, Eye } from "lucide-react";

interface IncidentDetailModalProps {
  incident: Incident | null;
  onClose: () => void;
  onTogglePlume?: (polygon: [number, number][] | null) => void;
  isPlumeActive?: boolean;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onTogglePlume,
  isPlumeActive = false,
}) => {
  const [bundle, setBundle] = useState<ResourceBundleResponse | null>(null);
  const [summary, setSummary] = useState<IncidentSummary | null>(null);
  const [hospitals, setHospitals] = useState<HospitalFacility[]>([]);
  const [cascadeRisk, setCascadeRisk] = useState<CascadeRiskResponse | null>(null);
  const [isLoadingBundle, setIsLoadingBundle] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingHospitals, setIsLoadingHospitals] = useState(false);
  const [isLoadingCascade, setIsLoadingCascade] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);

  useEffect(() => {
    if (!incident) {
      setBundle(null);
      setSummary(null);
      setHospitals([]);
      setCascadeRisk(null);
      setIsDispatched(false);
      return;
    }

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
  }, [incident]);

  if (!incident) return null;

  const handleGenerateSummary = async () => {
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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-semibold border border-slate-700">
                {incident.incident_type}
              </span>
              <span
                className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full border ${
                  incident.severity === "critical"
                    ? "bg-rose-950 text-rose-300 border-rose-700"
                    : "bg-amber-950 text-amber-300 border-amber-700"
                }`}
              >
                {incident.severity}
              </span>
              <span className="text-xs font-mono text-slate-400">
                Priority {incident.priority}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1.5">{incident.title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              📍 {incident.address || `${incident.latitude}, ${incident.longitude}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Incident Overview
            </h4>
            <p className="text-xs text-slate-200 bg-slate-800/60 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
              {incident.description || "No full incident description recorded."}
            </p>
          </div>

          {/* AI Situational Brief Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-purple-400" />
                AI Situational Summary & Tactics
              </div>
              {!summary && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={isLoadingSummary}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-white bg-purple-900/60 hover:bg-purple-800 border border-purple-700 px-3 py-1 rounded-lg transition cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: isLoadingSummary ? '1s' : '0s' }} />
                  {isLoadingSummary ? "Generating..." : "Generate AI Brief"}
                </button>
              )}
            </div>

            {summary ? (
              <div className="text-xs text-slate-200 leading-relaxed border-t border-purple-900/50 pt-2.5 space-y-2">
                <p className="italic text-purple-200/90">"{summary.summary}"</p>
                <div className="flex items-center gap-1.5 text-[10px] text-purple-400">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Powered by NVIDIA Llama-3.2 Vision-Instruct</span>
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                Click "Generate AI Brief" to synthesize incoming audio logs and get tactical recommendations for field responders.
              </p>
            )}
          </div>

          {/* Predictive Cascade & Secondary Hazard Forecaster Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-slate-900 border border-amber-800/60 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                Predictive Cascade & Secondary Risk Forecaster
              </div>
              {cascadeRisk && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      cascadeRisk.escalation_level === "critical"
                        ? "bg-rose-950 text-rose-300 border-rose-700"
                        : cascadeRisk.escalation_level === "high"
                        ? "bg-orange-950 text-orange-300 border-orange-700"
                        : "bg-amber-950 text-amber-300 border-amber-700"
                    }`}
                  >
                    {cascadeRisk.cascade_risk_score}% RISK • {cascadeRisk.escalation_level.toUpperCase()}
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
                          ? "bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-900"
                          : "bg-slate-800 text-orange-300 border-orange-800/60 hover:bg-slate-700"
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
              <div className="text-xs text-slate-400 text-center py-3">
                Calculating atmospheric dispersion vectors and secondary hazard timelines...
              </div>
            ) : cascadeRisk ? (
              <div className="space-y-3">
                {/* Weather & Advice */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <Wind className="w-3.5 h-3.5 text-cyan-400" />
                    <span>
                      Wind: <b>{cascadeRisk.weather.wind_speed_kmh} km/h</b> blowing <b>{cascadeRisk.weather.wind_direction_deg}° (NE)</b>
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Temp: <span className="text-slate-200">{cascadeRisk.weather.temperature_c}°C</span> | Humidity: <span className="text-slate-200">{cascadeRisk.weather.humidity_pct}%</span>
                  </div>
                </div>

                {/* Secondary Hazards Timeline */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Predicted Secondary Cascade Events:
                  </div>
                  <div className="space-y-1.5">
                    {cascadeRisk.secondary_hazards.map((haz, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-800/60 border border-slate-700/60 p-2 rounded-lg text-xs flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                            {haz.hazard_type}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/60">
                              {(haz.probability * 100).toFixed(0)}% Probability
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              Onset ~{haz.estimated_onset_minutes}m
                            </span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 pl-4.5">
                          👉 {haz.recommended_action}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vulnerable Civic Infrastructure in Zone */}
                {cascadeRisk.vulnerable_infrastructure.length > 0 && (
                  <div className="pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Civic Infrastructure within Plume Perimeter:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cascadeRisk.vulnerable_infrastructure.map((inf) => (
                        <span
                          key={inf.id}
                          className="text-[10px] bg-slate-800/90 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1"
                        >
                          🏛️ {inf.name} ({inf.distance_km}km, ~{inf.occupancy_estimate} occupants)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-2">
                Atmospheric telemetry offline.
              </div>
            )}
          </div>

          {/* Recommended Resource Bundle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                ML Recommended Response Package
              </h4>
              <span className="text-[11px] text-slate-400">
                Sorted by Urban Road ETA
              </span>
            </div>

            {isLoadingBundle ? (
              <div className="text-xs text-slate-400 text-center py-6">
                Calculating closest optimal units...
              </div>
            ) : bundle && Object.keys(bundle.bundle).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(bundle.bundle).map(([rType, items]) => (
                  <div key={rType} className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      {rType} units ({items.length} matched)
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {items.map((it) => (
                        <div
                          key={it.unit.id}
                          className="bg-slate-800/80 border border-slate-700 p-2.5 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">{it.unit.name}</div>
                            <div className="text-[10px] text-slate-400">
                              Status: <span className="text-emerald-400 capitalize">{it.unit.status}</span>
                            </div>
                          </div>
                          {it.eta_minutes !== null && (
                            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[11px] font-mono text-amber-300">
                              <Clock className="w-3 h-3 text-amber-400" />
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
              <div className="text-xs text-slate-500 text-center py-4 bg-slate-800/30 rounded-xl border border-slate-800">
                No active resources available for assignment in this sector.
              </div>
            )}
          </div>

          {/* Designated Medical & Trauma Facilities */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Hospital className="w-4 h-4 text-cyan-400" />
                Designated Trauma & Burn Facilities
              </h4>
              <span className="text-[11px] text-slate-400">
                Live ICU Beds & Road ETAs
              </span>
            </div>

            {isLoadingHospitals ? (
              <div className="text-xs text-slate-400 text-center py-4">
                Matching closest specialized facilities with bed capacity...
              </div>
            ) : hospitals.length > 0 ? (
              <div className="space-y-2">
                {hospitals.map((hosp) => (
                  <div
                    key={hosp.id}
                    className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-xl flex items-center justify-between gap-3 text-xs hover:border-slate-600 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-100 truncate">{hosp.name}</span>
                        {hosp.burn_unit_available && (
                          <span className="text-[10px] bg-amber-950/80 border border-amber-700/80 text-amber-300 px-1.5 py-0.5 rounded font-medium">
                            Burn ICU
                          </span>
                        )}
                        {hosp.heliport && (
                          <span className="text-[10px] bg-blue-950/80 border border-blue-700/80 text-blue-300 px-1.5 py-0.5 rounded font-medium">
                            Heliport
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                        📍 {hosp.address} ({hosp.distance_km} km away)
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {hosp.matched_capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="text-[9px] font-mono bg-slate-900/80 text-slate-300 border border-slate-700/60 px-1.5 py-0.5 rounded"
                          >
                            {cap.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <div className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 px-2 py-0.5 rounded text-[11px] font-semibold">
                        <Bed className="w-3 h-3 text-emerald-400" />
                        <span>{hosp.available_icu_beds} ICU beds</span>
                      </div>
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[11px] font-mono text-cyan-300">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>{hosp.eta_minutes.toFixed(1)}m ETA</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 text-center py-3 bg-slate-800/30 rounded-xl border border-slate-800">
                No facility data currently matched for this incident sector.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            {isDispatched ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Units Dispatched & In-Route
              </span>
            ) : (
              <span>Review package before dispatching.</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDispatch}
              disabled={isDispatched}
              className={`text-xs font-semibold px-4 py-2 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                isDispatched
                  ? "bg-emerald-700 text-white cursor-default"
                  : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950"
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
