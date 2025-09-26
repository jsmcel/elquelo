import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { MerchandisingCard } from '@/components/MerchandisingCard'
import { Store, Gift, QrCode, Users, Percent, Clock } from 'lucide-react'

const merchandisingItems = [
  {
    id: '1',
    name: 'Menú Interactivo "El Chef"',
    description: 'Camiseta con QR que lleva a un menú digital interactivo. Perfecto para restaurantes y bares.',
    image: '/images/merchandising/chef.jpg',
    price: 24.99,
    category: 'restaurante',
    features: ['QR interactivo', 'Menú digital', 'Actualización en tiempo real', 'Analytics de escaneos']
  },
  {
    id: '2',
    name: 'Ofertas "Escanéame"',
    description: 'Camiseta con QR que ofrece descuentos y ofertas especiales. Ideal para promociones.',
    image: '/images/merchandising/ofertas.jpg',
    price: 19.99,
    category: 'promocion',
    features: ['QR de ofertas', 'Descuentos automáticos', 'Sorteos integrados', 'Tracking de conversiones']
  },
  {
    id: '3',
    name: 'Menú "Cócteles"',
    description: 'Camiseta especializada para bares con carta de cócteles interactiva y QR único.',
    image: '/images/merchandising/cocteles.jpg',
    price: 22.99,
    category: 'bar',
    features: ['Carta de cócteles', 'Ingredientes detallados', 'Preparación paso a paso', 'Reservas online']
  }
]

export default function MerchandisingPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 to-emerald-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Merchandising
              <span className="text-green-600 block">Interactivo</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Camisetas que venden por ti. QR interactivos que llevan a menús, ofertas, 
              sorteos y promociones. Convierte cada camiseta en una herramienta de marketing.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Store className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Menús Digitales</h3>
                <p className="text-sm text-gray-600">QR a menús interactivos</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Gift className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Ofertas Especiales</h3>
                <p className="text-sm text-gray-600">Descuentos automáticos</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <QrCode className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Sorteos</h3>
                <p className="text-sm text-gray-600">Participación automática</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
                <p className="text-sm text-gray-600">Métricas detalladas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Merchandising Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Soluciones de Merchandising
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Desde menús interactivos hasta ofertas especiales, tenemos la solución perfecta para tu negocio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {merchandisingItems.map((item) => (
              <MerchandisingCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir nuestro Merchandising?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ventajas competitivas que harán crecer tu negocio
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Percent className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Aumenta las Ventas
              </h3>
              <p className="text-gray-600">
                Los QR interactivos pueden aumentar las ventas hasta un 30% gracias a la facilidad de acceso.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Actualización Instantánea
              </h3>
              <p className="text-gray-600">
                Cambia ofertas, precios y menús en tiempo real sin imprimir nada nuevo.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Mejora la Experiencia
              </h3>
              <p className="text-gray-600">
                Los clientes pueden ver menús detallados, ingredientes y hacer pedidos directamente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              ¿Listo para Revolucionar tu Negocio?
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Contacta con nosotros y descubre cómo el merchandising interactivo puede transformar tu negocio
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="mailto:merchandising@elquelo.com"
                className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                Solicitar Información
              </a>
              <a 
                href="/contacto"
                className="bg-green-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-800 transition-colors border border-green-500"
              >
                Ver Casos de Éxito
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
