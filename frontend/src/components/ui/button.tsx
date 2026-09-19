import * as React from "react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const variantStyles = {
      default: "bg-[#1565C0] text-white hover:bg-[#0D47A1] shadow-xs",
      destructive: "bg-[#D32F2F] text-white hover:bg-[#B71C1C] shadow-xs",
      outline: "border border-[#DCE3E8] bg-white hover:bg-[#EEF2F6] text-[#263238]",
      secondary: "bg-[#EEF2F6] text-[#263238] hover:bg-[#E2E8F0]",
      ghost: "hover:bg-[#EEF2F6] text-[#263238]",
      link: "text-[#1565C0] underline-offset-4 hover:underline",
    }[variant]

    const sizeStyles = {
      default: "h-9 px-4 py-2 text-xs font-semibold",
      sm: "h-8 rounded-md px-3 text-xs font-medium",
      lg: "h-10 rounded-md px-6 text-sm font-semibold",
      icon: "h-9 w-9 p-0",
    }[size]

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1565C0] disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${variantStyles} ${sizeStyles} ${className}`}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
