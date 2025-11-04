"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function ZendAptPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const paymentId = params.paymentId as string

  const payment = useQuery(api.payments.getPayment, { paymentId: paymentId as any })
  const event = useQuery(api.events.getById, { eventId: payment?.eventId as any })

  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!payment || !event) return

    const initializePayment = async () => {
      setIsInitializing(true)
      try {
        const response = await fetch("/api/payments/zendapt/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment: {
              _id: payment._id,
              amount: payment.amount,
              userEmail: payment.userEmail,
              userName: payment.userName,
              quantity: payment.quantity,
            },
            event: {
              _id: event._id,
              name: event.name,
            },
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to initialize payment")
        }

        const data = await response.json()

        if (data.paymentUrl) {
          // Redirect to ZendApt payment page
          window.location.href = data.paymentUrl
        } else {
          throw new Error("No payment URL received")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
        setIsInitializing(false)
      }
    }

    initializePayment()
  }, [payment, event])

  if (isInitializing || !payment || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-lg font-semibold mb-2">Initializing ZendApt Payment</p>
          <p className="text-muted-foreground">Redirecting you to complete your payment...</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Payment Error</h1>
        <p className="text-muted-foreground mb-6">{error || "An unexpected error occurred"}</p>
        <Button onClick={() => router.back()} className="w-full">
          Go Back
        </Button>
      </Card>
    </div>
  )
}
