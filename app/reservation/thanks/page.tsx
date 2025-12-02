import Link from "next/link"

export default function ReservationThanks() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-lg text-center p-8">
        <h1 className="text-3xl font-bold mb-4">You're registered!</h1>
        <p className="mb-4">Thanks — we've sent your free ticket to your email. Please check your inbox (and spam folder).</p>
        <p className="mb-6">Bring the QR code in the email to the event.</p>
        <Link className="px-6 py-2 bg-primary text-white rounded" href="/events">
          Browse Events
        </Link>
      </div>
    </main>
  )
}
