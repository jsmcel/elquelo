import { QrCode, Shield, Truck, Smartphone, Zap, Users } from 'lucide-react'

const features = [
  {
    icon: QrCode,
    title: 'QR Dinámicos',
    description: 'Cambia el destino de tu QR cuando quieras. Perfecto para estados, ofertas o mensajes temporales.'
  },
  {
    icon: Shield,
    title: 'Seguro y Privado',
    description: 'Tus datos están protegidos. Solo tú puedes cambiar el destino de tu QR personal.'
  },
  {
    icon: Truck,
    title: 'Envío Rápido',
    description: 'Impresión bajo demanda. Recibe tu camiseta en 3-7 días laborables.'
  },
  {
    icon: Smartphone,
    title: 'Fácil de Usar',
    description: 'Escanea con cualquier smartphone. No necesitas apps especiales.'
  },
  {
    icon: Zap,
    title: 'NFTs Incluidos',
    description: 'Cada camiseta DROP incluye un NFT único en la blockchain de Base.'
  },
  {
    icon: Users,
    title: 'Comunidad',
    description: 'Conecta con otros usuarios y descubre nuevas experiencias.'
  }
]

export function Features() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Por qué elegir ELQUELO?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tecnología avanzada, diseño único y experiencias que conectan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
