import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import Link from 'next/link'
import {
  Sparkles,
  QrCode,
  Shirt,
  Smartphone,
  Palette,
  Check,
  Truck,
  ShieldCheck,
  ArrowRight,
  Wand2,
} from 'lucide-react'

const steps = [
  {
    title: 'Anade al equipo',
    description: 'Nombres, tallas y QR inicial para cada integrante en menos de dos minutos.',
    icon: Shirt,
  },
  {
    title: 'Disena cada camiseta',
    description: 'Sube un PNG unico por persona y automatizamos la produccion.',
    icon: Palette,
  },
  {
    title: 'Cambia el mensaje al vuelo',
    description: 'Desde el panel, edita el QR en tiempo real incluso durante la despedida.',
    icon: Smartphone,
  },
]

const kitIncludes = [
  'Camiseta premium impresa a todo color para cada integrante',
  'QR dinamico unico con landing editable',
  'Panel de control con indicadores en vivo',
  'Plantillas creativas y sugerencias de retos',
  'Diseno express incluido o subida de tus propios PNG',
  'Entrega en 5-7 dias laborables a toda Espana',
]

const faqs = [
  {
    question: 'Cuantas camisetas incluye el kit?',
    answer:
      'El pedido minimo es de 5 camisetas, pero puedes anadir tantas personas como necesites. El precio se ajusta automaticamente al numero de integrantes.',
  },
  {
    question: 'Puedo subir mi propio diseno?',
    answer:
      'Si. En el configurador adjuntas un PNG por integrante o eliges nuestras plantillas. Tambien puedes editar los disenos despues desde el panel.',
  },
  {
    question: 'Cuanto tarda la entrega?',
    answer:
      'Producimos bajo demanda y enviamos en 5-7 dias laborables dentro de Espana. Recibiras seguimiento del envio y notificaciones en cada hito.',
  },
  {
    question: 'Que pasa si necesito cambiar el mensaje del QR?',
    answer:
      'El panel permite editar destino, texto y creatividad en cualquier momento. El QR no cambia: basta escanear de nuevo y se muestra el nuevo contenido.',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="absolute inset-0">
          {/* Imagen de fondo */}
          <div 
            className="h-full w-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/hero-bg.jpg)', // Cambia por tu imagen
            }}
          />
          {/* Overlay para mejorar legibilidad */}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25)_0,_transparent_55%)]" />
        </div>
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-24 sm:py-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-200">
            <Sparkles className="h-4 w-4" />
            Pack premium para despedidas
          </span>
          <h1 className="mt-8 text-center text-4xl font-bold leading-tight sm:text-5xl md:text-6xl">
            Camisetas inteligentes
            <span className="block text-primary-300">que hacen la despedida inolvidable</span>
          </h1>
          <p className="mt-6 max-w-3xl text-center text-lg text-gray-200">
            Cada integrante recibe una camiseta personalizada con un QR dinamico. Cambia el mensaje en tiempo real, lanza retos desde el movil y sorprende con recuerdos para siempre.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/configurador"
              className="inline-flex items-center gap-3 rounded-full bg-primary-500 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/40 transition hover:bg-primary-400"
            >
              Configurar mi kit
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#precio"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white transition hover:border-white/40"
            >
              Ver precio y tiempos
            </a>
          </div>
          <div className="mt-16 grid w-full gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur md:grid-cols-3">
            {[
              { label: '+120 despedidas felices', description: 'Cada camiseta con QR unico y editable' },
              { label: 'Edicion en 2 clics', description: 'Panel responsive para cambiar mensajes al vuelo' },
              { label: 'Soporte creativo', description: 'Te ayudamos a crear dinamicas y pruebas para el grupo' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/5 p-5 text-center shadow-inner shadow-black/10">
                <p className="text-lg font-semibold text-primary-200">{item.label}</p>
                <p className="mt-2 text-sm text-gray-200">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-primary-700">
            <Wand2 className="h-4 w-4" />
            Como funciona
          </span>
          <h2 className="mt-6 text-3xl font-bold sm:text-4xl">
            Configura el kit en tres pasos sencillos
          </h2>
          <p className="mt-3 text-gray-600">
            Recogemos los datos de la despedida, generamos los QR y preparamos todo para que solo tengas que disfrutar.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group relative rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
                <step.icon className="h-6 w-6" />
              </div>
              <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-primary-500">
                Paso {index + 1}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-3 text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="kit" className="bg-white py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-primary-700">
              <QrCode className="h-4 w-4" />
              Que incluye
            </span>
            <h2 className="text-3xl font-bold sm:text-4xl">
              Todo lo que necesitas para una despedida con wow factor
            </h2>
            <p className="text-gray-600">
              El pack esta pensado para camisetas espectaculares, contenido editable y un panel centralizado donde seguir la accion en vivo.
            </p>
            <ul className="space-y-3">
              {kitIncludes.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                  <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-500" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700">
                <Truck className="h-4 w-4" />
                Entrega 5-7 dias
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-700">
                <ShieldCheck className="h-4 w-4" />
                Garantia de reimpresion
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-4xl border border-gray-100 bg-gray-900 p-10 text-white shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.4)_0,_transparent_70%)]" />
            <div className="relative space-y-6">
              <h3 className="text-2xl font-semibold">El panel que lo controla todo</h3>
              <p className="text-sm text-gray-200">
                Gestiona los QR desde el movil: cambia destinos, sube nuevos PNG, activa retos y recibe estadisticas en tiempo real.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {['Edicion instantanea', 'Modo sorpresa', 'Notificaciones', 'Plantillas integradas'].map((tag) => (
                  <div key={tag} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-100">
                    {tag}
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-200 transition hover:text-primary-100"
              >
                Ver demo del panel
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="precio" className="mx-auto max-w-6xl px-4 py-20 sm:py-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-primary-700">
              <Shirt className="h-4 w-4" />
              Precio transparente
            </span>
            <h2 className="text-3xl font-bold sm:text-4xl">
              29 EUR por camiseta  QR + panel incluidos
            </h2>
            <p className="text-gray-600">
              Solo pagas por las camisetas que necesitas. Incluimos personalizacion, QR dinamico, panel y soporte creativo. Sin costes ocultos.
            </p>
            <div className="rounded-3xl border border-primary-100 bg-primary-50 p-6 text-sm text-primary-700">
              <p className="font-semibold">Envio express o internacional?</p>
              <p className="mt-1">
                Escribenos y ajustamos produccion y logistica a tu timing. Gestionamos envios urgentes en 48h bajo peticion.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-4xl border border-gray-100 bg-white p-10 shadow-xl">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-blue-500 to-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900">Pack Despedida</h3>
            <p className="mt-2 text-sm text-gray-600">Camiseta + QR + panel + soporte creativo</p>
            <div className="mt-6 flex items-baseline gap-3">
              <p className="text-4xl font-bold text-gray-900">29 EUR</p>
              <p className="text-sm text-gray-500">por integrante  IVA incluido</p>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-500" />
                QR dinamico editable desde el movil
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-500" />
                Subida de disenos PNG por persona
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-500" />
                Panel colaborativo para todo el grupo
              </li>
            </ul>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/configurador"
                className="inline-flex items-center justify-center rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                Empezar ahora
              </Link>
              <a
                href="mailto:hola@elquelo.com"
                className="text-center text-sm font-semibold text-primary-600 transition hover:text-primary-700"
              >
                Hablar con una persona del equipo
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-900 py-20 text-white sm:py-24">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-primary-200">
              Historias reales
            </span>
            <h2 className="mt-6 text-3xl font-bold sm:text-4xl">
              El QR nos salvo la noche: cambiamos el reto final en el taxi.
            </h2>
            <p className="mt-3 text-gray-300">
              Marta, organizadora de la despedida de Ana
            </p>
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-4 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">Preguntas frecuentes</h2>
          <p className="mt-3 text-gray-600">
            Todo lo que debes saber antes de encargar tu kit.
          </p>
        </div>
        <div className="mt-10 space-y-4">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-primary-200"
            >
              <summary className="flex cursor-pointer items-center justify-between text-left text-lg font-semibold text-gray-900">
                {item.question}
                <span className="ml-4 text-primary-500 group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden bg-primary-600 py-20 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.5)_0,_transparent_60%)]" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Listas para la despedida? Preparamos el kit contigo.
          </h2>
          <p className="max-w-2xl text-base text-primary-50">
            Configura el pedido ahora, sube tus disenos y coordina retos desde un unico panel. Nosotros nos encargamos de la produccion y logistica.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/configurador"
              className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-primary-600 shadow-lg transition hover:bg-primary-50"
            >
              Empezar gratis
            </Link>
            <a
              href="mailto:hola@elquelo.com"
              className="text-sm font-semibold text-white/80 transition hover:text-white"
            >
              Dudas? Escribenos y te llamamos 
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
