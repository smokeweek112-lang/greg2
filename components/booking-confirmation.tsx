"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"

export default function BookingConfirmation() {
  const [bookingHash, setBookingHash] = useState<string | null>(null)

  useEffect(() => {
    // Get booking hash from localStorage if it was saved
    const hash = localStorage.getItem("bookingHash")
    if (hash) {
      setBookingHash(hash)
    }
  }, [])

  return (
    <div className="max-w-2xl mx-auto bg-neutral-50 p-8 rounded-lg text-center">
      <div className="flex justify-center mb-6">
        <CheckCircle className="h-16 w-16 text-green-500" />
      </div>
      <h2 className="text-2xl font-bold mb-4">Your request has been successfully submitted!</h2>
      <p className="mb-6">
        Thank you for your interest! We will review your request and contact you shortly to confirm your booking.
      </p>

      {bookingHash && (
        <div className="mb-6 p-4 bg-white rounded-md border border-neutral-200">
          <p className="text-sm text-neutral-500 mb-2">Link to your booking:</p>
          <Link href={`/booking/${bookingHash}`} className="text-blue-600 hover:underline break-all">
            {window.location.origin}/booking/{bookingHash}
          </Link>
          <p className="text-sm text-neutral-500 mt-2">Save this link to check the status of your booking at any time.</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/">
          <Button variant="outline" className="w-full sm:w-auto bg-transparent">
            Return to Home
          </Button>
        </Link>
        <Link href="/work">
          <Button className="w-full sm:w-auto bg-black text-white hover:bg-neutral-800">View Gallery</Button>
        </Link>
      </div>
    </div>
  )
}
