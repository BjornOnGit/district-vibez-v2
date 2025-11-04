import { verifyPaymentAndGenerateTicket } from "@/app/actions/verify-payment"

export async function POST(request: Request) {
  try {
    const { reference, paymentId } = await request.json()

    console.log("[v0] Verify route called with:", { reference, paymentId })

    if (!reference || !paymentId) {
      console.log("[v0] Missing reference or paymentId")
      return Response.json({ error: "Missing reference or paymentId" }, { status: 400 })
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await paystackResponse.json()

    console.log("[v0] Paystack response:", { status: paystackData.status, paymentStatus: paystackData.data?.status })

    if (!paystackData.status || paystackData.data.status !== "success") {
      console.log("[v0] Payment verification failed:", paystackData)
      return Response.json({ error: "Payment verification failed", success: false }, { status: 400 })
    }

    const { reference: paystackRef, metadata } = paystackData.data
    const parsedMetadata = typeof metadata === "string" ? JSON.parse(metadata) : metadata
    const { eventId, userId, quantity, userEmail, userName } = parsedMetadata || {}

    const result = await verifyPaymentAndGenerateTicket({
      paymentId,
      eventId,
      userId,
      quantity,
      userEmail,
      userName,
      paystackReference: paystackRef,
    })

    return Response.json(result)
  } catch (error) {
    console.error("[v0] Paystack verification error:", error)
    return Response.json({ error: "Verification failed", success: false }, { status: 500 })
  }
}
