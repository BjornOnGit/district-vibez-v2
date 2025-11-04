export function Gallery() {
  const images = Array.from({ length: 10 }, (_, i) => i + 1)

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 uppercase">Gallery</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {images.map((num) => (
            <div key={num} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground text-sm">Image {num}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
