import { type NextRequest, NextResponse } from "next/server"
import { addMultipleTimeSlots } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { date, times, note } = await request.json()

    if (!date || !times || !Array.isArray(times) || times.length === 0) {
      return NextResponse.json({ success: false, error: "The date and time must be specified." }, { status: 400 })
    }

    const result = await addMultipleTimeSlots(date, times, note || "")

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `${result.addedCount} time slots successfully booked`,
      })
    } else {
      return NextResponse.json({ success: false, error: "Unable to reserve temporary slots" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error blocking time slots:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
