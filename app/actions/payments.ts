"use server"

import { api } from "@/convex/_generated/api"
import { ConvexHttpClient } from "convex/browser"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function getPaymentDetails(paymentId: string) {
  try {
    const payment = await convex.query(api.payments.getPayment, {
      paymentId: paymentId as any,
    })

    if (!payment) {
      throw new Error("Payment not found")
    }

    const event = await convex.query(api.events.getById, {
      eventId: payment.eventId,
    })

    if (!event) {
      throw new Error("Event not found")
    }

    return { payment, event }
  } catch (error) {
    console.error("[v0] Error fetching payment details:", error)
    throw error
  }
}
