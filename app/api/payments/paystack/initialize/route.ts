export async function POST(request: Request) {
  try {
    const { paymentId, payment, event } = await request.json()

    if (!paymentId || !payment || !event) {
      return Response.json({ error: "Missing required data" }, { status: 400 })
    }

    if (payment.status !== "pending") {
      return Response.json({ error: "Payment already processed" }, { status: 400 })
    }

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: payment.metadata.userEmail,
        amount: payment.amount * 100, // Paystack expects amount in kobo (cents)
        metadata: {
          paymentId,
          eventId: payment.eventId,
          quantity: payment.metadata.quantity,
          eventName: event.name,
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
