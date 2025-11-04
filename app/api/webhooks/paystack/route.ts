import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"
import crypto from "crypto"
import { verifyPaymentAndGenerateTicket } from "@/app/actions/verify-payment"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    if (!signature) {
      return Response.json({ error: "Missing signature" }, { status: 400 })
    }

    const hash = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!).update(body).digest("hex")

    if (hash !== signature) {
      console.error("[v0] Invalid Paystack webhook signature")
      return Response.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(body)

    console.log("[v0] Webhook received:", { event: event.event, reference: event.data?.reference })

    // Store webhook event for audit
    await convex.mutation(api.webhooks.storeWebhookEvent, {
      provider: "paystack",
      eventType: event.event,
      payload: event.data,
      signature: signature,
    })

    // Handle charge.success event
    if (event.event === "charge.success") {
      const { reference, metadata } = event.data
      const parsedMetadata = typeof metadata === "string" ? JSON.parse(metadata) : metadata
      const { paymentId, eventId, userId, quantity, userEmail, userName } = parsedMetadata || {}

      console.log("[v0] Processing charge.success:", { paymentId, reference })

      try {
        await verifyPaymentAndGenerateTicket({
          paymentId,
          eventId,
          userId,
          quantity,
          userEmail,
          userName,
          paystackReference: reference,
        })
        console.log("[v0] Webhook payment processed successfully:", paymentId)
      } catch (err) {
        console.error("[v0] Webhook payment processing failed:", err)
      }
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("[v0] Paystack webhook error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
