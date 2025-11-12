export async function POST(request: Request) {
  try {
    const body = await request.json().catch((e) => {
      console.error('[v0] Paystack initialize: failed to parse JSON body', e)
      return null
    })

    // Provide clearer validation errors for debugging callers
    if (!body) {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { paymentId, payment, event, amount } = body

    const missing: string[] = []
    if (!paymentId) missing.push('paymentId')
    if (!payment) missing.push('payment')

    if (missing.length > 0) {
      console.error('[v0] Paystack initialize called with missing fields:', missing, 'bodyKeys=', Object.keys(body || {}))
      return Response.json({ error: `Missing required data: ${missing.join(', ')}`, receivedKeys: Object.keys(body || {}) }, { status: 400 })
    }

      // If the caller passed a lightweight payment object (e.g. the value returned from createPayment),
      // it may not include `status` or `metadata`. Fetch the full payment record server-side when needed.
      let fullPayment = payment
      try {
        if (!payment.status || !payment.metadata) {
          const { ConvexHttpClient } = await import("convex/browser")
          const apiModule = await import("@/convex/_generated/api")
          const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
          // api.payments.getPayment expects { paymentId }
          const fetched = await convex.query(apiModule.api.payments.getPayment, { paymentId })
          if (fetched) fullPayment = fetched
        }
      } catch (err) {
        console.error('[v0] Paystack initialize: failed to fetch full payment record, proceeding with provided payment object', err)
      }

      // If status is missing, assume pending (caller likely passed a lightweight object). Log this so we can audit.
      if (!fullPayment.status) {
        console.warn('[v0] Paystack initialize: payment.status missing, assuming pending', { paymentId, fullPaymentKeys: Object.keys(fullPayment || {}) })
      } else if (fullPayment.status !== "pending") {
        console.error('[v0] Paystack initialize: payment status is not pending', { paymentId, status: fullPayment.status, fullPaymentKeys: Object.keys(fullPayment || {}) })
        return Response.json({ error: "Payment already processed", status: fullPayment.status }, { status: 400 })
      }

    // Determine numeric amount (in Naira). Prefer explicit `amount` from caller, else fall back to stored values.
    const amountNumber = typeof amount === "number" ? amount : Number(fullPayment.amount ?? (payment as any).totalAmount ?? (payment as any).amount)
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      console.error('[v0] Paystack initialize: invalid amount', { paymentId, amount, fullPaymentAmount: fullPayment.amount, paymentTotalAmount: (payment as any).totalAmount })
      return Response.json({ error: 'Invalid or missing amount' }, { status: 400 })
    }

    // Ensure we include identifying metadata so the verify webhook can rely on it
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: fullPayment.metadata?.userEmail || payment.metadata?.userEmail,
        // Paystack expects amount in kobo (cents)
        amount: Math.round(amountNumber * 100),
        // Include useful metadata so verification callback doesn't need an extra DB lookup
        metadata: {
          paymentId,
          eventId: fullPayment.eventId || payment.eventId,
          quantity: fullPayment.metadata?.quantity ?? payment.metadata?.quantity,
          // Prefer the explicitly provided event name, else fall back to payment metadata
          eventName: (event && event.name) || fullPayment.metadata?.eventName || payment.metadata?.eventName || "",
          // Include user and ticket info from the payment record
          userId: fullPayment.userId || payment.userId,
          userEmail: fullPayment.metadata?.userEmail || payment.metadata?.userEmail,
          userName: fullPayment.metadata?.userName || payment.metadata?.userName,
          ticketType: fullPayment.metadata?.ticketType || payment.metadata?.ticketType,
          unitPrice: fullPayment.metadata?.unitPrice ?? payment.metadata?.unitPrice ?? fullPayment.metadata?.ticketPrice ?? payment.metadata?.ticketPrice,
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/paystack/callback?paymentId=${paymentId}`,
      }),
    })

    const paystackText = await paystackResponse.text().catch((e) => {
      console.error('[v0] Paystack initialize: failed to read response text', e)
      return null
    })

    let paystackData: any = null
    try {
      paystackData = paystackText ? JSON.parse(paystackText) : null
    } catch (e) {
      console.error('[v0] Paystack initialize: failed to parse response JSON', { text: paystackText, err: e })
    }

    if (!paystackData || !paystackData.status) {
      console.error('[v0] Paystack initialize failed', { status: paystackResponse.status, body: paystackData ?? paystackText })
      return Response.json({ error: "Failed to initialize Paystack payment", details: paystackData ?? paystackText }, { status: 500 })
    }

    return Response.json({
      authorizationUrl: paystackData.data.authorization_url,
      accessCode: paystackData.data.access_code,
      reference: paystackData.data.reference,
    })
  } catch (error) {
    console.error("[v0] Paystack initialization error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
