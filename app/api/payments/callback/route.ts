import { NextResponse } from "next/server"
import { markBookingPaid } from "@/lib/db"
import { checkSessionStatusWithValidation } from "@/lib/stripe"
import { sendPaymentNotification } from "@/lib/telegram"

// GET /api/payments/callback?session_id=...
// Stripe redirects here after checkout. Payment is verified server-side against
// Stripe (never trusting the client), then the booking is marked paid. The booking
// is resolved from the session's own metadata, so a valid payment for one booking
// can't be redirected to mark a different (e.g. more expensive) booking as paid.
export async function GET(request: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin

  const redirectTo = (path: string) => NextResponse.redirect(`${appUrl}${path}`)

  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return redirectTo("/?payment=failed")
    }

    const price = Number(process.env.NEXT_PUBLIC_BOOKING_PRICE) || 100
    const check = await checkSessionStatusWithValidation(sessionId, price)

    const bookingHash = (check.session?.metadata?.bookingHash as string | undefined) || ""

    const isPaid =
      check.success &&
      check.paymentStatus === "paid" &&
      check.validations?.amountMatch === true &&
      check.validations?.paymentIntentValid === true

    if (!isPaid || !bookingHash) {
      return redirectTo(bookingHash ? `/booking/${bookingHash}?payment=failed` : "/?payment=failed")
    }

    const amountCents = check.session?.amount_total ?? Math.round(price * 100)
    const result = await markBookingPaid(bookingHash, sessionId, amountCents)

    if (!result.ok) {
      console.error("Failed to mark booking paid:", result.reason, "hash:", bookingHash)
      return redirectTo(`/booking/${bookingHash}?payment=failed`)
    }

    // Notify admins only on the first transition to paid (best-effort — never
    // block the customer's redirect on the notification).
    if (result.newlyPaid && result.booking) {
      await sendPaymentNotification(result.booking).catch((e) =>
        console.error("Payment notification failed:", e),
      )
    }

    return redirectTo(`/booking/${bookingHash}?payment=success`)
  } catch (error) {
    console.error("Error in payment callback:", error)
    return redirectTo("/?payment=failed")
  }
}
