"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { toast } from 'react-hot-toast'
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react'
import { useUser } from '@/app/providers'

export default function LoginPage() {
 const [email, setEmail] = useState('')
 const [password, setPassword] = useState('')
 const [showPassword, setShowPassword] = useState(false)
 const [loading, setLoading] = useState(false)
 const router = useRouter()
 const searchParams = useSearchParams()
 const redirectParam = searchParams.get('redirect')
 const supabase = createClientComponentClient()
 const { user, loading: userLoading } = useUser()

 const resolveDestination = useCallback(async (userId: string) => {
  if (redirectParam) {
   return redirectParam
  }

  const { count } = await supabase
   .from('qrs')
   .select('id', { count: 'exact', head: true })
   .eq('user_id', userId)

  return count && count > 0 ? '/dashboard' : '/configurador'
 }, [redirectParam, supabase])

 const handleLogin = async (event: React.FormEvent) => {
  event.preventDefault()
  setLoading(true)

  try {
   const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
   })

   if (error || !data.user) {
    toast.error(error?.message || 'No se pudo iniciar sesion')
    return
   }

   toast.success('Sesion iniciada')
   const destination = await resolveDestination(data.user.id)
   router.push(destination)
  } catch (error) {
   toast.error('Error al iniciar sesion')
  } finally {
   setLoading(false)
  }
 }

 const handleMagicLink = async () => {
  if (!email) {
   toast.error('Introduce tu email')
   return
  }

  setLoading(true)

  try {
   const redirect = redirectParam || '/configurador'
   const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
     emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`,
    },
   })

   if (error) {
    toast.error(error.message)
   } else {
    toast.success('Revisa tu email para el enlace de acceso')
   }
  } catch (error) {
   toast.error('Error al enviar el enlace')
  } finally {
   setLoading(false)
  }
 }

useEffect(() => {
  const redirectIfLogged = async () => {
   if (user) {
    const destination = await resolveDestination(user.id)
    router.replace(destination)
   }
  }

  if (!userLoading && user) {
   redirectIfLogged()
  }
 }, [user, userLoading, router, resolveDestination])


 return (
  <div className="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
   <div className="sm:mx-auto sm:w-full sm:max-w-md">
    <Link href="/" className="mb-6 flex items-center justify-center gap-2">
     <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-xl font-bold text-white">
      Q
     </div>
     <span className="text-2xl font-bold text-primary-600">ELQUELO</span>
    </Link>

    <h2 className="text-center text-3xl font-bold text-gray-900">Inicia sesion</h2>
    <p className="mt-2 text-center text-sm text-gray-600">
     No tienes cuenta?{' '}
     <Link
      href={`/auth/register${redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : ''}`}
      className="font-medium text-primary-600 transition hover:text-primary-500"
     >
      Registrate aqui
     </Link>
    </p>
   </div>

   <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div className="rounded-lg bg-white py-8 px-4 shadow sm:px-10">
     <form className="space-y-6" onSubmit={handleLogin}>
      <div>
       <label htmlFor="email" className="block text-sm font-medium text-gray-700">
        Email
       </label>
       <div className="relative mt-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
         <Mail className="h-5 w-5 text-gray-400" />
        </div>
        <input
         id="email"
         name="email"
         type="email"
         autoComplete="email"
         required
         value={email}
         onChange={(event) => setEmail(event.target.value)}
         className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
         placeholder="tu@email.com"
        />
       </div>
      </div>

      <div>
       <label htmlFor="password" className="block text-sm font-medium text-gray-700">
        Contrasena
       </label>
       <div className="relative mt-1">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
         <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
         id="password"
         name="password"
         type={showPassword ? 'text' : 'password'}
         autoComplete="current-password"
         required
         value={password}
         onChange={(event) => setPassword(event.target.value)}
         className="block w-full rounded-md border border-gray-300 py-2 pl-10 pr-10 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-primary-500"
         placeholder="Tu contrasena"
        />
        <button
         type="button"
         className="absolute inset-y-0 right-0 flex items-center pr-3"
         onClick={() => setShowPassword((prev) => !prev)}
        >
         {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
        </button>
       </div>
      </div>

      <div className="flex items-center justify-between">
       <div className="flex items-center">
        <input
         id="remember-me"
         name="remember-me"
         type="checkbox"
         className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
         Recordarme
        </label>
       </div>

       <div className="text-sm">
        <Link href="/auth/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
         Olvidaste tu contrasena?
        </Link>
       </div>
      </div>

      <div>
       <button
        type="submit"
        disabled={loading}
        className="flex w-full justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
       >
        {loading ? 'Iniciando sesion...' : 'Iniciar sesion'}
       </button>
      </div>

      <div>
       <button
        type="button"
        onClick={handleMagicLink}
        disabled={loading}
        className="flex w-full justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
       >
        Enviar enlace magico
       </button>
      </div>
     </form>

     <div className="mt-6">
      <Link href="/" className="flex items-center justify-center gap-2 text-sm text-gray-600 transition hover:text-gray-900">
       <ArrowLeft className="h-4 w-4" /> Volver al inicio
      </Link>
     </div>
    </div>
   </div>
  </div>
 )
}


 