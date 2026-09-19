import * as React from "react"

export function FieldGroup({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function FieldSet({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLFieldSetElement>) {
  return (
    <fieldset className={`space-y-3 ${className}`} {...props}>
      {children}
    </fieldset>
  )
}

export function FieldLegend({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLLegendElement>) {
  return (
    <legend className={`text-xs font-bold uppercase tracking-wider text-[#0B1F33] ${className}`} {...props}>
      {children}
    </legend>
  )
}

export function FieldDescription({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-[11px] text-[#607D8B] ${className}`} {...props}>
      {children}
    </p>
  )
}

export function FieldLabel({
  className = "",
  children,
  htmlFor,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-xs font-semibold text-[#263238] mb-1 ${className}`}
      {...props}
    >
      {children}
    </label>
  )
}

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal"
}

export function Field({
  className = "",
  orientation = "vertical",
  children,
  ...props
}: FieldProps) {
  return (
    <div
      className={`${
        orientation === "horizontal"
          ? "flex items-center gap-2"
          : "space-y-1"
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function FieldSeparator({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      className={`border-t border-[#DCE3E8] my-3 ${className}`}
      {...props}
    />
  )
}
