import Link from 'next/link'
import { ArrowRight, QrCode } from 'lucide-react'

export function CTA() {
  return (
    <section className="py-20 bg-primary-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <QrCode className="w-10 h-10 text-white" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            ¿Listo para empezar?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Crea tu primera camiseta con QR dinámico o explora nuestras colecciones DROP
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/estado" 
              className="bg-white text-primary-600 px-8 py-4 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center space-x-2"
            >
              <span>Crear mi Estado</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/drops" 
              className="bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-primary-800 transition-colors border border-primary-500"
            >
              Ver Colecciones
            </Link>
          </div>
          
          <p className="text-primary-200 text-sm mt-6">
            Sin compromiso • Cancela cuando quieras • Soporte 24/7
          </p>
        </div>
      </div>
    </section>
  )
}
