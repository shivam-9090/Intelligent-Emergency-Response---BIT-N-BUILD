import * as React from "react"

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive" | "warning" | "success"
}

export function Alert({
  className = "",
  variant = "default",
  children,
  ...props
}: AlertProps) {
  const variantStyles = {
    default: "bg-white text-[#263238] border-[#DCE3E8]",
    destructive: "border-[#EF9A9A] bg-[#FDECEC] text-[#B71C1C]",
    warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50",
    success: "border-[#A5D6A7] bg-[#E8F5E9] text-[#2E7D32]",
  }[variant]

  return (
    <div
      role="alert"
      className={`relative w-full rounded-lg border p-3.5 text-xs [&>svg~*]:pl-6 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-3.5 [&>svg]:top-3.5 [&>svg]:text-current ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function AlertTitle({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={`mb-1 font-bold leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h5>
  )
}

export function AlertDescription({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={`text-xs leading-relaxed opacity-90 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
