"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Clock, Plus, X } from "lucide-react"
import { format, addDays } from "date-fns"
import { ru } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import AdminLayout from "@/components/admin/admin-layout"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { TimeSlot } from "@/lib/types"

export default function SchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [bookedSlots, setBookedSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedTimes, setSelectedTimes] = useState<string[]>([])
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [blockNote, setBlockNote] = useState("")
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [slotToRemove, setSlotToRemove] = useState<string | null>(null)
  const [bookingDate, setBookingDate] = useState<Date | undefined>(new Date())

  // Fetch booked slots for the selected date
  const fetchBookedSlots = async (selectedDate: Date) => {
    if (!selectedDate) return

    setLoading(true)
    setError("")

    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd")
      const response = await fetch(`/api/bookings/time-slots?date=${formattedDate}`)
      const data = await response.json()

      if (data.success) {
        setBookedSlots(data.bookedSlots || [])

        // Calculate available times
        const allTimes = Array.from({ length: 11 }, (_, i) => `${i + 10}:00`)
        const bookedTimes = new Set(data.bookedSlots.map((slot: TimeSlot) => slot.time))
        setAvailableTimes(allTimes.filter((time) => !bookedTimes.has(time)))
      } else {
        setError(data.error || "Failed to load data")
      }
    } catch (error) {
      console.error("Error fetching booked slots:", error)
      setError("An error occurred while loading data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (date) {
      fetchBookedSlots(date)
    }
  }, [date])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setDate(selectedDate)
    }
  }

  const handleBookingDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      setBookingDate(selectedDate)
      setSelectedTimes([]) // Reset selected times when date changes
    }
  }

  const handleAddBlockedSlots = async () => {
    if (!bookingDate || selectedTimes.length === 0) return

    setLoading(true)
    setError("")

    try {
      const formattedDate = format(bookingDate, "yyyy-MM-dd")

      const response = await fetch("/api/bookings/block-slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: formattedDate,
          times: selectedTimes,
          note: blockNote,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the booked slots if the booking date is the same as the currently viewed date
        if (bookingDate.toDateString() === date?.toDateString()) {
          fetchBookedSlots(date)
        }
        setShowAddDialog(false)
        setSelectedTimes([])
        setBlockNote("")
      } else {
        setError(data.error || "Failed to book slots")
      }
    } catch (error) {
      console.error("Error booking time slots:", error)
      setError("An error occurred while booking slots")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBlockedSlot = async (id: string) => {
    if (!id) return

    setLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/bookings/block-slot?id=${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        // Refresh the booked slots
        fetchBookedSlots(date!)
      } else {
        setError(data.error || "Failed to cancel booking")
      }
    } catch (error) {
      console.error("Error unblocking time slot:", error)
      setError("An error occurred while canceling booking")
    } finally {
      setLoading(false)
    }
  }

  const confirmRemoveSlot = (id: string) => {
    setSlotToRemove(id)
    setShowConfirmDialog(true)
  }

  const executeRemoveSlot = async () => {
    if (slotToRemove) {
      await handleRemoveBlockedSlot(slotToRemove)
      setShowConfirmDialog(false)
      setSlotToRemove(null)
    }
  }

  const toggleTimeSelection = (time: string) => {
    setSelectedTimes((prev) => (prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time]))
  }

  // Calculate the date one year from now for the calendar
  const oneYearFromNow = addDays(new Date(), 365)

  return (
    <AdminLayout title="Schedule Management">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-medium mb-2">Select date to view</h2>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-start bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ru }) : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={handleDateSelect}
                  initialFocus
                  fromDate={undefined} // Allow selecting any date
                  toDate={oneYearFromNow}
                  classNames={{
                    head_cell: "text-center",
                    day_range_start: "day-range-start",
                    day_range_end: "day-range-end",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button onClick={() => setShowAddDialog(true)} className="bg-black text-white hover:bg-neutral-800">
            <Plus className="mr-2 h-4 w-4" />
            Book Time
          </Button>
        </div>

        {error && <div className="bg-red-50 text-red-500 p-4 rounded-md">{error}</div>}

        <div className="bg-neutral-50 rounded-lg p-4">
          <h3 className="font-medium mb-4">
            Booked slots on {date ? format(date, "d MMMM yyyy", { locale: ru }) : "selected date"}
          </h3>

          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : bookedSlots.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">No booked slots for this date</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {bookedSlots.map((slot) => (
                <div
                  key={slot._id}
                  className={`p-4 rounded-lg ${
                    slot.isBlocked ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="font-medium">{slot.time}</span>
                    </div>
                    {slot.isBlocked && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100 -mt-1 -mr-1"
                        onClick={() => confirmRemoveSlot(slot._id!)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {slot.note && <p className="text-xs text-neutral-500 mt-1">{slot.note}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Booking Slot Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Time Slot</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium mb-2">Select date for booking</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {bookingDate ? format(bookingDate, "PPP", { locale: ru }) : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={bookingDate}
                    onSelect={handleBookingDateSelect}
                    initialFocus
                    fromDate={undefined} // Allow selecting any date
                    toDate={oneYearFromNow}
                    classNames={{
                      head_cell: "text-center",
                      day_range_start: "day-range-start",
                      day_range_end: "day-range-end",
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Select time (multiple selection allowed)</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                {Array.from({ length: 11 }, (_, i) => `${i + 10}:00`).map((time) => (
                  <div key={time} className="flex items-center space-x-2">
                    <Checkbox
                      id={`time-${time}`}
                      checked={selectedTimes.includes(time)}
                      onCheckedChange={() => toggleTimeSelection(time)}
                    />
                    <Label htmlFor={`time-${time}`} className="cursor-pointer">
                      {time}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Note (optional)</p>
              <Textarea
                placeholder="Add a note to the booking"
                value={blockNote}
                onChange={(e) => setBlockNote(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddBlockedSlots}
              disabled={selectedTimes.length === 0 || loading}
              className="bg-black text-white hover:bg-neutral-800"
            >
              {loading ? "Saving..." : "Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to cancel this booking?</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={executeRemoveSlot} className="bg-red-600 hover:bg-red-700">
              Cancel Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .rdp-head_cell {
          text-align: center !important;
        }
        .rdp-day_selected {
          background-color: black !important;
        }
      `}</style>
    </AdminLayout>
  )
}
