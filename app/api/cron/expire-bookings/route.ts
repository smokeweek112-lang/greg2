import { NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { expireUnpaidBookings } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// The endpoint is not under /api/admin, so it protects itself with a shared secret.
// Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>`; external
// schedulers must send the same header.
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const provided = request.headers.get("authorization") || ""
  const expected = `Bearer ${secret}`

  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  // Length check first — timingSafeEqual throws on length mismatch.
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

async function handle(request: Request) {
  if (!process.env.CRON_SECRET) {
    console.error("Cron endpoint hit but CRON_SECRET is not configured")
    return NextResponse.json({ success: false, error: "Cron not configured" }, { status: 500 })
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  try {
    const expiredCount = await expireUnpaidBookings()
    return NextResponse.json({ success: true, expiredCount })
  } catch (error) {
    console.error("Error expiring unpaid bookings:", error)
    return NextResponse.json({ success: false, error: "Failed to expire bookings" }, { status: 500 })
  }
}

// Vercel Cron issues GET; POST is also accepted for manual/external triggers.
export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}
