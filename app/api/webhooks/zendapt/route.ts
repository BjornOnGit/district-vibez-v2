import { type NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api" // Declare the api variable
import { verifyPaymentAndGenerateTicket } from "@/app/actions/verify-payment"

const ZENDAPT_API_KEY = process.env.ZENDAPT_API_KEY
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: NextRequest) {
  try {
    // Read raw request body for signature verification
    const raw = await request.text()

    // Gather potential signature & timestamp headers (Svix uses svix-signature / svix-timestamp)
    const headers = Object.fromEntries(Array.from(request.headers.entries()))
    const possibleSigHeaders = [
      "svix-signature",
      "svix-signature-256",
      "x-zendapt-signature",
      "x-zendapt-signature256",
      "signature",
      "x-signature",
    ]

    let signatureHeader: string | null = null
    for (const h of possibleSigHeaders) {
      const v = request.headers.get(h)
      if (v) {
        signatureHeader = v
        break
      }
    }

    if (!signatureHeader) {
      console.error("[v0] Missing signature header; headers:", headers)
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    // Use webhook-specific secret if provided; fall back to API key for compatibility
    const ZENDAPT_WEBHOOK_SECRET = process.env.ZENDAPT_WEBHOOK_SECRET || ZENDAPT_API_KEY
    if (!ZENDAPT_WEBHOOK_SECRET) {
      console.error("[v0] Missing Zendapt webhook secret configuration")
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 })
    }

    const crypto = await import("crypto")

    // Svix signs the payload as: HMAC_SHA256(secret, `${timestamp}.${body}`)
    // If svix-timestamp header is present, use it to build the signed payload.
    const ts = request.headers.get("svix-timestamp") || request.headers.get("x-zendapt-timestamp") || request.headers.get("svix-time")
    const signedPayload = ts ? `${ts}.${raw}` : raw

    // Compute expected signature (base64)
    const expectedBase64 = crypto.createHmac("sha256", ZENDAPT_WEBHOOK_SECRET!).update(signedPayload).digest("base64")

    // Parse signature header which may contain one or more tokens in different formats.
    // Example header values encountered: "v1,7tfC5Ff...= v1,l0qqmq...=" or "v1=...", or "t=...,v1=..."
    const sigCandidates: string[] = []
    // Split on spaces first (some providers separate multiple signatures by space)
    for (const part of signatureHeader.split(/\s+/)) {
      // Extract base64-like token after v1=, v1, v1, or just bare token
      const m1 = part.match(/v1=([A-Za-z0-9+/=]+)/)
      if (m1 && m1[1]) sigCandidates.push(m1[1])
      else {
        // match v1,<token> or v1,<token>=(with equals) or just token
        const m2 = part.match(/v1,?([A-Za-z0-9+/=]+)/)
        if (m2 && m2[1]) sigCandidates.push(m2[1])
        else {
          // try to find any base64 substring
          const m3 = part.match(/([A-Za-z0-9+/=]{16,})/)
          if (m3 && m3[1]) sigCandidates.push(m3[1])
        }
      }
    }

    if (sigCandidates.length === 0) {
      console.error("[v0] No signature candidates parsed from header", { header: signatureHeader })
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    // Prefer using Svix's official verifier if available (clean, battle-tested).
    // If `svix` is installed we use it exclusively (return 400 on verify failure).
    // If `svix` is not installed, fall back to manual verification that tries
    // both webhook secret and API key and both base64/hex encodings.
    let verified = false
    let svixParsedBody: any = null
    try {
      const svix = await import("svix")
      if (svix && svix.Webhook) {
        const secretToUse = process.env.ZENDAPT_WEBHOOK_SECRET || ZENDAPT_API_KEY || ""
        const wh = new svix.Webhook(secretToUse)
        const svixHeaders: Record<string, string> = {}
        const svixId = request.headers.get("svix-id") || request.headers.get("svix_id")
        const svixTimestamp = request.headers.get("svix-timestamp") || request.headers.get("x-zendapt-timestamp")
        const svixSignature = request.headers.get("svix-signature") || signatureHeader || ""
        if (svixId) svixHeaders["svix-id"] = svixId
        if (svixTimestamp) svixHeaders["svix-timestamp"] = svixTimestamp
        if (svixSignature) svixHeaders["svix-signature"] = svixSignature

        try {
          // Throws on invalid signature; returns parsed payload on success
          svixParsedBody = wh.verify(raw, svixHeaders)
          verified = true
        } catch (err) {
          console.error("[v0] Svix verification failed:", err)
          return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
        }
      }
    } catch (e) {
      // svix not installed; continue to manual verification below
    }

    if (!verified) {
      let matchedUsing: { secretType: string; encoding: "base64" | "hex"; candidateIndex: number } | null = null

      const secretsToTry: Array<{ name: string; secret: string } > = []
      if (ZENDAPT_WEBHOOK_SECRET) secretsToTry.push({ name: "webhook", secret: ZENDAPT_WEBHOOK_SECRET })
      if (ZENDAPT_API_KEY && ZENDAPT_API_KEY !== ZENDAPT_WEBHOOK_SECRET) secretsToTry.push({ name: "apiKey", secret: ZENDAPT_API_KEY })

      for (const { name, secret } of secretsToTry) {
        // try base64 digest
        try {
          const expectedBase64Try = crypto.createHmac("sha256", secret).update(signedPayload).digest("base64")
          const expectedBufBase64 = Buffer.from(expectedBase64Try, "base64")
          for (let i = 0; i < sigCandidates.length; i++) {
            const candidate = sigCandidates[i]
            try {
              const candBuf = Buffer.from(candidate, "base64")
              if (candBuf.length === expectedBufBase64.length && crypto.timingSafeEqual(candBuf, expectedBufBase64)) {
                verified = true
                matchedUsing = { secretType: name, encoding: "base64", candidateIndex: i }
                break
              }
            } catch (e) {
              // ignore invalid base64 candidate
            }
          }
          if (verified) break
        } catch (e) {
          // ignore
        }

        // try hex digest as an alternative encoding
        try {
          const expectedHexTry = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex")
          const expectedBufHex = Buffer.from(expectedHexTry, "hex")
          for (let i = 0; i < sigCandidates.length; i++) {
            const candidate = sigCandidates[i]
            try {
              const candBuf = Buffer.from(candidate, "hex")
              if (candBuf.length === expectedBufHex.length && crypto.timingSafeEqual(candBuf, expectedBufHex)) {
                verified = true
                matchedUsing = { secretType: name, encoding: "hex", candidateIndex: i }
                break
              }
            } catch (e) {
              // ignore invalid hex candidate
            }
          }
          if (verified) break
        } catch (e) {
          // ignore
        }
      }

      if (!verified) {
        console.error("[v0] ZendApt webhook signature verification failed", { header: signatureHeader, parsedCount: sigCandidates.length, triedSecrets: secretsToTry.map(s => s.name) })
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }

      if (matchedUsing && matchedUsing.secretType === "apiKey" && !process.env.ZENDAPT_WEBHOOK_SECRET) {
        console.warn("[v0] ZendApt webhook verified using API key; consider setting ZENDAPT_WEBHOOK_SECRET to the webhook signing secret for stricter verification")
      }
    }

    // If svix verified the payload, use its parsed result; otherwise parse raw JSON
    const body = svixParsedBody ?? JSON.parse(raw)

    // Normalize event type and data payload across different providers / svix shapes
    const eventType = (body && (body.event_type || body.eventType || body.event)) || (body?.payload && (body.payload.event || body.payload.event_type))
    const data = body?.data || body?.payload?.data || {}

    // Store webhook event for audit
    await convex.mutation(api.webhooks.storeWebhookEvent, {
      provider: "zendapt",
      eventType: eventType as string,
      payload: body,
      signature: signatureHeader,
    })

    // Handle successful payment events. Zendapt may send different event names; accept common variants.
    if (eventType === "transaction.completed" || eventType === "transaction.success" || eventType === "payment.successful") {
      // The provider typically includes a reference/id and transaction id; metadata often contains event_id and quantity/tickets
      const paymentId = data?.reference || data?.ref || data?.id
      const providerReference = data?.transaction_id || data?.transactionId || data?.id
      const metadata = data?.metadata || data?.meta || {}
      const eventId = metadata?.event_id || metadata?.eventId || metadata?.event_id
      const quantity = metadata?.quantity || (Array.isArray(metadata?.tickets) ? metadata.tickets.reduce((s: number, t: any) => s + (t.quantity || 0), 0) : undefined)
      const userEmail = data?.customer_email || data?.customerEmail || metadata?.user_email || metadata?.userEmail
      const userName = data?.customer_name || data?.customerName || metadata?.user_name || metadata?.userName
      const userId = metadata?.userId || metadata?.user_id || metadata?.user_id

      // Update payment status in Convex
      try {
        if (paymentId) {
          await convex.mutation(api.payments.updatePaymentStatus, {
            paymentId: paymentId as any,
            status: "completed",
            providerReference: providerReference,
          })
          console.log("[v0] ZendApt payment completed:", paymentId)
        }
      } catch (err) {
        console.error("[v0] Failed to update payment status for zendapt webhook:", err)
      }

      // Use existing verify/payment flow to generate ticket(s)
      try {
        await verifyPaymentAndGenerateTicket({
          paymentId: paymentId as string,
          eventId: eventId as string,
          userId: userId as string | undefined,
          quantity: quantity as number | undefined,
          userEmail: userEmail as string,
          userName: userName as string,
          paystackReference: providerReference as string,
        })
        console.log("[v0] verifyPaymentAndGenerateTicket called for zendapt payment", paymentId)
      } catch (err) {
        console.error("[v0] Error running verifyPaymentAndGenerateTicket for zendapt:", err)
      }
    }

    // Handle payment failure events as well
    if (eventType === "transaction.failed" || eventType === "payment.failed") {
      const paymentId = data?.reference || data?.ref || data?.id
      try {
        if (paymentId) {
          await convex.mutation(api.payments.updatePaymentStatus, {
            paymentId: paymentId as any,
            status: "failed",
            providerReference: body.data?.transaction_id,
          })
          console.log("[v0] ZendApt payment failed:", paymentId)
        }
      } catch (err) {
        console.error("[v0] Failed to update payment status (failed) for zendapt webhook:", err)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] ZendApt webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
