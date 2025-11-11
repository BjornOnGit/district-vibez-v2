"use client"

import type React from "react"

import { useConvex } from "convex/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, ShoppingCart, Trash2 } from "lucide-react"

type TicketType = {
  type: string
  price_cents: number
  currency: string
  perks: string[]
}

type Recipient = {
  email: string
  name: string
}

type CartItem = {
  ticketType: string
  quantity: number
  recipients: Recipient[]
}

export default function CheckoutPage({ params }: { params: { eventId: string } }) {
  const convex = useConvex()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [cart, setCart] = useState<CartItem[]>([])
  const [buyerEmail, setBuyerEmail] = useState("")
  const [buyerName, setBuyerName] = useState("")
  const [paymentProvider, setPaymentProvider] = useState<"paystack" | "zendapt">("paystack")

  useEffect(() => {
    const loadEvent = async () => {
      try {
        const eventData = await convex.query("events:getById" as any, { eventId: params.eventId })
        setEvent(eventData)

        // Initialize cart from URL params if ticket type specified
        const ticketType = searchParams.get("ticketType")
        if (ticketType) {
          setCart([{ ticketType, quantity: 1, recipients: [] }])
        }
      } catch (err) {
        setError("Failed to load event")
      } finally {
        setLoading(false)
      }
    }
    loadEvent()
  }, [convex, params.eventId, searchParams])

  const addToCart = (ticketType: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.ticketType === ticketType)
      if (existing) {
        return prev.map((item) =>
          item.ticketType === ticketType
            ? { ...item, quantity: item.quantity + 1, recipients: [...item.recipients, { email: "", name: "" }] }
            : item,
        )
      }
      return [...prev, { ticketType, quantity: 1, recipients: [{ email: "", name: "" }] }]
    })
  }

  const removeFromCart = (ticketType: string) => {
    setCart((prev) => prev.filter((item) => item.ticketType !== ticketType))
  }

  const updateRecipient = (ticketType: string, index: number, field: "email" | "name", value: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.ticketType === ticketType
          ? {
              ...item,
              recipients: item.recipients.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
            }
          : item,
      ),
    )
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!buyerEmail || !buyerName) {
      setError("Please fill in your details")
      return
    }

    // Validate all recipients for multi-ticket orders
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)
    let recipientCount = 0

    for (const item of cart) {
      for (let i = 0; i < item.quantity; i++) {
        if (i > 0 && (!item.recipients[i - 1]?.email || !item.recipients[i - 1]?.name)) {
          setError(`Please fill in details for all recipients`)
          return
        }
        recipientCount++
      }
    }

    try {
      setProcessing(true)

      // Calculate total price
      const totalPrice = cart.reduce((sum, cartItem) => {
        const ticketType = event.ticket_pricing.find((t: TicketType) => t.type === cartItem.ticketType)
        return sum + (ticketType?.price_cents || 0) * cartItem.quantity
      }, 0)

      const requestBody = {
        amount_cents: totalPrice,
        currency: "NGN",
        user_email: buyerEmail,
        user_name: buyerName,
        event_id: params.eventId,
        tickets: cart,
      }

      const endpoint =
        paymentProvider === "paystack" ? `/api/payments/paystack/initialize` : `/api/payments/zendapt/create`

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed")
      }

      if (paymentProvider === "paystack") {
        window.location.href = data.authorizationUrl
      } else {
        window.location.href = data.paymentUrl
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed")
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-background p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Event not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const cartTotal = cart.reduce((sum, cartItem) => {
    const ticketType = event.ticket_pricing.find((t: TicketType) => t.type === cartItem.ticketType)
    return sum + (ticketType?.price_cents || 0) * cartItem.quantity
  }, 0)

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-8">
          <ShoppingCart className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
        </div>

        <div className="grid grid-cols-3 gap-8">
          {/* Available Tickets */}
          <div className="col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Select Tickets</h2>
              <div className="space-y-4">
                {event.ticket_pricing?.map((ticketType: TicketType) => (
                  <div
                    key={ticketType.type}
                    className="border border-input rounded-lg p-4 flex justify-between items-center"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold capitalize text-foreground">{ticketType.type} Ticket</h3>
                      <p className="text-sm text-muted-foreground">
                        ₦{(ticketType.price_cents / 100).toLocaleString()}
                      </p>
                      {ticketType.perks.length > 0 && (
                        <div className="mt-2 text-xs space-y-1">
                          {ticketType.perks.map((perk, idx) => (
                            <p key={idx} className="text-muted-foreground">
                              • {perk}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button type="button" onClick={() => addToCart(ticketType.type)} disabled={processing}>
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </Card>

            {/* Buyer Information */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Your Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email *</label>
                  <Input
                    type="email"
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                  <Input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>
            </Card>

            {/* Recipient Details */}
            {cart.some((item) => item.quantity > 1) && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 text-foreground">Recipient Details</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Add details for other recipients (first ticket is for you)
                </p>
                <div className="space-y-6">
                  {cart.map((cartItem) =>
                    cartItem.quantity > 1 ? (
                      <div key={cartItem.ticketType} className="space-y-3">
                        <h3 className="font-medium text-foreground capitalize">
                          {cartItem.ticketType} Ticket Recipients (quantity: {cartItem.quantity})
                        </h3>
                        {Array.from({ length: cartItem.quantity - 1 }).map((_, index) => (
                          <div key={index} className="grid grid-cols-2 gap-3 p-3 bg-muted rounded-lg">
                            <Input
                              type="text"
                              value={cartItem.recipients[index]?.name || ""}
                              onChange={(e) => updateRecipient(cartItem.ticketType, index, "name", e.target.value)}
                              placeholder="Recipient name"
                            />
                            <Input
                              type="email"
                              value={cartItem.recipients[index]?.email || ""}
                              onChange={(e) => updateRecipient(cartItem.ticketType, index, "email", e.target.value)}
                              placeholder="Recipient email"
                            />
                          </div>
                        ))}
                      </div>
                    ) : null,
                  )}
                </div>
              </Card>
            )}

            {/* Payment Provider */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border border-input rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="radio"
                    name="provider"
                    value="paystack"
                    checked={paymentProvider === "paystack"}
                    onChange={(e) => setPaymentProvider(e.target.value as "paystack" | "zendapt")}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-foreground">Paystack</p>
                    <p className="text-sm text-muted-foreground">Secure card payments</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-input rounded-lg cursor-pointer hover:bg-muted">
                  <input
                    type="radio"
                    name="provider"
                    value="zendapt"
                    checked={paymentProvider === "zendapt"}
                    onChange={(e) => setPaymentProvider(e.target.value as "paystack" | "zendapt")}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-foreground">Zendapt</p>
                    <p className="text-sm text-muted-foreground">Direct payment link</p>
                  </div>
                </label>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="col-span-1">
            <Card className="p-6 sticky top-8 space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items in cart</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => {
                    const ticketType = event.ticket_pricing.find((t: TicketType) => t.type === item.ticketType)
                    return (
                      <div key={item.ticketType} className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="capitalize font-medium text-foreground">{item.ticketType}</p>
                          <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">
                            ₦{(((ticketType?.price_cents || 0) * item.quantity) / 100).toLocaleString()}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.ticketType)}
                            className="text-xs text-destructive hover:underline mt-1"
                          >
                            <Trash2 className="w-3 h-3 inline" /> Remove
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  <div className="border-t border-input pt-4">
                    <div className="flex justify-between mb-4">
                      <span className="text-foreground font-semibold">Total:</span>
                      <span className="text-lg font-bold text-primary">₦{(cartTotal / 100).toLocaleString()}</span>
                    </div>

                    <Button onClick={handleCheckout} disabled={processing || cart.length === 0} className="w-full">
                      {processing ? <Spinner size="sm" /> : null}
                      {processing ? "Processing..." : "Proceed to Payment"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
