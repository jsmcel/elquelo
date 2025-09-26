'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ShoppingCart, User } from 'lucide-react'
import { useUser } from '@/app/providers'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, loading } = useUser()

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-2xl font-bold text-primary-600">ELQUELO</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/drops" className="text-gray-700 hover:text-primary-600 transition-colors">
              Drops
            </Link>
            <Link href="/eventos" className="text-gray-700 hover:text-primary-600 transition-colors">
              Eventos
            </Link>
            <Link href="/merchandising" className="text-gray-700 hover:text-primary-600 transition-colors">
              Merchandising
            </Link>
            <Link href="/estado" className="text-gray-700 hover:text-primary-600 transition-colors">
              Estado
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {!loading && (
              <>
                {user ? (
                  <Link 
                    href="/dashboard" 
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span>Mi Cuenta</span>
                  </Link>
                ) : (
                  <Link 
                    href="/auth/login" 
                    className="text-gray-700 hover:text-primary-600 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                )}
                <Link 
                  href="/cart" 
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Carrito</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/drops" 
                className="text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Drops
              </Link>
              <Link 
                href="/eventos" 
                className="text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Eventos
              </Link>
              <Link 
                href="/merchandising" 
                className="text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Merchandising
              </Link>
              <Link 
                href="/estado" 
                className="text-gray-700 hover:text-primary-600 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Estado
              </Link>
              <div className="pt-4 border-t">
                {user ? (
                  <Link 
                    href="/dashboard" 
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>Mi Cuenta</span>
                  </Link>
                ) : (
                  <Link 
                    href="/auth/login" 
                    className="text-gray-700 hover:text-primary-600 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                )}
                <Link 
                  href="/cart" 
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors mt-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Carrito</span>
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
