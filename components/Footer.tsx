import Link from 'next/link'
import { Mail, Phone, MapPin, Instagram, Send } from 'lucide-react'

const footerLinks = [
  {
    title: 'Explora',
    links: [
      { href: '#como-funciona', label: 'Cmo funciona' },
      { href: '#kit', label: 'Qu incluye' },
      { href: '#precio', label: 'Precio del kit' },
      { href: '/configurador', label: 'Configurar ahora' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { href: '/dashboard', label: 'Acceder al panel' },
      { href: '#faq', label: 'Preguntas frecuentes' },
      { href: 'mailto:hola@elquelo.com', label: 'Soporte' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-gray-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2 space-y-5">
            <div className="flex items-center space-x-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-lg font-bold">
                E
              </div>
              <div className="leading-tight">
                <p className="text-xl font-bold">ELQUELO</p>
                <p className="text-xs uppercase tracking-[0.3em] text-primary-300">
                  QRs inteligentes para despedidas
                </p>
              </div>
            </div>
            <p className="max-w-md text-sm text-gray-300">
              El kit definitivo para organizar una despedida inolvidable: camisetas con QR dinmico, panel en tiempo real y contenido personalizado para cada integrante.
            </p>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <MapPin className="h-4 w-4 text-primary-400" />
              <span>Madrid  Envos a toda Espaa</span>
            </div>
            <div className="flex space-x-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-primary-500"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="mailto:hola@elquelo.com"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-primary-500"
              >
                <Send className="h-4 w-4" />
              </a>
            </div>
          </div>

          {footerLinks.map((column) => (
            <div key={column.title} className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-200">
                {column.title}
              </h3>
              <ul className="space-y-2 text-sm text-gray-400">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="transition hover:text-primary-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-200">
              Contacto directo
            </h3>
            <div className="space-y-3 text-sm text-gray-300">
              <a
                href="mailto:hola@elquelo.com"
                className="flex items-center gap-2 transition hover:text-primary-300"
              >
                <Mail className="h-4 w-4 text-primary-400" />
                hola@elquelo.com
              </a>
              <a
                href="tel:+34600000000"
                className="flex items-center gap-2 transition hover:text-primary-300"
              >
                <Phone className="h-4 w-4 text-primary-400" />
                +34 600 000 000
              </a>
            </div>
            <p className="text-xs text-gray-500">
              Resolvemos dudas del pack, personalizacin de contenido y logstica de la despedida. Escrbenos o reserva una llamada!
            </p>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-gray-500">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p> {new Date().getFullYear()} ELQUELO. Todos los derechos reservados.</p>
            <div className="flex space-x-4">
              <Link href="/privacy" className="transition hover:text-primary-300">
                Privacidad
              </Link>
              <Link href="/terms" className="transition hover:text-primary-300">
                Trminos
              </Link>
              <Link href="/cookies" className="transition hover:text-primary-300">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
