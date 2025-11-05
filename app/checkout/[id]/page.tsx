"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const event = useQuery(api.events.getById, { eventId: eventId as any })
  const createPayment = useMutation(api.payments.createPayment)

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    quantity: 1,
    paymentMethod: "paystack" as "paystack" | "zendapt",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  if (event === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-muted-foreground mb-4">Event not found</p>
          <Link href="/events">
            <Button>Back to Events</Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalPrice = event.ticketPrice * formData.quantity

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number.parseInt(value) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!formData.email || !formData.name) {
        throw new Error("Please fill in all required fields")
      }

      if (formData.quantity < 1 || formData.quantity > event.availableTickets) {
        throw new Error(`Please select between 1 and ${event.availableTickets} tickets`)
      }

      const payment = await createPayment({
        eventId: eventId as any,
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        quantity: formData.quantity,
        paymentMethod: formData.paymentMethod,
      })

      // Store payment ID in session storage for payment gateway redirect
      sessionStorage.setItem("paymentId", payment.paymentId)
      sessionStorage.setItem("paymentMethod", formData.paymentMethod)

      // Redirect to payment gateway (will be implemented in Task 5 & 6)
      if (formData.paymentMethod === "paystack") {
        router.push(`/payment/paystack/${payment.paymentId}`)
      } else {
        router.push(`/payment/zendapt/${payment.paymentId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Link href={`/events/${eventId}`} className="flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Event
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h1 className="text-3xl font-bold mb-6">Checkout</h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Your Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+234 (0) 123 456 7890"
                        className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* Ticket Selection */}
                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-4">Tickets</h2>
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Tickets *</label>
                    <select
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {Array.from({ length: Math.min(10, event.availableTickets) }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? "Ticket" : "Tickets"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="border-t pt-6">
                  <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                  <div className="space-y-3">
                    <label className="flex items-center p-4 border border-input rounded-lg cursor-pointer hover:bg-muted">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="paystack"
                        checked={formData.paymentMethod === "paystack"}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-semibold">Paystack</p>
                        <p className="text-sm text-muted-foreground">Pay with card or bank transfer</p>
                      </div>
                    </label>

                    {/* <label className="flex items-center p-4 border border-input rounded-lg cursor-pointer hover:bg-muted">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="zendapt"
                        checked={formData.paymentMethod === "zendapt"}
                        onChange={handleInputChange}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-semibold">ZendApt</p>
                        <p className="text-sm text-muted-foreground">Pay with USDT (crypto)</p>
                      </div>
                    </label> */}
                  </div>
                </div>

                {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Proceed to Payment"}
                </Button>
              </form>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-muted-foreground">{event.name}</p>
                  <p className="font-semibold">{event.venue}</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">
                      ₦{event.ticketPrice.toLocaleString()} × {formData.quantity}
                    </span>
                    <span className="font-semibold">₦{(event.ticketPrice * formData.quantity).toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold">₦{totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-semibold mb-2">Secure Payment</p>
                <p>Your payment information is encrypted and secure.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
