import { type NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api" // Declare the api variable

const ZENDAPT_API_KEY = process.env.ZENDAPT_API_KEY
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get("x-zendapt-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    // Verify webhook signature
    const crypto = await import("crypto")
    const hash = crypto.createHmac("sha256", ZENDAPT_API_KEY!).update(JSON.stringify(body)).digest("hex")

    if (hash !== signature) {
      console.error("[v0] ZendApt webhook signature verification failed")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Store webhook event for audit
    await convex.mutation(api.webhooks.storeWebhookEvent, {
      provider: "zendapt",
      eventType: body.event_type,
      payload: body,
      signature: signature,
    })

    // Handle payment completion
    if (body.event_type === "transaction.completed") {
      const paymentId = body.data.reference

      // Update payment status
      await convex.mutation(api.payments.updatePaymentStatus, {
        paymentId: paymentId as any,
        status: "completed",
        providerReference: body.data.transaction_id,
      })

      console.log("[v0] ZendApt payment completed:", paymentId)
    }

    // Handle payment failure
    if (body.event_type === "transaction.failed") {
      const paymentId = body.data.reference

      await convex.mutation(api.payments.updatePaymentStatus, {
        paymentId: paymentId as any,
        status: "failed",
        providerReference: body.data.transaction_id,
      })

      console.log("[v0] ZendApt payment failed:", paymentId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] ZendApt webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
