// Types for bookings
export interface Booking {
  _id?: string
  bookingHash?: string // Unique hash for public access to the order
  availability: string // Free text for availability
  fullName: string
  username: string
  email: string // Add email field
  phone: string
  instagram: string
  hasTattoos: boolean
  bodyType: "feminine" | "masculine"
  bodyPart: string[]
  bodyPartsImage?: string
  idea: string
  tattooImage: string
  marketingConsent: boolean
  ageConfirmation: boolean
  privacyPolicyConsent: boolean
  status: BookingStatus
  paymentStatus: PaymentStatus // Added to track payment status
  paymentId?: string // Stripe session_id for this order
  paymentAmount?: number // Payment amount for validation
  expiresAt?: string // When the unpaid order expires
  notifiedAdmins?: boolean // Whether administrators have been notified about the order
  createdAt: string // ISO format date
  updatedAt?: string // ISO format date of the last update
}

export type BookingStatus = "pending" | "confirmed" | "rejected"
export type PaymentStatus = "unpaid" | "paid" | "failed"

export interface PaymentValidation {
  isValid: boolean
  reason?: string
  booking?: Booking
}

export interface PaymentSettings {
  _id?: string
  bookingPrice: number
  currency: string
  updatedAt: string
}

export interface TelegramAdmin {
  _id?: string
  chatId: string
  name: string
  createdAt: string
}

// Admin session type
export interface AdminSession {
  isAuthenticated: boolean
  lastLogin?: string
}

// Schedule types
export interface TimeSlot {
  _id?: string
  date: string // ISO format date (YYYY-MM-DD)
  time: string // Format: "HH:00"
  fullName: string
  username?: string
  phone?: string
  isBlocked: boolean
  note?: string
  createdAt: string // ISO format date
}
