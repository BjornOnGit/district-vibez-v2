"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PaystackPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const paymentId = params.paymentId as string

  const payment = useQuery(api.payments.getPayment, { paymentId: paymentId as any })
  const event = useQuery(api.events.getById, { eventId: payment?.eventId as any })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!payment || !event) return

    const initializePayment = async () => {
      try {
        const response = await fetch("/api/payments/paystack/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentId,
            payment,
            event,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to initialize payment")
        }

        window.location.href = data.authorizationUrl
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        setIsLoading(false)
      }
    }

    initializePayment()
  }, [payment, event, paymentId])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">Redirecting to Paystack</p>
          <p className="text-muted-foreground">Please wait while we prepare your payment...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="p-8 text-center max-w-md">
        <p className="text-lg font-semibold mb-4 text-red-600">Payment Error</p>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </Card>
    </div>
  )
}
