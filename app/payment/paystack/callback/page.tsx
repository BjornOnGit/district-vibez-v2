"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PaystackCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams.get("reference")
  const paymentId = searchParams.get("paymentId")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!reference) {
      setStatus("error")
      setMessage("No payment reference found")
      return
    }

    if (!paymentId) {
      setStatus("error")
      setMessage("Payment ID not found")
      return
    }

    const verifyPayment = async () => {
      try {
        const response = await fetch("/api/payments/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference, paymentId }),
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setStatus("success")
          setMessage("Payment verified successfully!")
          sessionStorage.removeItem("paymentId")
          sessionStorage.removeItem("paymentMethod")
          setTimeout(() => router.push("/events"), 2000)
        } else {
          setStatus("error")
          setMessage(data.error || "Payment verification failed")
        }
      } catch (error) {
        setStatus("error")
        setMessage(error instanceof Error ? error.message : "An error occurred")
      }
    }

    verifyPayment()
  }, [reference, paymentId, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="p-8 text-center max-w-md w-full">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">Verifying Payment</p>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-4xl mb-4">✓</div>
            <p className="text-lg font-semibold mb-2 text-green-600">Payment Successful!</p>
            <p className="text-muted-foreground mb-6">{message}</p>
            <p className="text-sm text-muted-foreground">Redirecting to events...</p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-4xl mb-4">✕</div>
            <p className="text-lg font-semibold mb-2 text-red-600">Payment Failed</p>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button onClick={() => router.push("/events")}>Back to Events</Button>
          </>
        )}
      </Card>
    </div>
  )
}
