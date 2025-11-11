import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { SkeletonCard } from "@/components/skeleton-card"

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 bg-muted rounded h-10 w-1/3 animate-pulse" />
          <p className="text-muted-foreground bg-muted rounded h-6 w-1/4 animate-pulse mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
