"use server"

import { api } from "@/convex/_generated/api"
import { ConvexHttpClient } from "convex/browser"
import { sendTicketEmail } from "@/lib/send-ticket-email"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

interface VerifyPaymentProps {
  paymentId?: string
  eventId?: string
  userId?: string
  quantity?: number
  userEmail: string
  userName: string
  paystackReference: string
}

export async function verifyPaymentAndGenerateTicket({
  paymentId,
  eventId,
  userId,
  quantity,
  userEmail,
  userName,
  paystackReference,
}: VerifyPaymentProps) {
  try {
    console.log("[v0] Server action: verifying payment and generating ticket")

    let finalUserId = userId
    // Try to resolve userId from payment record. If paymentId isn't provided, try providerReference lookup.
    try {
      if (!finalUserId && paymentId) {
        const payment = await convex.query(api.payments.getPayment, { paymentId: paymentId as any })
        finalUserId = payment?.userId
        console.log("[v0] Retrieved userId from payment record:", finalUserId)
      }
    } catch (err) {
      console.error("[v0] Failed to fetch payment by id:", err)
    }

    // If still no userId, attempt to find payment by provider reference
    try {
      if (!finalUserId) {
        const found = await convex.query(api.payments.getPaymentByProviderReference, { providerReference: paystackReference })
        if (found) {
          finalUserId = found.userId
          console.log("[v0] Retrieved userId from providerReference lookup:", finalUserId)
        }
      }
    } catch (err) {
      console.error("[v0] Failed to lookup payment by providerReference:", err)
    }

    // If still no userId, create or get a user using supplied email/name
    try {
      if (!finalUserId) {
        const newUserId = await convex.mutation(api.users.createOrGetUser, { email: userEmail, name: userName })
        finalUserId = newUserId
        console.log("[v0] Created/found user for email; userId:", finalUserId)
      }
    } catch (err) {
      console.error("[v0] Failed to create/get user:", err)
    }

    // Update payment status (we may pass paymentId or providerReference - the Convex mutation handles both)
    try {
      await convex.mutation(api.payments.updatePaymentStatus, {
        paymentId: paymentId as any,
        status: "completed",
        providerReference: paystackReference,
      })
    } catch (err) {
      console.error("[v0] Failed to update payment status (non-fatal):", err)
    }

    console.log("[v0] Payment status updated")

    // Generate ticket
    const ticketResult = await convex.mutation(api.tickets.generateTicket, {
      paymentId: (paymentId as any) || undefined,
      eventId: eventId as any,
      userId: finalUserId as any,
    })

    console.log("[v0] Ticket generated:", ticketResult)

    // Send email with ticket details if we have an eventId and a user
    try {
      let event = null
      if (eventId) {
        event = await convex.query(api.events.getById, { eventId: eventId as any })
      }

      const user = await convex.query(api.users.getById, { userId: finalUserId as any })

      if (event && user && ticketResult) {
        const eventDate = new Date(event.date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })

        await sendTicketEmail({
          email: user.email || userEmail,
          name: user.name || userName,
          eventName: event.name,
          eventDate,
          eventVenue: event.venue,
          ticketCode: ticketResult.ticketCode,
          qrCodeUrl: ticketResult.qrCodeUrl,
          ticketId: ticketResult.ticketId,
        })

        console.log("[v0] Ticket email sent successfully")
      } else {
        console.log("[v0] Skipping ticket email; missing event or user or ticketResult")
      }
    } catch (emailError) {
      console.error("[v0] Failed to send ticket email:", emailError)
      // Don't fail the payment if email fails
    }

    console.log("[v0] Payment verified successfully")
    return {
      success: true,
      message: "Payment verified and ticket generated",
      ticketId: ticketResult?.ticketId,
    }
  } catch (error) {
    console.error("[v0] Payment verification error:", error)
    throw error
  }
}
