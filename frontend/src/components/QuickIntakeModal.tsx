import React, { useState, useRef } from "react";
import { classifyText, createIncident, analyzeIncidentImage } from "../api";
import { Sparkles, X, AlertCircle, Camera, CheckCircle2, Trash2, Zap } from "lucide-react";
import type { Incident, ImageAnalysisResponse } from "../types";

interface QuickIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIncidentCreated: (inc: Incident) => void;
}

export const QuickIntakeModal: React.FC<QuickIntakeModalProps> = ({
  isOpen,
  onClose,
  onIncidentCreated,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentType, setIncidentType] = useState("fire");
  const [latitude, setLatitude] = useState("12.9716");
  const [longitude, setLongitude] = useState("77.5946");
  const [address, setAddress] = useState("Bangalore City Center");

  const [isClassifying, setIsClassifying] = useState(false);
  const [aiClassification, setAiClassification] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Multi-Modal Vision State
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [visualAudit, setVisualAudit] = useState<ImageAnalysisResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAiAutoDetect = async () => {
    if (!description.trim()) {
      setError("Please enter an incident description first.");
      return;
    }
    setError(null);
    setIsClassifying(true);
    try {
      const res = await classifyText(description);
      setAiClassification(res);
      setIncidentType(res.incident_type);
      if (!title.trim()) {
        setTitle(`${res.incident_type.toUpperCase()} Emergency Call`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to classify text with AI");
    } finally {
      setIsClassifying(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setIsAnalyzingImage(true);
      setError(null);
      try {
        const audit = await analyzeIncidentImage(dataUrl, incidentType, description);
        setVisualAudit(audit);
        if (!title.trim()) {
          setTitle(`Visual Verified: ${audit.damage_severity.toUpperCase()} ${incidentType.toUpperCase()} Incident`);
        }
      } catch (err: any) {
        console.error("Image analysis failed:", err);
        setError(err.message || "Visual analysis failed");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const newInc = await createIncident({
        title,
        description,
        source: "citizen_report",
        incident_type: incidentType,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
      });

      onIncidentCreated(newInc);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit emergency incident.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#DCE3E8] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-[#263238]">
        <div className="p-5 border-b border-[#DCE3E8] flex items-center justify-between bg-[#EEF2F6]">
          <div className="text-sm font-bold text-[#263238] flex items-center gap-2">
            Report New Incident
          </div>
          <button
            onClick={onClose}
            className="text-[#607D8B] hover:text-[#263238] p-1 rounded-lg hover:bg-[#E8F1FA] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#FDECEC] border border-[#EF9A9A] text-[#B71C1C] text-xs">
              <AlertCircle className="w-4 h-4 text-[#D32F2F] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#263238]">
                Caller Transcript / Emergency Description
              </label>
              <button
                type="button"
                onClick={handleAiAutoDetect}
                disabled={isClassifying}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1565C0] hover:text-[#0D47A1] bg-[#E8F1FA] border border-[#90CAF9] px-2.5 py-1 rounded-md transition hover:bg-[#D6E7F7] cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#1565C0] animate-spin" style={{ animationDuration: isClassifying ? '1s' : '0s' }} />
                {isClassifying ? "Analyzing..." : "AI Auto-Detect"}
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="e.g. Explosion at chemical factory! Workers trapped inside and flames spreading..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white border border-[#DCE3E8] rounded-lg p-3 text-xs text-[#263238] placeholder-[#90A4AE] focus:outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20 transition"
            />
          </div>

          {/* Multi-Modal Scene Photo Upload & Visual Audit */}
          <div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />

            {!imagePreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border border-dashed border-[#DCE3E8] hover:border-[#1565C0] rounded-xl bg-[#EEF2F6] hover:bg-[#E8F1FA] text-xs text-[#607D8B] hover:text-[#263238] transition cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#1565C0]" />
                <span>Attach Scene Photo / Camera Evidence (Multi-Modal Vision AI)</span>
              </button>
            ) : (
              <div className="bg-[#EEF2F6] border border-[#DCE3E8] rounded-xl p-3 space-y-2.5">
                <div className="flex items-start gap-3">
                  <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#DCE3E8] shrink-0 bg-white">
                    <img
                      src={imagePreview}
                      alt="Incident Evidence"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-[#D32F2F] text-white p-0.5 rounded transition"
                      title="Remove photo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#263238] flex items-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-[#1565C0]" />
                        Visual Evidence Audit
                      </span>
                      {visualAudit && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F5E9] border border-[#A5D6A7] text-[#2E7D32]">
                          <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" />
                          {visualAudit.authenticity_status.replace("_", " ").toUpperCase()}
                        </span>
                      )}
                    </div>

                    {isAnalyzingImage ? (
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-[#E65100] animate-pulse">
                        <Zap className="w-3.5 h-3.5 animate-bounce" />
                        Analyzing photo with Vision AI...
                      </div>
                    ) : visualAudit ? (
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                            visualAudit.damage_severity === "critical"
                              ? "bg-[#FDECEC] text-[#B71C1C] border border-[#EF9A9A]"
                              : "bg-[#FFF3E0] text-[#E65100] border border-[#FFCC80]"
                          }`}>
                            {visualAudit.damage_severity.toUpperCase()} DAMAGE ({visualAudit.damage_score}%)
                          </span>
                          <span className="text-[10px] text-[#607D8B] font-mono">
                            {visualAudit.analysis_provider.split(" ")[0]}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#263238] line-clamp-2 leading-tight">
                          {visualAudit.tactical_assessment}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {visualAudit && visualAudit.detected_hazards.length > 0 && (
                  <div className="pt-2 border-t border-[#DCE3E8]">
                    <span className="text-[10px] font-semibold text-[#607D8B] block mb-1">
                      Detected Visual Hazards:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {visualAudit.detected_hazards.map((h, i) => (
                        <span
                          key={i}
                          className="bg-white border border-[#DCE3E8] text-[#263238] text-[10px] px-2 py-0.5 rounded-md font-mono"
                        >
                          ⚠️ {h.hazard_type.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AI Detection Result Pill */}
          {aiClassification && (
            <div className="p-3 bg-[#EAF3FB] border border-[#90CAF9] rounded-xl space-y-1 text-xs">
              <div className="flex items-center justify-between font-semibold text-[#1565C0]">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#1565C0]" />
                  ML Classification
                </span>
                <span className="text-[11px] text-[#607D8B]">
                  {(aiClassification.confidence * 100).toFixed(1)}% Confidence
                </span>
              </div>
              <div className="flex gap-2 pt-1">
                <span className="bg-[#E3F2FD] border border-[#90CAF9] px-2 py-0.5 rounded text-[11px] font-bold text-[#1565C0]">
                  {aiClassification.incident_type.toUpperCase()}
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                  aiClassification.severity === "critical"
                    ? "bg-[#FDECEC] text-[#B71C1C] border-[#EF9A9A]"
                    : "bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]"
                }`}>
                  {aiClassification.severity.toUpperCase()}
                </span>
                <span className="bg-[#EEF2F6] border border-[#DCE3E8] px-2 py-0.5 rounded text-[11px] font-mono text-[#263238]">
                  Priority {aiClassification.priority}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#263238] mb-1.5">
              Incident Title
            </label>
            <input
              type="text"
              placeholder="e.g. Industrial Fire at Chemical Plant"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white border border-[#DCE3E8] rounded-lg px-3 py-2 text-xs text-[#263238] placeholder-[#90A4AE] focus:outline-none focus:border-[#1565C0] focus:ring-2 focus:ring-[#1565C0]/20 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1.5">
                Incident Category
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full bg-white border border-[#DCE3E8] rounded-lg px-3 py-2 text-xs text-[#263238] focus:outline-none focus:border-[#1565C0] transition"
              >
                <option value="fire">Fire</option>
                <option value="flood">Flood</option>
                <option value="industrial_accident">Industrial Accident</option>
                <option value="road_accident">Road Accident</option>
                <option value="medical">Medical</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1.5">
                Address / Landmark
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-white border border-[#DCE3E8] rounded-lg px-3 py-2 text-xs text-[#263238] focus:outline-none focus:border-[#1565C0] transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1.5">
                Latitude
              </label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="w-full bg-white border border-[#DCE3E8] rounded-lg px-3 py-2 text-xs text-[#263238] font-mono focus:outline-none focus:border-[#1565C0] transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#263238] mb-1.5">
                Longitude
              </label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="w-full bg-white border border-[#DCE3E8] rounded-lg px-3 py-2 text-xs text-[#263238] font-mono focus:outline-none focus:border-[#1565C0] transition"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[#263238] bg-white border border-[#DCE3E8] hover:bg-[#E8F1FA] transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1565C0] hover:bg-[#0D47A1] text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Dispatching..." : "Submit Incident"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
