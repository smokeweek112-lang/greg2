import { type NextRequest, NextResponse } from "next/server"
import { getBookingByHash } from "@/lib/db"

export async function GET(request: NextRequest, context: { params: Promise<{ hash: string }> }) {
  try {
    const { hash } = await context.params

    if (!hash) {
      return NextResponse.json({ success: false, error: "Hash not specified" }, { status: 400 })
    }

    const booking = await getBookingByHash(hash)

    if (!booking) {
      return NextResponse.json({ success: false, error: "No reservations found" }, { status: 404 })
    }

    // The hash acts as a bearer link, but still return only the fields the
    // customer-facing page needs — never the raw document (which holds internal
    // fields such as _id, bookingHash, notifiedAdmins, admin notes, etc.).
    const safeBooking = {
      status: booking.status,
      paymentStatus: booking.paymentStatus ?? "unpaid",
      bookingHash: booking.bookingHash,
      fullName: booking.fullName,
      email: booking.email,
      phone: booking.phone,
      instagram: booking.instagram,
      availability: booking.availability,
      bodyPart: booking.bodyPart,
      idea: booking.idea,
      tattooImage: booking.tattooImage,
    }

    return NextResponse.json({ success: true, booking: safeBooking })
  } catch (error) {
    console.error("Error fetching booking by hash:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
