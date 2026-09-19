import * as React from "react"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <textarea
        className={`flex min-h-[60px] w-full rounded-lg border border-[#DCE3E8] bg-white px-3 py-2 text-xs text-[#263238] shadow-xs placeholder:text-[#90A4AE] focus-visible:outline-none focus-visible:border-[#1565C0] focus-visible:ring-1 focus-visible:ring-[#1565C0] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"
