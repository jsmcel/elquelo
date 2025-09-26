import Link from 'next/link'
import { ArrowRight, QrCode, Zap, Users, Gift } from 'lucide-react'

export function Hero() {
  return (
    <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Camisetas que
            <span className="text-primary-600 block">hablan por ti</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Descubre el futuro de la moda con camisetas inteligentes. 
            QR dinámicos, NFTs únicos y experiencias que conectan.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link 
              href="/drops" 
              className="bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Explorar Drops</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/estado" 
              className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition-colors"
            >
              Crear mi Estado
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <QrCode className="w-8 h-8 text-primary-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">QR Dinámicos</h3>
              <p className="text-sm text-gray-600">Cambia tu mensaje cuando quieras</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Zap className="w-8 h-8 text-primary-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">NFTs Únicos</h3>
              <p className="text-sm text-gray-600">Cada camiseta es única</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Users className="w-8 h-8 text-primary-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Eventos</h3>
              <p className="text-sm text-gray-600">Team building y despedidas</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Gift className="w-8 h-8 text-primary-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Ofertas</h3>
              <p className="text-sm text-gray-600">Escanea y obtén descuentos</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
