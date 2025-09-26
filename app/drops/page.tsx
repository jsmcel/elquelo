import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { DropCard } from '@/components/DropCard'
import { QrCode, Zap, Users, Gift } from 'lucide-react'

const drops = [
  {
    id: '1',
    name: 'Colección "Estado de Ánimo"',
    description: 'Expresa tu estado actual con estos diseños únicos. Cada camiseta incluye un NFT exclusivo.',
    image: '/images/drops/estado-animo.jpg',
    price: 29.99,
    nftIncluded: true,
    totalSupply: 100,
    minted: 23,
    features: ['QR estático', 'NFT único', 'Diseño exclusivo', 'Edición limitada']
  },
  {
    id: '2',
    name: 'Colección "Arte Digital"',
    description: 'Fusiona arte tradicional con tecnología blockchain. Cada pieza es una obra de arte digital.',
    image: '/images/drops/arte-digital.jpg',
    price: 39.99,
    nftIncluded: true,
    totalSupply: 50,
    minted: 8,
    features: ['Arte generativo', 'NFT animado', 'Colección premium', 'Solo 50 unidades']
  },
  {
    id: '3',
    name: 'Colección "Memes"',
    description: 'Los memes más virales en camisetas. Perfecto para conectar con la cultura digital.',
    image: '/images/drops/memes.jpg',
    price: 24.99,
    nftIncluded: true,
    totalSupply: 200,
    minted: 45,
    features: ['Memes virales', 'NFT coleccionable', 'Cultura digital', 'Edición especial']
  }
]

export default function DropsPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-50 to-pink-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Colecciones
              <span className="text-purple-600 block">DROP</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Camisetas únicas con QR estáticos y NFTs exclusivos. 
              Cada colección es limitada y cada camiseta es una pieza de arte digital.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <QrCode className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">QR Estáticos</h3>
                <p className="text-sm text-gray-600">Enlaces fijos a contenido especial</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Zap className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">NFTs Únicos</h3>
                <p className="text-sm text-gray-600">Cada camiseta incluye un NFT</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Edición Limitada</h3>
                <p className="text-sm text-gray-600">Cantidades exclusivas</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Gift className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Contenido Especial</h3>
                <p className="text-sm text-gray-600">Acceso a contenido exclusivo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Drops Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Colecciones Disponibles
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre nuestras colecciones DROP y consigue tu camiseta con NFT exclusivo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {drops.map((drop) => (
              <DropCard key={drop.id} drop={drop} />
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
              Proceso simple para obtener tu camiseta con NFT
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Elige tu Colección
              </h3>
              <p className="text-gray-600">
                Selecciona la colección DROP que más te guste. Cada una tiene un diseño único.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Realiza el Pedido
              </h3>
              <p className="text-gray-600">
                Completa tu compra y recibirás tu camiseta en 3-7 días laborables.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Recibe tu NFT
              </h3>
              <p className="text-gray-600">
                Una vez confirmado el pedido, recibirás tu NFT único en tu wallet.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
