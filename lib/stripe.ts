import Stripe from "stripe"

// Initialising Stripe with a secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || ""

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
})

// Creates a Stripe payment session for the booking
export async function createCheckoutSession(
  amount: number,
  currency: string,
  bookingHash: string,
  successUrl: string,
  cancelUrl: string,
  bookingUrl?: string,
) {
  try {
    // Create a description with the order URL
    const description = bookingUrl 
      ? `Reservation #${bookingHash} - View order: ${bookingUrl}`
      : `Reservation #${bookingHash}`

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: {
              name: "Booking a tattoo session",
              description: description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        bookingHash: bookingHash,
        bookingUrl: bookingUrl || '', // Add URL to metadata for additional information
      },
      // Set the session timeout (30 minutes)
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes from the current time
    })

    return {
      success: true,
      url: session.url,
      sessionId: session.id,
    }
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}

// Receives payment session details
export async function retrieveCheckoutSession(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    return { success: true, session }
  } catch (error) {
    console.error("Error retrieving checkout session:", error)
    return { success: false, error: "Failed to retrieve checkout session" }
  }
}

// Checks payment status
export async function checkSessionStatus(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    return {
      success: true,
      paymentStatus: session.payment_status,
      session,
    }
  } catch (error) {
    console.error("Error checking session status:", error)
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}

// List recent Stripe events
export async function listRecentEvents(limit = 10) {
  try {
    const events = await stripe.events.list({
      limit,
      types: [
        "checkout.session.completed",
        "checkout.session.expired",
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
      ],
    })

    return {
      success: true,
      events: events.data,
    }
  } catch (error) {
    console.error("Error listing recent events:", error)
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}

// Get Payment Intent
export async function getPaymentIntent(paymentIntentId: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return { success: true, paymentIntent }
  } catch (error) {
    console.error("Error retrieving payment intent:", error)
    return { success: false, error: "Failed to retrieve payment intent" }
  }
}

// Create Refund
export async function createRefund(paymentIntentId: string, amount?: number) {
  try {
    const refundData: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    }

    if (amount) {
      refundData.amount = amount * 100 // Convert to cents
    }

    const refund = await stripe.refunds.create(refundData)
    return { success: true, refund }
  } catch (error) {
    console.error("Error creating refund:", error)
    return { success: false, error: "Failed to create refund" }
  }
}

// Get Customer
export async function getCustomer(customerId: string) {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    return { success: true, customer: customer as Stripe.Customer }
  } catch (error) {
    console.error("Error retrieving customer:", error)
    return { success: false, error: "Failed to retrieve customer" }
  }
}

// Create Customer
export async function createCustomer(params: { username: string; name?: string; phone?: string }) {
  try {
    const customer = await stripe.customers.create({
      username: params.username,
      name: params.name,
      phone: params.phone,
    })
    return { success: true, customer }
  } catch (error) {
    console.error("Error creating customer:", error)
    return { success: false, error: "Failed to create customer" }
  }
}

// Get Balance
export async function getBalance() {
  try {
    const balance = await stripe.balance.retrieve()
    return { success: true, balance }
  } catch (error) {
    console.error("Error retrieving balance:", error)
    return { success: false, error: "Failed to retrieve balance" }
  }
}

// Checks payment status with additional validation
export async function checkSessionStatusWithValidation(sessionId: string, expectedAmount?: number) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    })

    // Additional security checks
    const validationResults = {
      paymentStatus: session.payment_status,
      session,
      validations: {
        amountMatch: true,
        sessionNotExpired: true,
        paymentIntentValid: true
      }
    }

    // Check the amount if transferred
    if (expectedAmount && session.amount_total) {
      const expectedAmountInCents = expectedAmount * 100
      validationResults.validations.amountMatch = session.amount_total === expectedAmountInCents
    }

    // Check that the session has not expired
    if (session.expires_at) {
      const now = Math.floor(Date.now() / 1000)
      validationResults.validations.sessionNotExpired = session.expires_at > now
    }

    // Check payment_intent if available
    if (session.payment_intent && typeof session.payment_intent === 'object') {
      validationResults.validations.paymentIntentValid = session.payment_intent.status === 'succeeded'
    }

    return {
      success: true,
      ...validationResults
    }
  } catch (error) {
    console.error("Error checking session status with validation:", error)
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}

// Verify and parse a Stripe webhook payload using the signing secret.
// Throws if STRIPE_WEBHOOK_SECRET is missing or the signature is invalid — the
// caller must treat any throw as "reject, do not process".
export function constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not configured")
  }
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

// Get session metadata for additional validation
export async function getSessionMetadata(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    return {
      success: true,
      metadata: session.metadata,
      customerDetails: session.customer_details,
      amountTotal: session.amount_total,
      currency: session.currency,
      created: session.created,
      expiresAt: session.expires_at
    }
  } catch (error) {
    console.error("Error getting session metadata:", error)
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}

export default stripe