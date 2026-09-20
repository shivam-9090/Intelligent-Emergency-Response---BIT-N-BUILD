import React, { useState, useRef } from "react";
import { classifyText, createIncident, analyzeIncidentImage } from "../api";
import { Sparkles, X, AlertCircle, Camera, CheckCircle2, Trash2, Zap } from "lucide-react";
import type { Incident, ImageAnalysisResponse } from "../types";
import { Button } from "./ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "./ui/field";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

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
  const formRef = useRef<HTMLFormElement>(null);

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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setIncidentType("fire");
    setLatitude("12.9716");
    setLongitude("77.5946");
    setAddress("Bangalore City Center");
    setImagePreview(null);
    setVisualAudit(null);
    setAiClassification(null);
    setError(null);
  };

  const handleModalClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (!description.trim()) {
      setError("Please provide an incident description / caller transcript.");
      formRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const finalTitle = title.trim() || `${incidentType.toUpperCase()} Emergency Report`;
    const parsedLat = parseFloat(latitude);
    const parsedLng = parseFloat(longitude);

    setIsSubmitting(true);
    setError(null);

    try {
      const newInc = await createIncident({
        title: finalTitle,
        description: description.trim(),
        source: "citizen_report",
        incident_type: incidentType,
        latitude: isNaN(parsedLat) ? 12.9716 : parsedLat,
        longitude: isNaN(parsedLng) ? 77.5946 : parsedLng,
        address: address.trim() || "Bangalore City Center",
      });

      onIncidentCreated(newInc);
      resetForm();
      onClose();
    } catch (err: any) {
      const msg = err.message || "Failed to submit emergency incident.";
      setError(msg);
      formRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#DCE3E8] w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#263238] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[#DCE3E8] flex items-center justify-between bg-[#F8FAFC] shrink-0">
          <div>
            <h2 className="text-sm font-bold text-[#0B1F33]">
              Report New Incident
            </h2>
            <p className="text-[11px] text-[#607D8B] mt-0.5">
              Live intake for dispatch routing, atmospheric risk analysis & resource allocation.
            </p>
          </div>
          <button
            onClick={handleModalClose}
            className="text-[#607D8B] hover:text-[#263238] p-1.5 rounded-lg hover:bg-[#EEF2F6] transition cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          ref={formRef}
          id="quick-intake-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-5 space-y-4"
        >
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#FDECEC] border border-[#EF9A9A] text-[#B71C1C] text-xs">
              <AlertCircle className="w-4 h-4 text-[#D32F2F] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <FieldGroup>
            {/* SECTION 1: Caller Transcript & Evidence */}
            <FieldSet>
              <div className="flex items-center justify-between">
                <FieldLegend>Caller Transcript / Emergency Description</FieldLegend>
                <button
                  type="button"
                  onClick={handleAiAutoDetect}
                  disabled={isClassifying}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1565C0] hover:text-[#0D47A1] bg-[#EAF3FB] border border-[#90CAF9] px-2.5 py-1 rounded-md transition hover:bg-[#D6E7F7] cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#1565C0]" />
                  {isClassifying ? "Analyzing incident..." : "AI Auto-Detect"}
                </button>
              </div>
              <FieldDescription>
                Transcribe caller audio or describe scene observation. AI will auto-classify type and priority.
              </FieldDescription>

              <Field>
                <Textarea
                  rows={3}
                  placeholder="e.g. Explosion at chemical factory! Workers trapped inside and dense black smoke spreading..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>

              {/* AI Auto-Detect Result Banner */}
              {aiClassification && (
                <div className="p-3 bg-[#EAF3FB] border border-[#90CAF9] rounded-lg space-y-1.5 text-xs">
                  <div className="flex items-center justify-between font-semibold text-[#1565C0]">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#1565C0]" />
                      AI Auto-Detected Classification
                    </span>
                    <span className="text-[11px] text-[#607D8B] font-mono">
                      {(aiClassification.confidence * 100).toFixed(1)}% Confidence
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-0.5">
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
                    <span className="bg-[#EEF2F6] border border-[#DCE3E8] px-2 py-0.5 rounded text-[11px] font-mono font-bold text-[#0B1F33]">
                      Priority {aiClassification.priority}
                    </span>
                  </div>
                </div>
              )}

              {/* Photo / Camera Evidence Upload */}
              <Field>
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
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-dashed border-[#DCE3E8] hover:border-[#1565C0] rounded-lg bg-[#F8FAFC] hover:bg-[#EAF3FB] text-xs text-[#607D8B] hover:text-[#0B1F33] transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#1565C0]" />
                    <span>Attach Scene Photo / Camera Evidence</span>
                  </button>
                ) : (
                  <div className="bg-[#F8FAFC] border border-[#DCE3E8] rounded-lg p-3 space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="relative w-16 h-16 rounded-md overflow-hidden border border-[#DCE3E8] shrink-0 bg-white">
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
                          <span className="text-xs font-bold text-[#0B1F33] flex items-center gap-1.5">
                            <Camera className="w-3.5 h-3.5 text-[#1565C0]" />
                            Visual Evidence Audit
                          </span>
                          {visualAudit && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-[#E8F5E9] border border-[#A5D6A7] text-[#2E7D32]">
                              <CheckCircle2 className="w-3 h-3 text-[#2E7D32]" />
                              {visualAudit.authenticity_status.replace("_", " ").toUpperCase()}
                            </span>
                          )}
                        </div>

                        {isAnalyzingImage ? (
                          <div className="flex items-center gap-2 mt-2 text-[11px] text-[#E65100]">
                            <Zap className="w-3.5 h-3.5 animate-spin" />
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
                              className="bg-white border border-[#DCE3E8] text-[#263238] text-[10px] px-2 py-0.5 rounded font-mono"
                            >
                              ⚠️ {h.hazard_type.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Field>
            </FieldSet>

            <FieldSeparator />

            {/* SECTION 2: Incident Information (Two-column layout) */}
            <FieldSet>
              <FieldLegend>Incident Information</FieldLegend>
              <FieldDescription>
                Specify exact operational parameters and geographical coordinates.
              </FieldDescription>

              <Field>
                <FieldLabel htmlFor="incident-title">Incident Title</FieldLabel>
                <Input
                  id="incident-title"
                  placeholder="e.g. Industrial Fire at Chemical Plant"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="incident-category">Incident Category</FieldLabel>
                  <Select value={incidentType} onValueChange={setIncidentType}>
                    <SelectTrigger id="incident-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="fire">Fire</SelectItem>
                        <SelectItem value="flood">Flood</SelectItem>
                        <SelectItem value="industrial_accident">Industrial Accident</SelectItem>
                        <SelectItem value="road_accident">Road Accident</SelectItem>
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="incident-address">Address / Landmark</FieldLabel>
                  <Input
                    id="incident-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="incident-latitude">Latitude</FieldLabel>
                  <Input
                    id="incident-latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="font-mono"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="incident-longitude">Longitude</FieldLabel>
                  <Input
                    id="incident-longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="font-mono"
                    required
                  />
                </Field>
              </div>
            </FieldSet>
          </FieldGroup>
        </form>

        {/* Sticky Footer */}
        <div className="p-4 border-t border-[#DCE3E8] bg-[#F8FAFC] flex items-center justify-between gap-2 shrink-0">
          {error ? (
            <div className="flex items-center gap-1.5 text-xs text-[#D32F2F] font-semibold truncate max-w-[55%]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">{error}</span>
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleModalClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="quick-intake-form"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting ? "Dispatching..." : "Submit Incident"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
