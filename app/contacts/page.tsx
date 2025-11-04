import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function ContactsPage() {
  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="py-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="text-4xl font-bold mb-12 text-center uppercase">Contact Us</h1>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-2">Phone</h3>
                <p className="text-primary">+1 234 567 8900</p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Email</h3>
                <p className="text-primary">info@districtviebz.com</p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Location</h3>
                <p>
                  Main District Club
                  <br />
                  Downtown Area
                  <br />
                  City, State 12345
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-2">Follow Us</h3>
                <div className="flex gap-4">
                  <a href="#" className="text-primary hover:underline">
                    Instagram
                  </a>
                  <a href="#" className="text-primary hover:underline">
                    TikTok
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-muted p-8 rounded-lg">
              <h3 className="font-bold text-lg mb-4">Event Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold">Date</p>
                  <p>December 31, 2025</p>
                </div>
                <div>
                  <p className="font-semibold">Time</p>
                  <p>7:00 PM - Late Night</p>
                </div>
                <div>
                  <p className="font-semibold">Venue</p>
                  <p>Main District Club</p>
                </div>
                <div>
                  <p className="font-semibold">Dress Code</p>
                  <p>Smart Casual / Themed Attire</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
