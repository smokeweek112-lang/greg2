import { NextResponse } from "next/server";
import { getAllBookings, getTelegramAdmins } from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";
import { requireAdmin, addSecurityHeaders } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const url = new URL(request.url);
    const status = url.searchParams.get("status") as "pending" | "confirmed" | "all" | null;

    // Get all bookings
    const bookings = await getAllBookings();

    // Filter bookings by status if specified
    const filteredBookings =
      status && status !== "all" ? bookings.filter((booking) => booking.status === status) : bookings;

    // If no bookings found, return error
    if (!filteredBookings.length) {
      return addSecurityHeaders(
        NextResponse.json({ success: false, error: "No bookings found with specified status" }, { status: 404 }),
      );
    }

    // Get list of administrators directly from the database (no internal HTTP call)
    const admins = await getTelegramAdmins();

    if (!admins.length) {
      return addSecurityHeaders(
        NextResponse.json({ success: false, error: "No administrators found to send to" }, { status: 404 }),
      );
    }

    // Format message with booking list
    const statusText =
      status === "pending" ? "pending confirmation" : status === "confirmed" ? "confirmed" : "all";

    let message = `📋 <b>List of ${statusText} bookings</b>\n\n`;

    filteredBookings.forEach((booking, index) => {
      const paymentStatus = booking.paymentStatus === "paid" ? "✅ Paid" : "❌ Not paid";

      message += `<b>${index + 1}. ${booking.fullName}</b>\n`;
      message += `📱 Phone: ${booking.phone}\n`;
      message += `📅 Date: ${booking.availability}\n`;
      message += `💰 Payment status: ${paymentStatus}\n\n`;
    });

    // Send message to all administrators
    const sendPromises = admins.map(async (admin) => {
      return await sendTelegramMessage(admin.chatId, message);
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter((result) => result.success).length;

    return addSecurityHeaders(
      NextResponse.json({
        success: successCount > 0,
        sentCount: successCount,
        totalAdmins: admins.length,
      }),
    );
  } catch (error) {
    console.error("Error sending bookings list:", error);
    return addSecurityHeaders(
      NextResponse.json({ success: false, error: "Unable to send booking list" }, { status: 500 }),
    );
  }
}