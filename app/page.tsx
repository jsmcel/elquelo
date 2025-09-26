import { Hero } from '@/components/Hero'
import { BusinessLines } from '@/components/BusinessLines'
import { Features } from '@/components/Features'
import { CTA } from '@/components/CTA'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Hero />
      <BusinessLines />
      <Features />
      <CTA />
      <Footer />
    </main>
  )
}
