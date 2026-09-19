import * as React from "react"
import { ChevronDown } from "lucide-react"

interface SelectContextType {
  value: string
  onValueChange: (val: string) => void
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SelectContext = React.createContext<SelectContextType | undefined>(undefined)

export interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (val: string) => void
  items?: Array<{ label: string; value: any }>
  children?: React.ReactNode
}

export function Select({
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  children,
}: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const [isOpen, setIsOpen] = React.useState(false)

  const value = controlledValue !== undefined ? controlledValue : internalValue

  const handleValueChange = (val: string) => {
    if (controlledValue === undefined) {
      setInternalValue(val)
    }
    onValueChange?.(val)
    setIsOpen(false)
  }

  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: handleValueChange,
        isOpen,
        setIsOpen,
      }}
    >
      <div ref={containerRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({
  id,
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("SelectTrigger must be used within Select")

  return (
    <button
      id={id}
      type="button"
      onClick={() => context.setIsOpen((prev) => !prev)}
      className={`flex h-9 w-full items-center justify-between rounded-lg border border-[#DCE3E8] bg-white px-3 py-1.5 text-xs text-[#263238] shadow-xs focus:outline-none focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0] cursor-pointer ${className}`}
      {...props}
    >
      {children}
      <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0" />
    </button>
  )
}

export function SelectValue({
  placeholder = "Select...",
  className = "",
}: {
  placeholder?: string
  className?: string
}) {
  const context = React.useContext(SelectContext)
  return (
    <span className={`truncate text-xs ${!context?.value ? "text-[#90A4AE]" : "text-[#263238]"} ${className}`}>
      {context?.value || placeholder}
    </span>
  )
}

export function SelectContent({
  className = "",
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const context = React.useContext(SelectContext)
  if (!context || !context.isOpen) return null

  return (
    <div
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#DCE3E8] bg-white py-1 shadow-lg animate-in fade-in-80 duration-100 ${className}`}
    >
      {children}
    </div>
  )
}

export function SelectGroup({
  className = "",
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={`p-1 ${className}`}>{children}</div>
}

export function SelectItem({
  value,
  className = "",
  children,
}: {
  value: string | null
  className?: string
  children: React.ReactNode
}) {
  const context = React.useContext(SelectContext)
  if (!context) return null

  const isSelected = String(context.value) === String(value)

  return (
    <div
      onClick={() => context.onValueChange(String(value ?? ""))}
      className={`relative flex w-full cursor-pointer select-none items-center rounded px-2.5 py-1.5 text-xs outline-none transition-colors hover:bg-[#EEF2F6] hover:text-[#1565C0] ${
        isSelected ? "bg-[#EAF3FB] font-semibold text-[#1565C0]" : "text-[#263238]"
      } ${className}`}
    >
      <span className="truncate">{children}</span>
    </div>
  )
}
