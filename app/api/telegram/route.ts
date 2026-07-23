import { NextResponse } from "next/server"
import { requireAdmin, addSecurityHeaders } from "@/lib/auth"

// GET: read recent Telegram bot updates (admin only).
// Used by the admin dashboard to discover chat IDs for new admins.
export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      return addSecurityHeaders(
        NextResponse.json({ success: false, error: "Telegram bot token not found" }, { status: 500 }),
      )
    }

    // Fail fast instead of hanging on the default (long) connect timeout.
    const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`, {
      signal: AbortSignal.timeout(8000),
    })
    const data = await response.json()

    return addSecurityHeaders(NextResponse.json({ success: true, updates: data }))
  } catch (error) {
    console.error("Error getting Telegram updates:", error)
    return addSecurityHeaders(
      NextResponse.json(
        {
          success: false,
          error:
            "Could not reach the Telegram API. Check the server's network connection to api.telegram.org (or configure a proxy).",
        },
        { status: 502 },
      ),
    )
  }
}
