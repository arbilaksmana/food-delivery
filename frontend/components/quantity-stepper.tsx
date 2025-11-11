"use client"

import { Button } from "@/components/ui/button"
import { Minus, Plus } from "lucide-react"

type QuantityStepperProps = {
  quantity: number
  onQuantityChange: (quantity: number) => void
  min?: number
  max?: number
  disabled?: boolean
}

export function QuantityStepper({
  quantity,
  onQuantityChange,
  min = 1,
  max = 20,
  disabled = false,
}: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onQuantityChange(Math.max(quantity - 1, min))}
        disabled={disabled || quantity <= min}
        className="h-8 w-8"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-8 text-center font-medium">{quantity}</span>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onQuantityChange(Math.min(quantity + 1, max))}
        disabled={disabled || quantity >= max}
        className="h-8 w-8"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
