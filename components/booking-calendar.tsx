"use client"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface AvailabilityInputProps {
  onAvailabilityChange: (value: string) => void
  availabilityText: string
  maxLength?: number
}

export default function AvailabilityInput({
  onAvailabilityChange,
  availabilityText,
  maxLength = 200,
}: AvailabilityInputProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="availability" className="text-lg font-medium mb-2 block">
          When is convenient for you to come?
        </Label>
        <Textarea
          id="availability"
          value={availabilityText}
          onChange={(e) => onAvailabilityChange(e.target.value)}
          placeholder="Specify convenient dates and times for your session..."
          className="min-h-[100px]"
          maxLength={maxLength}
        />
      </div>
    </div>
  )
}
