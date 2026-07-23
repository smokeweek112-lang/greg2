import { NextResponse } from "next/server"
import { getStatistics } from "@/lib/db"
import { requireAdmin, addSecurityHeaders } from "@/lib/auth"

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const statistics = await getStatistics()

    return addSecurityHeaders(
      NextResponse.json({
        success: true,
        statistics,
      }),
    )
  } catch (error) {
    console.error("Error fetching statistics:", error)
    return addSecurityHeaders(NextResponse.json({ success: false, error: "Server error" }, { status: 500 }))
  }
}
