import Link from 'next/link'
import { QrCode, Users, Store, MessageSquare, ArrowRight } from 'lucide-react'

const businessLines = [
  {
    id: 'drops',
    title: 'Colecciones DROP',
    description: 'Camisetas con QR estáticos que llevan a mensajes de estado o colecciones de dibujos. Cada camiseta incluye un NFT único.',
    icon: QrCode,
    features: ['QR estáticos', 'NFT incluido', 'Colecciones limitadas', 'Mensajes de estado'],
    href: '/drops',
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'eventos',
    title: 'Eventos',
    description: 'Team building, despedidas y eventos corporativos. Camisetas personalizadas para crear experiencias únicas.',
    icon: Users,
    features: ['Personalización total', 'Eventos corporativos', 'Team building', 'Despedidas'],
    href: '/eventos',
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'merchandising',
    title: 'Merchandising',
    description: 'Menú interactivo para hombres. Escanea y obtén ofertas, sorteos y descuentos exclusivos.',
    icon: Store,
    features: ['Menú interactivo', 'Ofertas exclusivas', 'Sorteos', 'Descuentos'],
    href: '/merchandising',
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'estado',
    title: 'Camisetas Estado',
    description: 'QR dinámico que puedes cambiar cuando quieras. Expresa tu estado actual y conéctate con otros.',
    icon: MessageSquare,
    features: ['QR dinámico', 'Cambio instantáneo', 'Suscripción mensual', 'Estados personalizados'],
    href: '/estado',
    color: 'from-orange-500 to-red-500'
  }
]

export function BusinessLines() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Nuestras Líneas de Negocio
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre las diferentes formas en que puedes usar nuestras camisetas inteligentes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {businessLines.map((line) => (
            <div key={line.id} className="group">
              <Link href={line.href} className="block">
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-8 h-full border border-gray-100 group-hover:border-primary-200">
                  <div className={`w-16 h-16 bg-gradient-to-r ${line.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <line.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-600 transition-colors">
                    {line.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    {line.description}
                  </p>
                  
                  <ul className="space-y-2 mb-6">
                    {line.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-3"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  
                  <div className="flex items-center text-primary-600 font-semibold group-hover:text-primary-700 transition-colors">
                    <span>Explorar</span>
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
