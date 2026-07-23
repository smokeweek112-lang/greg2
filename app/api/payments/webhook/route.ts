import { NextResponse } from "next/server"
import type Stripe from "stripe"
import { constructWebhookEvent } from "@/lib/stripe"
import { markBookingPaid } from "@/lib/db"
import { sendPaymentNotification } from "@/lib/telegram"

// Stripe needs the Node runtime (crypto for signature verification) and the raw,
// unbuffered request body.
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// POST /api/payments/webhook
// Authoritative source of truth for payment status: Stripe calls this server-to-server
// after a checkout completes, even if the customer never returns to the site.
// EVERY request is authenticated by the Stripe signature — an unsigned or forged
// payload is rejected and never touches the database.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Stripe webhook received but STRIPE_WEBHOOK_SECRET is not configured")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  // Raw body is required for signature verification — do not parse as JSON first.
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(rawBody, signature)
  } catch (err) {
    console.error("Webhook signature verification failed:", (err as Error).message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session
        const bookingHash = session.metadata?.bookingHash

        // Only mark paid when Stripe itself reports the session as paid, and resolve
        // the booking from the session metadata we set at checkout (never from input).
        if (bookingHash && session.payment_status === "paid") {
          const amount = session.amount_total ?? 0
          const result = await markBookingPaid(bookingHash, session.id, amount)
          if (!result.ok) {
            console.error("Webhook could not mark booking paid:", result.reason, "hash:", bookingHash)
          } else if (result.newlyPaid && result.booking) {
            // Notify admins only on the first transition to paid.
            await sendPaymentNotification(result.booking).catch((e) =>
              console.error("Payment notification failed:", e),
            )
          }
        }
        break
      }
      default:
        // Other event types are acknowledged but not acted on.
        break
    }
  } catch (err) {
    // Return 500 so Stripe retries delivery later.
    console.error("Error handling Stripe webhook:", err)
    return NextResponse.json({ error: "Handler error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
