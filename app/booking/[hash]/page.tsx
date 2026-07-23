"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import PaymentButton from "@/components/payment-button"
import { Loader2 } from "lucide-react"
import InstagramSection from "@/components/instagram-section"

export default function BookingPage() {
  const params = useParams<{ hash: string }>()
  const [paymentParam, setPaymentParam] = useState<string | null>(null)

  // Read the ?payment= result from the Stripe redirect (client-only, no Suspense needed)
  useEffect(() => {
    setPaymentParam(new URLSearchParams(window.location.search).get("payment"))
  }, [])

  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState<any>(null)
  const [error, setError] = useState("")

  // Loading booking details
  const fetchBooking = async () => {
    try {
      const response = await fetch(`/api/bookings/hash/${params.hash}`)
      const data = await response.json()

      if (data.success) {
        setBooking(data.booking)
        return data.booking
      } else {
        setError("Failed to load booking data")
        return null
      }
    } catch (error) {
      console.error("Error fetching booking:", error)
      setError("An error occurred while loading data")
      return null
    }
  }

  // Main data loading
  useEffect(() => {
    if (!params.hash) return

    const loadData = async () => {
      setLoading(true)

      try {
        await fetchBooking()
      } catch (error) {
        console.error("Error loading data:", error)
        setError("An error occurred while loading data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.hash])

  // Helper function to check if a field is empty
  const isEmpty = (value: any) => {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0
    return false
  }

  const refCode = typeof params.hash === "string" ? params.hash.slice(0, 8).toUpperCase() : ""

  const statusMeta =
    booking?.status === "confirmed"
      ? {
          label: "Confirmed",
          dot: "bg-green-400",
          message: "Your booking has been confirmed. We look forward to meeting you.",
        }
      : booking?.status === "rejected"
        ? {
            label: "Rejected",
            dot: "bg-red-400",
            message: "Unfortunately, your booking has been rejected. Please contact us for more information.",
          }
        : {
            label: "Pending Confirmation",
            dot: "bg-amber-300 animate-pulse",
            message: "We have received your request and will contact you shortly to confirm the session.",
          }

  const isPaid = booking?.paymentStatus === "paid"

  const detailRows = booking
    ? [
        { label: "Full Name", value: booking.fullName },
        { label: "Email", value: booking.email },
        { label: "Phone", value: booking.phone },
        { label: "Instagram", value: booking.instagram },
        { label: "Preferred Time", value: booking.availability },
        {
          label: "Body Part",
          value: Array.isArray(booking.bodyPart) ? booking.bodyPart.join(", ") : booking.bodyPart,
        },
        { label: "Tattoo Idea", value: booking.idea },
      ].filter((row) => !isEmpty(row.value))
    : []

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-neutral-500" />
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-neutral-500 mb-6">Error</p>
              <h2 className="text-4xl md:text-6xl font-light mb-8">Something Went Wrong</h2>
              <div className="w-full h-px bg-neutral-600 mb-8"></div>
              <p className="text-lg text-neutral-400 font-light mb-12">{error}</p>
              <Link
                href="/"
                className="inline-flex h-14 items-center justify-center border border-neutral-600 px-12 font-semibold tracking-[0.2em] text-sm hover:bg-white hover:text-black transition-colors duration-300"
              >
                RETURN TO HOME
              </Link>
            </div>
          ) : booking ? (
            <div className="space-y-16 md:space-y-24">
              {/* Page header */}
              <div className="text-center">
                <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-neutral-500 mb-6">
                  Booking Request{refCode ? ` — № ${refCode}` : ""}
                </p>
                <h1 className="text-5xl md:text-7xl font-light mb-8">Your Booking</h1>
                <div className="w-full h-px bg-neutral-600"></div>
              </div>

              {/* Status overview */}
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-1 sm:gap-10 py-6 border-b border-neutral-800">
                  <span className="text-xs uppercase tracking-[0.25em] text-neutral-500 sm:pt-2">Status</span>
                  <span className="flex items-center gap-3 text-xl md:text-2xl font-light">
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${statusMeta.dot}`}></span>
                    {statusMeta.label}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-1 sm:gap-10 py-6 border-b border-neutral-800">
                  <span className="text-xs uppercase tracking-[0.25em] text-neutral-500 sm:pt-2">Deposit</span>
                  <span className="flex items-center gap-3 text-xl md:text-2xl font-light">
                    <span
                      className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${isPaid ? "bg-green-400" : "bg-neutral-600"}`}
                    ></span>
                    {isPaid ? "Paid" : "Awaiting Payment"}
                  </span>
                </div>
                <p className="mt-8 text-lg md:text-xl text-neutral-400 font-light max-w-2xl">
                  {statusMeta.message}
                </p>
              </div>

              {/* Payment result banner (shown after returning from Stripe) */}
              {paymentParam === "success" && (
                <div className="border border-green-500/30 px-6 py-4 text-center text-sm tracking-wide text-green-400">
                  Payment received — thank you. Your deposit has been confirmed.
                </div>
              )}
              {paymentParam === "failed" && (
                <div className="border border-red-500/30 px-6 py-4 text-center text-sm tracking-wide text-red-400">
                  We couldn't verify your payment. If money was debited, please contact us.
                </div>
              )}
              {paymentParam === "cancelled" && (
                <div className="border border-yellow-500/30 px-6 py-4 text-center text-sm tracking-wide text-yellow-400">
                  Payment was cancelled. You can try again below.
                </div>
              )}

              {/* Payment call to action */}
              {!isPaid && booking.status !== "rejected" && (
                <div className="border border-neutral-700 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-light mb-2">Secure Your Appointment</h2>
                    <p className="text-neutral-400 font-light">
                      Pay the deposit to finalize your booking and reserve the session.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <PaymentButton bookingHash={booking.bookingHash || params.hash} isPaid={false} />
                  </div>
                </div>
              )}

              {/* Booking details */}
              {detailRows.length > 0 && (
                <section>
                  <div className="text-center">
                    <h2 className="text-3xl md:text-5xl font-light mb-6">Booking Details</h2>
                    <div className="w-full h-px bg-neutral-600"></div>
                  </div>
                  <dl>
                    {detailRows.map(({ label, value }) => (
                      <div
                        key={label}
                        className="grid grid-cols-1 sm:grid-cols-[220px_1fr] gap-1 sm:gap-10 py-6 border-b border-neutral-800"
                      >
                        <dt className="text-xs uppercase tracking-[0.25em] text-neutral-500 sm:pt-1.5">{label}</dt>
                        <dd className="text-lg md:text-xl font-light break-words whitespace-pre-line">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {/* Reference image */}
              {!isEmpty(booking.tattooImage) && (
                <section>
                  <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-5xl font-light mb-6">Reference</h2>
                    <div className="w-full h-px bg-neutral-600"></div>
                  </div>
                  <div className="flex justify-center">
                    <img
                      src={booking.tattooImage || "/placeholder.svg"}
                      alt="Tattoo reference"
                      className="max-h-[28rem] w-auto object-contain border border-neutral-800"
                    />
                  </div>
                </section>
              )}

              {/* Back to home */}
              <Link
                href="/"
                className="w-full h-14 md:h-16 border border-neutral-600 text-white font-semibold tracking-[0.2em] text-sm md:text-base flex items-center justify-center hover:bg-white hover:text-black transition-colors duration-300"
              >
                RETURN TO HOME
              </Link>
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xs md:text-sm uppercase tracking-[0.35em] text-neutral-500 mb-6">Booking</p>
              <h2 className="text-4xl md:text-6xl font-light mb-8">Booking Not Found</h2>
              <div className="w-full h-px bg-neutral-600 mb-8"></div>
              <p className="text-lg text-neutral-400 font-light mb-12">
                The link may be invalid or the booking no longer exists.
              </p>
              <Link
                href="/"
                className="inline-flex h-14 items-center justify-center border border-neutral-600 px-12 font-semibold tracking-[0.2em] text-sm hover:bg-white hover:text-black transition-colors duration-300"
              >
                RETURN TO HOME
              </Link>
            </div>
          )}
        </div>
      </main>

      <InstagramSection />
      <Footer />
    </div>
  )
}
