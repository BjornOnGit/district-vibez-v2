export async function POST(request: Request) {
  try {
  const { paymentId, payment, event, amount } = await request.json()

    if (!paymentId || !payment || !event) {
      return Response.json({ error: "Missing required data" }, { status: 400 })
    }

    if (payment.status !== "pending") {
      return Response.json({ error: "Payment already processed" }, { status: 400 })
    }

    // Ensure we include identifying metadata so the verify webhook can rely on it
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: payment.metadata.userEmail,
        // Allow overriding the amount (in Naira) from the client. If not provided, use stored payment.amount.
        amount: (typeof amount === "number" ? amount : payment.amount) * 100, // Paystack expects amount in kobo (cents)
        // Include useful metadata so verification callback doesn't need an extra DB lookup
        metadata: {
          paymentId,
          eventId: payment.eventId,
          quantity: payment.metadata?.quantity,
          eventName: event.name,
          // Include user and ticket info from the payment record
          userId: payment.userId,
          userEmail: payment.metadata?.userEmail,
          userName: payment.metadata?.userName,
          ticketType: payment.metadata?.ticketType,
          unitPrice: payment.metadata?.unitPrice ?? payment.metadata?.ticketPrice,
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/payment/paystack/callback?paymentId=${paymentId}`,
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      return Response.json({ error: "Failed to initialize Paystack payment" }, { status: 500 })
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
