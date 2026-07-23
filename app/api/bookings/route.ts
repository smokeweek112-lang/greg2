import { NextResponse } from "next/server";
import { getAllBookings, addBooking } from "@/lib/db";
import { requireAdmin, addSecurityHeaders } from "@/lib/auth";
import { generateBodyPartsImage } from "@/lib/body-parts-image-generator";

// Function for verifying Turnstile tokens with detailed logging
async function verifyTurnstileToken(token: string): Promise<{ success: boolean; details: any }> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || "1x0000000000000000000000000000000AA";

  // NOTE: `1x0000...AA` is Cloudflare's official "always passes" TEST secret.
  // It is only used in dev/staging; production must set a real secret in the env.
  if (secretKey === "1x0000000000000000000000000000000AA") {
    return {
      success: true, 
      details: { 
        success: true,
        challenge_ts: new Date().toISOString(),
        hostname: "localhost",
        action: "submit"
      } 
    };
  }

  if (!secretKey) {
    console.error("CLOUDFLARE_TURNSTILE_SECRET_KEY not configured");
    return { success: false, details: { error: "Secret key not configured" } };
  }

  try {
    const formData = new FormData();
    formData.append('secret', secretKey);
    formData.append('response', token);

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const outcome = await result.json();

    return {
      success: outcome.success === true,
      details: outcome
    };
  } catch (error) {
    console.error('Error verifying Turnstile token:', error);
    return {
      success: false,
      details: { error: (error as Error).message }
    };
  }
}

// GET /api/bookings - Get all bookings or filter by status (admin only)
export async function GET(request: Request) {
  try {
    // This endpoint exposes all customer PII, so it must be admin-only.
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const url = new URL(request.url);
    const status = url.searchParams.get("status") as "pending" | "confirmed" | "rejected" | null;

    let bookings = await getAllBookings();

    // Filter by status if provided
    if (status) {
      bookings = bookings.filter((booking) => booking.status === status);
    }

    return addSecurityHeaders(NextResponse.json({ success: true, bookings }));
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return addSecurityHeaders(
      NextResponse.json({ success: false, error: "Failed to fetch bookings" }, { status: 500 }),
    );
  }
}

// POST /api/bookings - Create a new booking
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // IMPORTANT: Checking the Turnstile token
    const { turnstileToken, ...bookingData } = body;

    if (!turnstileToken) {
      return NextResponse.json(
        {
          success: false,
          error: "Security verification is required. Please complete the security check.",
        },
        { status: 400 }
      );
    }

    if (typeof turnstileToken !== 'string' || turnstileToken.length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid security token. Please refresh the page and try again.",
        },
        { status: 400 }
      );
    }

    // Verify Turnstile token
    const verification = await verifyTurnstileToken(turnstileToken);

    if (!verification.success) {
      // Map specific Turnstile errors to a friendly message (details are logged
      // server-side only and never returned to the client).
      let errorMessage = "Security verification failed. Please try again.";

      if (verification.details?.['error-codes']) {
        const errorCodes = verification.details['error-codes'];

        if (errorCodes.includes('timeout-or-duplicate')) {
          errorMessage = "Security verification expired or already used. Please refresh the page and try again.";
        } else if (errorCodes.includes('invalid-input-response')) {
          errorMessage = "Invalid security token. Please refresh the page and try again.";
        } else if (errorCodes.includes('invalid-input-secret')) {
          errorMessage = "Server configuration error. Please contact support.";
        }
      }

      return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
    }

    // Generate body parts image if body parts are selected
    let bodyPartsImage = "";
    if (bookingData.bodyPart && Array.isArray(bookingData.bodyPart) && bookingData.bodyPart.length > 0) {
      try {
        bodyPartsImage = await generateBodyPartsImage(bookingData.bodyPart);
      } catch (error) {
        console.error("Error generating body parts image:", error);
        // Continue without the image if generation fails
      }
    }

    // Add booking to database with body parts image
    const finalBookingData = {
      ...bookingData,
      bodyPartsImage,
    };

    const { id, bookingHash } = await addBooking(finalBookingData);

    // No Telegram notification on creation — admins are notified only once the
    // booking is PAID (see the payment callback/webhook), so unpaid requests
    // don't spam them.

    // Return success response with booking ID and hash
    return NextResponse.json({
      success: true,
      bookingId: id,
      bookingHash,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to create booking",
    }, { status: 500 });
  }
}

// NOTE: There is intentionally no manual status-change endpoint. Bookings are
// confirmed automatically when paid (see markBookingPaid) — there is no admin
// approval step.