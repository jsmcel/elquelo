"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { Menu, X, LogIn, LayoutDashboard, LogOut, Loader2 } from 'lucide-react'
import { useUser } from '@/app/providers'

const sections = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#kit', label: 'Que incluye' },
  { href: '#precio', label: 'Precio' },
  { href: '#faq', label: 'FAQ' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const { user, loading } = useUser()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const pathname = usePathname()

  const goToConfigurator = () => {
    const target = '/configurador'
    if (user) {
      router.push(target)
    } else {
      router.push(`/auth/register?redirect=${encodeURIComponent(target)}`)
    }
  }

  const goToLogin = () => {
    const redirect = pathname === '/configurador' ? '/configurador' : undefined
    router.push(redirect ? `/auth/login?redirect=${encodeURIComponent(redirect)}` : '/auth/login')
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      setOpen(false)
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
      toast.success('Sesión cerrada')
    } catch (error) {
      console.error('Error during logout', error)
      toast.error('No pudimos cerrar la sesión')
    } finally {
      setLoggingOut(false)
    }
  }

  const renderLinks = () => (
    <>
      {sections.map((item) => (
        <a
          key={item.href}
          href={item.href}
          onClick={() => setOpen(false)}
          className="text-sm font-medium text-gray-600 transition hover:text-primary-600"
        >
          {item.label}
        </a>
      ))}
    </>
  )

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center">
          <div className="flex h-24 w-24 items-center justify-center">
            <img 
              src="/logo.png" 
              alt="ELQUELO Logo" 
              className="h-20 w-20 object-contain"
            />
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">{renderLinks()}</nav>

        <div className="hidden items-center gap-3 md:flex">
          {!loading && (
            user ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary-500 hover:text-primary-600"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Panel
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button
                onClick={goToLogin}
                className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-primary-500 hover:text-primary-600"
              >
                <LogIn className="h-4 w-4" />
                Iniciar sesion
              </button>
            )
          )}
          <button
            onClick={goToConfigurator}
            className="inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-700"
          >
            Crear mi kit
          </button>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:border-primary-500 hover:text-primary-600 md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Abrir menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col space-y-4 px-4 py-6 text-sm font-medium text-gray-700">
            {renderLinks()}
            {!loading && (
              user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2"
                    onClick={() => setOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Panel
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-left font-semibold text-red-600 transition hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loggingOut ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    Cerrar sesion
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setOpen(false)
                    goToLogin()
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-left"
                >
                  <LogIn className="h-4 w-4" /> Iniciar sesion
                </button>
              )
            )}
            <button
              onClick={() => {
                setOpen(false)
                goToConfigurator()
              }}
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 font-semibold text-white"
            >
              Crear mi kit
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
