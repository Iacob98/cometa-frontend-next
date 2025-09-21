"use client"

import * as React from "react"
import { Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface RadioGroupContextValue {
  value?: string
  onValueChange?: (value: string) => void
  name?: string
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({})

const RadioGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    onValueChange?: (value: string) => void
    name?: string
  }
>(({ className, value, onValueChange, name, ...props }, ref) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, name }}>
      <div
        className={cn("grid gap-2", className)}
        ref={ref}
        role="radiogroup"
        {...props}
      />
    </RadioGroupContext.Provider>
  )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    value: string
  }
>(({ className, value, ...props }, ref) => {
  const context = React.useContext(RadioGroupContext)
  const isChecked = context.value === value

  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        ref={ref}
        type="radio"
        value={value}
        checked={isChecked}
        onChange={(e) => {
          if (e.target.checked && context.onValueChange) {
            context.onValueChange(value)
          }
        }}
        name={context.name}
        className="sr-only"
        {...props}
      />
      <div
        className={cn(
          "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center",
          className
        )}
      >
        {isChecked && <Circle className="h-2.5 w-2.5 fill-current text-current" />}
      </div>
    </label>
  )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }