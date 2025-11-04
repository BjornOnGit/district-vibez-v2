import { type NextRequest, NextResponse } from "next/server"

const ZENDAPT_API_URL = "https://api.zendapt.com/v1"
const ZENDAPT_API_KEY = process.env.ZENDAPT_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { payment, event } = await request.json()

    if (!payment || !event) {
      return NextResponse.json({ error: "Missing payment or event data" }, { status: 400 })
    }

    if (!ZENDAPT_API_KEY) {
      return NextResponse.json({ error: "ZendApt API key not configured" }, { status: 500 })
    }

    // Convert NGN to USDT (approximate rate, should be fetched from exchange API)
    const usdtAmount = payment.amount / 410 // Approximate NGN to USDT rate

    // Initialize ZendApt transaction
    const response = await fetch(`${ZENDAPT_API_URL}/transactions/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ZENDAPT_API_KEY}`,
      },
      body: JSON.stringify({
        amount: usdtAmount,
        currency: "USDT",
        fiat_currency: "NGN",
        fiat_amount: payment.amount,
        reference: payment._id,
        customer: {
          email: payment.userEmail,
          name: payment.userName,
        },
        metadata: {
          eventId: event._id,
          eventName: event.name,
          ticketQuantity: payment.quantity,
        },
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/zendapt/callback`,
        webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/zendapt`,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("[v0] ZendApt API error:", error)
      return NextResponse.json({ error: "Failed to initialize ZendApt payment" }, { status: 500 })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      transactionId: data.transaction_id,
      paymentUrl: data.payment_url,
    })
  } catch (error) {
    console.error("[v0] ZendApt initialization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
