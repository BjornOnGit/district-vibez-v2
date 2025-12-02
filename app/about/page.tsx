import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="py-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-4xl font-bold mb-8 uppercase">About District Vibez</h1>

          <div className="space-y-6 text-base leading-relaxed">
            <p>
              District Vibez is a monthly celebration bringing together the community to the heart  of mainland Lagos for an unforgettable night of
              music, entertainment, and celebration.
            </p>

            <p>
              Our event features world-class DJs, interactive entertainment, and an atmosphere designed to create
              lasting memories. Whether you're a first-time attendee or a seasoned regular, there's something special
              waiting for you.
            </p>

            <p>
              From live performances to exclusive DJ sets, to premium lounge experiences, District
              Vibez offers something for everyone. Join us as we celebrate together!
            </p>

            <div className="bg-muted p-8 rounded-lg mt-12">
              <h2 className="text-2xl font-bold mb-4">Event Highlights</h2>
              <ul className="space-y-2">
                <li>✓ Live DJ Performances</li>
                <li>✓ Premium Bar Service</li>
                <li>✓ VIP Lounge Access</li>
                <li>✓ Exclusive Entertainment</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
