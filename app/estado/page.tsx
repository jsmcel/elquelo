import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { EstadoCard } from '@/components/EstadoCard'
import { QrCode, Zap, Smartphone, Users, Clock, Shield } from 'lucide-react'

const estadoPlans = [
  {
    id: '1',
    name: 'Plan Básico',
    description: 'QR dinámico con cambio ilimitado. Perfecto para uso personal.',
    price: 1.90,
    period: 'mes',
    features: [
      'QR dinámico personalizado',
      'Cambios ilimitados',
      'Estadísticas básicas',
      'Soporte por email',
      'Dominio personalizado lql.to'
    ],
    popular: false
  },
  {
    id: '2',
    name: 'Plan Pro',
    description: 'Todo del plan básico + analytics avanzados y personalización.',
    price: 4.90,
    period: 'mes',
    features: [
      'Todo del plan básico',
      'Analytics avanzados',
      'Personalización de QR',
      'Soporte prioritario',
      'API para desarrolladores',
      'Integración con redes sociales'
    ],
    popular: true
  },
  {
    id: '3',
    name: 'Plan Anual',
    description: 'Ahorra 2 meses con el plan anual. Ideal para uso continuo.',
    price: 14.90,
    period: 'año',
    features: [
      'Todo del plan Pro',
      'Ahorro de 2 meses',
      'Funciones premium',
      'Soporte 24/7',
      'Backup automático',
      'Dominio personalizado'
    ],
    popular: false
  }
]

export default function EstadoPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-50 to-red-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Camisetas
              <span className="text-orange-600 block">Estado</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Expresa tu estado actual con QR dinámicos que puedes cambiar cuando quieras. 
              Conecta con otros y comparte lo que sientes en tiempo real.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <QrCode className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">QR Dinámico</h3>
                <p className="text-sm text-gray-600">Cambia cuando quieras</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Zap className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Tiempo Real</h3>
                <p className="text-sm text-gray-600">Actualización instantánea</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Smartphone className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Fácil de Usar</h3>
                <p className="text-sm text-gray-600">App móvil incluida</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Users className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Comunidad</h3>
                <p className="text-sm text-gray-600">Conecta con otros</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Elige tu Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Suscripción mensual o anual para tu camiseta con QR dinámico
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {estadoPlans.map((plan) => (
              <EstadoCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              ¿Cómo funciona?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Proceso simple para crear tu camiseta con QR dinámico
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-orange-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Elige tu Plan
              </h3>
              <p className="text-gray-600">
                Selecciona el plan que mejor se adapte a tus necesidades y presupuesto.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Personaliza tu QR
              </h3>
              <p className="text-gray-600">
                Configura tu QR con el mensaje inicial y personaliza la apariencia.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-orange-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Recibe tu Camiseta
              </h3>
              <p className="text-gray-600">
                Te enviamos tu camiseta con el QR personalizado en 3-7 días laborables.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-orange-600">4</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Cambia tu Estado
              </h3>
              <p className="text-gray-600">
                Usa la app móvil para cambiar tu estado cuando quieras, las veces que quieras.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Características Únicas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tecnología avanzada para la mejor experiencia de usuario
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <Clock className="w-12 h-12 text-orange-600 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Cambio Instantáneo
              </h3>
              <p className="text-gray-600">
                Modifica tu estado y el QR se actualiza automáticamente en segundos.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <Shield className="w-12 h-12 text-orange-600 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Privacidad Total
              </h3>
              <p className="text-gray-600">
                Solo tú puedes cambiar tu QR. Tus datos están completamente protegidos.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <Smartphone className="w-12 h-12 text-orange-600 mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                App Móvil
              </h3>
              <p className="text-gray-600">
                Gestiona tu QR desde cualquier lugar con nuestra app móvil intuitiva.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              ¿Listo para Expresar tu Estado?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Únete a la revolución de las camisetas inteligentes y conecta con otros de forma única
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-orange-600 px-8 py-4 rounded-lg font-semibold hover:bg-orange-50 transition-colors">
                Empezar Ahora - €1.90/mes
              </button>
              <button className="bg-orange-700 text-white px-8 py-4 rounded-lg font-semibold hover:bg-orange-800 transition-colors border border-orange-500">
                Ver Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
