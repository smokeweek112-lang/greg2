// Server-side functions for Telegram API
import { getTelegramAdmins } from "./db"
import type { Booking } from "./types"

function getTelegramBotToken() {
  if (typeof window !== 'undefined') {
    // Running on client side - return null or throw error
    return null;
  }
  
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    throw new Error("Missing TELEGRAM_BOT_TOKEN env variable");
  }
  
  return process.env.TELEGRAM_BOT_TOKEN;
}

// Sends a message to Telegram
export async function sendTelegramMessage(chatId: string | number, text: string) {
  try {
    const token = getTelegramBotToken();
    if (!token) {
      return { success: false, error: "Telegram token not available on client side" };
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Sends photos to Telegram
export async function sendTelegramPhoto(chatId: string | number, photo: string, caption?: string, filename?: string) {
  try {
    const token = getTelegramBotToken();
    if (!token) {
      return { success: false, error: "Telegram token not available on client side" };
    }

    // Convert base64 to buffer
    const base64Data = photo.replace(/^data:image\/[a-z]+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Determine file extension from data URL
    let mimeType = "image/png";
    let extension = "png";
    
    if (photo.startsWith("data:image/jpeg")) {
      mimeType = "image/jpeg";
      extension = "jpg";
    } else if (photo.startsWith("data:image/jpg")) {
      mimeType = "image/jpeg";  
      extension = "jpg";
    }

    const formData = new FormData();
    formData.append("chat_id", chatId.toString());
    formData.append("photo", new Blob([buffer], { type: mimeType }), filename || `image.${extension}`);
    if (caption) {
      formData.append("caption", caption);
      formData.append("parse_mode", "HTML");
    }

    const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Telegram API error: ${JSON.stringify(errorData)}`);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Helper function to format body parts array into readable text
function formatBodyParts(bodyParts: string[] | string): string {
  if (!bodyParts) return "";
  
  if (Array.isArray(bodyParts)) {
    if (bodyParts.length === 0) return "";
    
    // Convert technical names to readable names
    const readableNames = bodyParts.map(part => {
      return part
        .replace(/_/g, " ")  // Replace underscores with spaces
        .replace(/-\d+$/g, "") // Remove trailing numbers (e.g., "-2", "-3")
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    });
    
    // Remove duplicates and join
    const uniqueNames = [...new Set(readableNames)];
    return uniqueNames.join(", ");
  }
  
  // If it's a string, just return it
  if (typeof bodyParts === "string" && bodyParts.trim()) {
    return bodyParts;
  }
  
  return "";
}

// Sends a booking notification to all administrators
export async function sendBookingRequest(
  bookingId: string,
  fullName: string,
  phone: string,
  email: string,
  instagram: string,
  hasTattoos: boolean,
  bodyType: string,
  availability: string,
  bodyParts: string[] | string,
  idea: string,
  bodyPartsImage?: string,
  tattooImage?: string,
) {
  try {
    // Read the administrator list directly from the database. This function runs
    // server-side during a public booking request (which carries no admin cookie),
    // so it must NOT call the protected /api/admin/telegram-admins HTTP endpoint.
    const admins = await getTelegramAdmins();

    if (admins.length === 0) {
      return { success: false, error: "No Telegram admins found" };
    }

    // Format body parts
    const formattedBodyParts = formatBodyParts(bodyParts);

    // Build message with only non-empty fields
    let message = `<b>🔔 New Booking Request</b>\n\n`;

    // Add fields only if they have content
    if (fullName && fullName.trim()) {
      message += `👤 <b>Name:</b> ${fullName}\n`;
    }

    if (phone && phone.trim()) {
      message += `📱 <b>Phone:</b> <code>${phone}</code>\n`;
    }

    if (email && email.trim()) {
      message += `📧 <b>Email:</b> <code>${email}</code>\n`;
    }

    if (hasTattoos) {
      message += `🖼 <b>Has tattoos:</b> ✅\n`;
    } else {
      message += `🖼 <b>Has tattoos:</b> ❌\n`;
    }

    if (bodyType && bodyType.trim()) {
      if (bodyType == "masculine") {
        message += `👦 <b>Body type:</b> ${bodyType}\n`;
      } else if (bodyType == "feminine") {
        message += `👧 <b>Body type:</b> ${bodyType}\n`;
      }
    }

    if (availability && availability.trim()) {
      message += `📅 <b>Date:</b> ${availability}\n`;
    }

    if (formattedBodyParts) {
      message += `🎯 <b>Body parts:</b> ${formattedBodyParts}\n`;
    }

    if (idea && idea.trim()) {
      message += `💡 <b>Idea:</b> ${idea}\n`;
    }

    message += `🆔 <b>Booking ID:</b> ${bookingId}\n\n`;

    // Send message and images to each administrator
    const results = await Promise.all(
      admins.map(async (admin: { chatId: string }) => {
        try {
          // First send text message
          const messageResult = await sendTelegramMessage(admin.chatId, message);
          
          if (!messageResult.success) {
            return messageResult;
          }

          const imageResults = [];

          // Send body parts image if available
          if (bodyPartsImage) {
            const bodyPartsResult = await sendTelegramPhoto(
              admin.chatId,
              bodyPartsImage,
              "📍 Selected body parts for tattoo",
              "body-parts.png"
            );
            imageResults.push(bodyPartsResult);
          }

          // Send tattoo idea image if available
          if (tattooImage) {
            const tattooResult = await sendTelegramPhoto(
              admin.chatId,
              tattooImage,
              "💡 Tattoo idea from client",
              "tattoo-idea.jpg"
            );
            imageResults.push(tattooResult);
          }

          // Check if all operations were successful
          const allImagesSuccess = imageResults.length === 0 || imageResults.every(result => result.success);

          return { 
            success: messageResult.success && allImagesSuccess,
            error: !allImagesSuccess ? "Failed to send some images" : undefined
          };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      }),
    );

    // Check if any submissions were successful
    const anySuccess = results.some((result) => result.success);
    const failedCount = results.filter((result) => !result.success).length;

    return { 
      success: anySuccess,
      totalAdmins: admins.length,
      failedCount,
      details: results
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// Notifies all administrators that a booking has been paid, with its details.
export async function sendPaymentNotification(booking: Booking) {
  try {
    const admins = await getTelegramAdmins();

    if (admins.length === 0) {
      return { success: false, error: "No Telegram admins found" };
    }

    const amount =
      typeof booking.paymentAmount === "number" ? `€${(booking.paymentAmount / 100).toFixed(2)}` : "—";
    const formattedBodyParts = formatBodyParts(booking.bodyPart);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    let message = `<b>💰 Booking PAID</b>\n\n`;

    if (booking.fullName && booking.fullName.trim()) {
      message += `👤 <b>Name:</b> ${booking.fullName}\n`;
    }
    if (booking.phone && booking.phone.trim()) {
      message += `📱 <b>Phone:</b> <code>${booking.phone}</code>\n`;
    }
    if (booking.email && booking.email.trim()) {
      message += `📧 <b>Email:</b> <code>${booking.email}</code>\n`;
    }
    if (booking.instagram && booking.instagram.trim()) {
      message += `📸 <b>Instagram:</b> ${booking.instagram}\n`;
    }
    if (booking.availability && booking.availability.trim()) {
      message += `📅 <b>Preferred time:</b> ${booking.availability}\n`;
    }
    if (formattedBodyParts) {
      message += `🎯 <b>Body parts:</b> ${formattedBodyParts}\n`;
    }
    if (booking.idea && booking.idea.trim()) {
      message += `💡 <b>Idea:</b> ${booking.idea}\n`;
    }

    message += `💶 <b>Amount:</b> ${amount}\n`;

    if (booking.bookingHash) {
      message += `\n🔗 <a href="${appUrl}/booking/${booking.bookingHash}">Open booking</a>`;
    }

    const results = await Promise.all(
      admins.map(async (admin) => {
        const textResult = await sendTelegramMessage(admin.chatId, message);

        // Also send the booking's images so the artist gets the full brief.
        if (booking.bodyPartsImage) {
          await sendTelegramPhoto(admin.chatId, booking.bodyPartsImage, "📍 Selected body parts", "body-parts.png");
        }
        if (booking.tattooImage) {
          await sendTelegramPhoto(admin.chatId, booking.tattooImage, "💡 Reference image", "reference.jpg");
        }

        return textResult;
      }),
    );

    return { success: results.some((result) => result.success), totalAdmins: admins.length };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

// NOTE: The client-safe wrappers `getTelegramUpdates` and `sendBookingsList`
// now live in ./telegram-client so that this server-only module (which imports
// the MongoDB layer) is never pulled into a client bundle.