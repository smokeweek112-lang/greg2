import { NextResponse } from "next/server"
import { getBookingByHash } from "@/lib/db"
import { createCheckoutSession } from "@/lib/stripe"

// POST /api/payments/checkout
// Customer-facing: creates a Stripe Checkout session for a booking identified by
// its (unguessable) bookingHash. Not admin-protected — the hash is the bearer
// token, same trust model as viewing the booking page.
export async function POST(request: Request) {
  try {
    const { bookingHash } = await request.json()

    if (!bookingHash || typeof bookingHash !== "string") {
      return NextResponse.json({ success: false, error: "Missing bookingHash" }, { status: 400 })
    }

    const booking = await getBookingByHash(bookingHash)
    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 })
    }

    if (booking.paymentStatus === "paid") {
      return NextResponse.json(
        { success: false, error: "This booking is already paid", isPaid: true },
        { status: 400 },
      )
    }

    if (booking.status === "rejected") {
      return NextResponse.json(
        { success: false, error: "This booking was rejected and cannot be paid" },
        { status: 400 },
      )
    }

    // Amount comes from server config, never from the client.
    const price = Number(process.env.NEXT_PUBLIC_BOOKING_PRICE) || 100
    const amountInCents = Math.round(price * 100)
    const currency = "eur"

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const bookingUrl = `${appUrl}/booking/${bookingHash}`
    // Stripe substitutes {CHECKOUT_SESSION_ID}; the callback verifies payment server-side.
    const successUrl = `${appUrl}/api/payments/callback?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${bookingUrl}?payment=cancelled`

    const result = await createCheckoutSession(
      amountInCents,
      currency,
      bookingHash,
      successUrl,
      cancelUrl,
      bookingUrl,
    )

    if (!result.success || !result.url) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to create payment session" },
        { status: 502 },
      )
    }

    return NextResponse.json({ success: true, url: result.url, sessionId: result.sessionId })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ success: false, error: "Failed to create payment" }, { status: 500 })
  }
}
