import { create } from "zustand"

interface BookingState {
  selectedBodyPart: string[]
  setSelectedBodyPart: (bodyPart: string[]) => void
  selectedDate: Date | null
  setSelectedDate: (date: Date | null) => void
  selectedTime: string | null
  setSelectedTime: (time: string | null) => void
  resetBooking: () => void
}

export const useBookingStore = create<BookingState>((set) => ({
  selectedBodyPart: [],
  setSelectedBodyPart: (bodyPart) => set({ selectedBodyPart: bodyPart }),
  selectedDate: null,
  setSelectedDate: (date) => set({ selectedDate: date }),
  selectedTime: null,
  setSelectedTime: (time) => set({ selectedTime: time }),
  resetBooking: () => set({ selectedBodyPart: [], selectedDate: null, selectedTime: null }),
}))
