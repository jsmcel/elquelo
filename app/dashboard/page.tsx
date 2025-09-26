import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { DashboardStats } from '@/components/DashboardStats'
import { QRGenerator } from '@/components/QRGenerator'
import { NFTGallery } from '@/components/NFTGallery'
import { OrderHistory } from '@/components/OrderHistory'
import { useUser } from '@/app/providers'

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Cuenta</h1>
          <p className="text-gray-600">Gestiona tus QRs, NFTs y pedidos</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <DashboardStats />
            <QRGenerator />
            <OrderHistory />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <NFTGallery />
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
