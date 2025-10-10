# 🔧 Solución de Errores en Vercel - Guía Rápida

## ❌ Errores Detectados y Soluciones Aplicadas

### 1. Error 404: hero-bg.jpeg
**Estado**: ✅ **SOLUCIONADO**

**Problema**: 
```
Failed to load resource: the server responded with a status of 404 ()
/hero-bg.jpeg
```

**Causa**: La página principal intentaba cargar una imagen que no existe en `/public`

**Solución Aplicada**:
- Reemplazado `backgroundImage: 'url(/hero-bg.jpg)'` por un gradiente CSS:
  ```tsx
  <div className="h-full w-full bg-gradient-to-br from-primary-600 to-primary-800" />
  ```
- **Archivo modificado**: `app/page.tsx` (línea 74-77)

**Alternativa** (si quieres usar una imagen):
1. Agrega la imagen a `/public/hero-bg.jpg`
2. Usa: `backgroundImage: 'url(/hero-bg.jpg)'`

---

### 2. Error 404: /auth/callback
**Estado**: ✅ **SOLUCIONADO**

**Problema**:
```
GET https://zelquelo-lrzuxlxzw-3smceis-projects.vercel.app/auth/callback?code=... 404
(Not Found)
```

**Causa**: Vercel no reconocía correctamente la ruta de callback de autenticación

**Solución Aplicada**:
- Agregado rewrite en `vercel.json`:
  ```json
  {
    "rewrites": [
      {
        "source": "/auth/callback",
        "destination": "/api/auth/callback"
      }
    ]
  }
  ```
- **Archivo modificado**: `vercel.json`

**Acción Requerida**: Redesplegar en Vercel para aplicar cambios

---

### 3. Error 401: Supabase Unauthorized
**Estado**: ⚠️ **REQUIERE CONFIGURACIÓN MANUAL EN VERCEL**

**Problema**:
```
POST https://thwkezhmn+maccvy13g.supabase.co/auth/v1/token?grant_type=password 401
(Unauthorized)
```

**Causa**: Variables de entorno de Supabase no están configuradas correctamente en Vercel

**Solución Paso a Paso**:

#### Paso 1: Verificar Variables en Vercel
1. Ve a tu proyecto en Vercel Dashboard
2. Click en **Settings** → **Environment Variables**
3. Verifica que estén configuradas:

```env
# 🔑 OBLIGATORIAS
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...tu-clave-anon
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...tu-clave-service-role

# 📍 URL de tu app
NEXT_PUBLIC_APP_URL=https://tu-dominio.vercel.app

# 🔗 QR Domain
QR_DOMAIN=lql.to

# 💳 Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 🖨️ Printful
PRINTFUL_API_KEY=tu_printful_api_key

# 📧 Brevo (opcional)
BREVO_API_KEY=tu_brevo_api_key
```

#### Paso 2: Configurar URLs en Supabase
1. Ve a **Supabase Dashboard** → tu proyecto
2. **Authentication** → **URL Configuration**
3. Configura:

```
Site URL: 
https://tu-dominio.vercel.app

Additional Redirect URLs (una por línea):
https://tu-dominio.vercel.app/auth/callback
https://tu-dominio.vercel.app/**
```

4. Si tienes dominio custom (ej: elquelo.eu), también añade:
```
https://elquelo.eu/auth/callback
https://elquelo.eu/**
```

#### Paso 3: Redesplegar en Vercel
**IMPORTANTE**: Los cambios en variables de entorno NO se aplican automáticamente

Opción A - Desde Dashboard:
1. Ve a **Deployments** en tu proyecto de Vercel
2. Click en los tres puntos del último deployment
3. Click en **Redeploy**
4. **DESMARCA** "Use existing Build Cache"
5. Click **Redeploy**

Opción B - Desde Terminal:
```bash
vercel --prod
```

---

## ✅ Lista de Verificación Post-Despliegue

Después de redesplegar, verifica:

- [ ] La página principal carga sin error de hero-bg.jpeg
- [ ] No hay error 404 en /auth/callback
- [ ] Puedes hacer login/registro sin error 401
- [ ] Los QR se generan correctamente
- [ ] El checkout de Stripe funciona

---

## 🔍 Cómo Verificar que Todo Funciona

### 1. Abre DevTools (F12)
### 2. Ve a la pestaña Console
### 3. Recarga la página (Ctrl+R o Cmd+R)
### 4. No deberías ver:
   - ❌ Error 404 de hero-bg.jpeg
   - ❌ Error 404 de /auth/callback (al hacer login)
   - ❌ Error 401 de Supabase

---

## 🆘 Si Siguen los Errores

### Error 401 persiste:
1. Verifica que copiaste las claves correctas de Supabase
   - En Supabase: **Settings** → **API**
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`

2. Asegúrate de haber redesplegar DESPUÉS de cambiar variables

3. Prueba en modo incógnito (Ctrl+Shift+N) para evitar cache

### Error 404 persiste:
1. Verifica que el archivo `app/auth/callback/route.ts` existe
2. Verifica que `vercel.json` tiene los rewrites
3. Redespliega con cache limpio

---

## 📞 Información de Contacto para Soporte

- Vercel Docs: https://vercel.com/docs/environment-variables
- Supabase + Vercel Guide: https://supabase.com/docs/guides/hosting/vercel
- Next.js Auth Guide: https://nextjs.org/docs/app/building-your-application/authentication

---

**Última actualización**: 10 de octubre de 2025
**Archivos modificados**:
- ✅ `app/page.tsx`
- ✅ `vercel.json`
- ✅ `DEPLOY_VERCEL.md`

