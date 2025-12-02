"use client"

import type React from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ReservationPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [isFull, setIsFull] = useState(false)

  useEffect(() => {
    // Check reservation count on mount and redirect if full
    const check = async () => {
      try {
        const res = await fetch('/api/reservations/count')
        const data = await res.json()
        if (data?.count >= 50) {
          setIsFull(true)
          router.push('/events')
        }
      } catch (err) {
        console.error('[v0] reservation: failed to fetch count', err)
      }
    }
    check()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isFull) return router.push('/events')
    setSubmitting(true)
    try {
      const res = await fetch('/api/reservations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.status === 409 || data?.full) {
        // Full, redirect to events
        return router.push('/events')
      }
      if (res.ok) {
        // Success - go to confirmation
        return router.push('/reservation/thanks')
      }
      console.error('[v0] reservation create error', data)
      alert(data?.error || 'Failed to create reservation')
    } catch (err) {
      console.error('[v0] reservation submit failed', err)
      alert('Failed to submit reservation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="py-24">
        <div className="container mx-auto px-4 max-w-md">
          <h1 className="text-4xl font-bold mb-12 text-center uppercase">Register To Get Your Free Ticket</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-background"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg bg-background"
              />
            </div>

            <Button type="submit" className="w-full">
              Complete Registration
            </Button>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  )
}
