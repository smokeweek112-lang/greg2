// Client-safe Telegram helpers.
// These are thin wrappers around same-origin API routes and contain NO server
// secrets or database imports, so they are safe to import from client components.
// (The server-only Telegram functions live in ./telegram, which imports the DB.)

// Gets updates from the Telegram bot via the protected admin API route.
export async function getTelegramUpdates(): Promise<any> {
  const response = await fetch("/api/telegram", { method: "GET" })

  if (!response.ok) {
    throw new Error("Failed to get Telegram updates")
  }

  return await response.json()
}

// Asks the server to send the current bookings list to all Telegram admins.
export async function sendBookingsList(status: "pending" | "confirmed" | "all" = "all"): Promise<boolean> {
  try {
    const response = await fetch(`/api/admin/bookings-list?status=${status}`)

    if (!response.ok) {
      return false
    }

    const data = await response.json()
    return data.success
  } catch (error) {
    return false
  }
}
