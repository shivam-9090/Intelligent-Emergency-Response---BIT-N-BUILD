import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "warning" | "success"
}

export function Badge({
  className = "",
  variant = "default",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    default: "border-transparent bg-[#1565C0] text-white hover:bg-[#0D47A1]",
    secondary: "border-transparent bg-[#EEF2F6] text-[#263238] hover:bg-[#E2E8F0]",
    destructive: "border-transparent bg-[#D32F2F] text-white hover:bg-[#B71C1C]",
    outline: "border-[#DCE3E8] text-[#263238]",
    warning: "border-transparent bg-[#FFF3E0] text-[#E65100] border-[#FFCC80]",
    success: "border-transparent bg-[#E8F5E9] text-[#2E7D32] border-[#A5D6A7]",
  }[variant]

  return (
    <div
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#1565C0] focus:ring-offset-2 ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
