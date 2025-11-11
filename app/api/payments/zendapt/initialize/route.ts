interface ZendaptPayloadBody {
  amount_cents: number
  currency: string
  user_email: string
  user_name: string
  event_id: string
  tickets: Array<{
    type: string
    quantity: number
    recipient_email?: string
  }>
}

export async function POST(request: Request) {
  try {
    const { amount_cents, currency, user_email, user_name, event_id, tickets, paymentId } =
      (await request.json()) as ZendaptPayloadBody & { paymentId?: string }

    if (!amount_cents || !currency || !user_email || !user_name || !event_id) {
      return Response.json({ error: "Missing required fields" }, { status: 400 })
    }

    const zendaptResponse = await fetch("https://api.centiiv.com/api/v1/direct-pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ZENDAPT_API_KEY}`,
      },
      body: JSON.stringify({
        amount: amount_cents / 100, // Convert from cents to naira
        currency: currency,
        customer_email: user_email,
        customer_name: user_name,
        reference: `EVT-${event_id}-${Date.now()}`,
        description: `Tickets for event ${event_id}`,
        metadata: {
          event_id,
          tickets,
          quantity: tickets.reduce((sum, t) => sum + t.quantity, 0),
          // Include internal payment id when available so webhook can map back to Convex payment
          paymentId,
        },
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/zendapt/callback?eventId=${event_id}`,
      }),
    })

  const zendaptData = await zendaptResponse.json()

  // Persist provider reference to our payment record when paymentId was provided
  // Import Convex client lazily (server-side) to avoid including it in client bundles
  // We'll update the payment record's providerReference so webhooks and UI can map it.
  let convex: any = null
  let api: any = null

    // Zendapt/Centiiv responses may use different field names. Accept common variants.
    const success = zendaptData?.success
    const data = zendaptData?.data || {}
    const paymentUrl = data.payment_url || data.paymentUrl || data.link
    const reference = data.reference || data.ref || data.id

    if (!success || !paymentUrl) {
      console.error("[v0] Zendapt error:", zendaptData)
      return Response.json({ error: "Failed to create Zendapt payment link" }, { status: 500 })
    }

    console.log("[v0] Zendapt created link:", { reference, paymentUrl })
    // If caller provided an internal paymentId, patch the Convex payment record with the provider reference
    if (paymentId) {
      try {
        const { ConvexHttpClient } = await import("convex/browser")
        const apiModule = await import("@/convex/_generated/api")
        convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
        api = apiModule.api
        await convex.mutation(api.payments.updatePaymentStatus, {
          paymentId,
          status: "pending",
          providerReference: reference || "",
        })
        console.log("[v0] Patched payment with provider reference:", { paymentId, reference })
      } catch (err) {
        console.error("[v0] Failed to patch payment with provider reference:", err)
      }
    }

    return Response.json({
      paymentUrl,
      reference,
      status: "pending",
    })
  } catch (error) {
    console.error("[v0] Zendapt creation error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
