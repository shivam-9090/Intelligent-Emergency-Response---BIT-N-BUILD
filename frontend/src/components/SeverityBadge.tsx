import React from "react";

export interface SeverityBadgeProps {
  severity: "critical" | "high" | "medium" | "low" | "resolved" | string;
  className?: string;
  size?: "sm" | "md";
}

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-[#FDECEC] text-[#B71C1C] border-[#EF9A9A]",
  high: "bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]",
  medium: "bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]",
  low: "bg-[#E3F2FD] text-[#1565C0] border-[#90CAF9]",
  resolved: "bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]",
};

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  className = "",
  size = "sm",
}) => {
  const normSeverity = severity.toLowerCase();
  const style = SEVERITY_STYLES[normSeverity] || "bg-[#EEF2F6] text-[#607D8B] border-[#DCE3E8]";
  const sizeClasses = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wider uppercase rounded border font-mono ${sizeClasses} ${style} ${className}`}
    >
      {severity}
    </span>
  );
};
