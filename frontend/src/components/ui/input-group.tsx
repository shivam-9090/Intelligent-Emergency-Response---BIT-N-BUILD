import * as React from "react"

export interface InputGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

export function InputGroup({
  className = "",
  children,
  ...props
}: InputGroupProps) {
  return (
    <div
      className={`relative flex items-center w-full rounded-lg border border-[#163A59] bg-[#102A43] focus-within:border-[#1565C0] focus-within:ring-1 focus-within:ring-[#1565C0] transition ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export interface InputGroupInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  InputGroupInputProps
>(({ className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`flex-1 bg-transparent px-3 py-1.5 text-xs text-white placeholder-[#90A4AE] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  )
})
InputGroupInput.displayName = "InputGroupInput"

export interface InputGroupAddonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  align?: "inline-start" | "inline-end"
}

export function InputGroupAddon({
  className = "",
  align = "inline-start",
  children,
  ...props
}: InputGroupAddonProps) {
  return (
    <div
      className={`flex items-center text-[#90A4AE] text-xs px-2.5 shrink-0 ${
        align === "inline-end" ? "order-last border-l border-[#163A59]" : "order-first"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
