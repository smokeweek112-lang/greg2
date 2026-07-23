import { NextResponse } from "next/server"
import { getTimeSlotsForDate } from "@/lib/db"
import { requireAdmin, addSecurityHeaders } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    // Only the admin schedule page consumes this, and slots carry internal notes,
    // so require an authenticated admin.
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    if (!date) {
      return NextResponse.json({ success: false, error: "Date not specified" }, { status: 400 })
    }

    // Get all booked slots for the date
    const bookedSlots = await getTimeSlotsForDate(date)

    return NextResponse.json({
      success: true,
      bookedSlots,
    })
  } catch (error) {
    console.error("Error fetching time slots:", error)
    return NextResponse.json(
      { success: false, error: "Error receiving data about time slots" },
      { status: 500 },
    )
  }
}
