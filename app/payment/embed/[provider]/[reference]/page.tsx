"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function EmbedPayment() {
  const params = useParams()
  const router = useRouter()
  const { provider, reference } = params as { provider: string; reference: string }

  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [embedAllowed, setEmbedAllowed] = useState<boolean>(true)

  useEffect(() => {
    // Prefer sessionStorage (set immediately after init)
    const key = `embed_payment_url_${provider}_${reference}`
    const fromSession = typeof window !== "undefined" ? sessionStorage.getItem(key) : null
    if (fromSession) {
      setPaymentUrl(fromSession)
      return
    }

    // Optionally: fetch from server by reference if you stored it server-side
    // For now, we rely on sessionStorage being set by the initializer
  }, [provider, reference])

  // If paymentUrl is present, attempt to show iframe; always show fallback button
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Complete your payment</h1>

        {!paymentUrl ? (
          <div className="p-6 border rounded">
            <p className="mb-4">Payment link not available. Please try opening the payment in a new tab.</p>
            <div className="flex gap-2">
              <Button onClick={() => router.back()}>Back</Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="w-full h-[700px] border">
              <iframe
                src={paymentUrl}
                title="Payment"
                className="w-full h-full"
                sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <a href={paymentUrl} target="_blank" rel="noreferrer noopener">
                <Button>Open payment in new tab</Button>
              </a>

              {/* Direct way for users to return to the events listing when they're done */}
              <Button onClick={() => router.push('/events')}>Return to Events</Button>

              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
