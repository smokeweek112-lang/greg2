import { NextResponse } from "next/server"
import { addTimeSlot, removeTimeSlot } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"

// POST: Block a time slot (admin only)
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { date, time, note } = await request.json()

    if (!date || !time) {
      return NextResponse.json({ success: false, error: "The date and time must be specified." }, { status: 400 })
    }

    // Add a blocked time slot
    await addTimeSlot({
      date,
      time,
      fullName: "Reserved by the administrator",
      isBlocked: true,
      note: note || "",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error blocking time slot:", error)

    // Check if it's a duplicate error
    if (error instanceof Error && error.message.includes("already taken")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: "Error when locking a temporary slot" }, { status: 500 })
  }
}

// DELETE: Unblock a time slot (admin only)
export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID not specified" }, { status: 400 })
    }

    // Remove the time slot
    const success = await removeTimeSlot(id)

    if (!success) {
      return NextResponse.json({ success: false, error: "Time slot not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error unblocking time slot:", error)
    return NextResponse.json({ success: false, error: "Error unlocking temporary slot" }, { status: 500 })
  }
}
