import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

export default function GalleryPage() {
  const images = Array.from({ length: 20 }, (_, i) => i + 1)

  return (
    <main className="min-h-screen">
      <Navbar />

      <section className="py-24">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-12 text-center uppercase">Gallery</h1>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((num) => (
              <div key={num} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground text-sm">Image {num}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
