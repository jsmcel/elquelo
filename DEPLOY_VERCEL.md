# Guía de Despliegue en Vercel - elquelo.eu

## 📋 Pre-requisitos

1. Cuenta en Vercel (https://vercel.com)
2. Vercel CLI instalado (opcional): `npm i -g vercel`
3. Todas las variables de entorno configuradas

## 🚀 Método 1: Despliegue desde GitHub (Recomendado)

### Paso 1: Subir código a GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin feature/qr-despedida
```

### Paso 2: Conectar con Vercel
1. Ve a https://vercel.com/new
2. Importa tu repositorio de GitHub
3. Selecciona la rama `feature/qr-despedida` (o la que quieras)
4. Framework Preset: **Next.js** (detectado automáticamente)
5. Root Directory: `.` (raíz del proyecto)

### Paso 3: Configurar Variables de Entorno
En Vercel Dashboard → Settings → Environment Variables, añade:

#### 🔑 Variables Públicas (todas las ramas)
```
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://elquelo.eu
QR_DOMAIN=https://elquelo.eu/qr
```

#### 🔐 Variables Secretas (Production)
```
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
PRINTFUL_API_KEY=tu_printful_api_key
BREVO_API_KEY=tu_brevo_api_key
```

### Paso 4: Configurar Dominio Personalizado
1. En Vercel Dashboard → Settings → Domains
2. Añadir dominio: `elquelo.eu`
3. Añadir también: `www.elquelo.eu`
4. Vercel te dará registros DNS para configurar:
   - Tipo: `A` → Valor: `76.76.21.21`
   - Tipo: `CNAME` → Valor: `cname.vercel-dns.com`

**⭐ Ver guía detallada**: `CONFIGURAR_DOMINIO_VERCEL.md`

### Paso 5: Configurar tu Proveedor de Dominio
Ve a tu proveedor de dominio (donde compraste elquelo.eu) y añade:
```
Tipo: A
Nombre: @
Valor: 76.76.21.21
TTL: 3600

Tipo: CNAME
Nombre: www
Valor: cname.vercel-dns.com
TTL: 3600
```

## 🚀 Método 2: Despliegue con Vercel CLI

### Instalación
```bash
npm i -g vercel
vercel login
```

### Desplegar
```bash
# Primera vez (configuración interactiva)
vercel

# Producción
vercel --prod
```

## ⚙️ Configuraciones Adicionales Post-Despliegue

### 1. Webhook de Stripe
Actualiza el webhook de Stripe con la nueva URL:
```
https://elquelo.eu/api/webhooks/stripe
```

### 2. URLs Autorizadas en Supabase
En Supabase Dashboard → Authentication → URL Configuration:
```
Site URL: https://elquelo.eu
Redirect URLs:
  - https://elquelo.eu/auth/callback
  - https://elquelo.eu/dashboard
```

### 3. CORS en Supabase (si es necesario)
En Supabase → Settings → API:
```
Allowed Origins: https://elquelo.eu, https://www.elquelo.eu
```

### 4. Variables de QR_DOMAIN
Asegúrate que todos los QRs generados usen: `https://elquelo.eu/qr`

## 🔍 Verificación Post-Despliegue

1. ✅ Visita https://elquelo.eu (debe cargar)
2. ✅ Prueba login/registro
3. ✅ Crea un evento de prueba
4. ✅ Genera un QR y escanéalo
5. ✅ Prueba el checkout de Stripe
6. ✅ Verifica webhooks en Stripe Dashboard

## 🐛 Troubleshooting

### ❌ Error 401 (Unauthorized) en Supabase
**Síntoma**: Error en consola: `POST /auth/v1/token?grant_type=password 401 (Unauthorized)`

**Causas comunes**:
1. Variables de entorno de Supabase incorrectas o faltantes
2. URLs de callback no autorizadas en Supabase
3. Credenciales inválidas

**Solución**:
1. Verifica en **Vercel Dashboard** → **Settings** → **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` debe ser la URL de tu proyecto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` debe ser la clave anónima correcta
   - `SUPABASE_SERVICE_ROLE_KEY` debe estar configurada

2. Verifica en **Supabase Dashboard** → **Authentication** → **URL Configuration**:
   ```
   Site URL: https://tu-dominio.vercel.app
   Redirect URLs:
     - https://tu-dominio.vercel.app/auth/callback
     - https://tu-dominio.vercel.app/**
   ```

3. Después de cambiar variables de entorno, **DEBES REDESPLEGAR**:
   ```bash
   vercel --prod
   ```
   O en el dashboard: **Deployments** → **Redeploy** (con el checkbox de "Use existing Build Cache" **desmarcado**)

### ❌ Error 404 en /auth/callback
**Síntoma**: Error en consola: `GET /auth/callback?code=... 404 (Not Found)`

**Causa**: La ruta de callback no está siendo reconocida por Vercel

**Solución**: 
- Ya incluido en `vercel.json` con rewrites
- Asegúrate de redesplegar después de actualizar `vercel.json`
- Verifica que el archivo `app/auth/callback/route.ts` existe

### ❌ Error 404 en recursos estáticos (imágenes, archivos)
**Síntoma**: Error en consola: `Failed to load resource: 404 (Not Found)` para archivos `.jpg`, `.png`, etc.

**Causa**: Archivos no existen o rutas incorrectas

**Solución**:
1. Verifica que los archivos existan en la carpeta `/public`
2. Las rutas deben ser relativas: `/imagen.jpg` (no `./imagen.jpg`)
3. Si un archivo no es necesario, elimina la referencia o usa un fallback (gradient, color sólido)

### Error de Variables de Entorno
- Verifica que TODAS las variables estén configuradas en Vercel
- Redeploy después de añadir variables: `vercel --prod`
- **IMPORTANTE**: Los cambios en variables de entorno NO aplican automáticamente, necesitas redesplegar

### Error de Dominio
- Espera 24-48h para propagación DNS
- Verifica registros DNS: `nslookup elquelo.eu`

### Error de Build
- Revisa logs en Vercel Dashboard
- Asegúrate que `npm run build` funcione localmente

### Error de Webhooks
- Actualiza el endpoint en Stripe Dashboard
- Verifica el STRIPE_WEBHOOK_SECRET

## 📊 Monitoreo

- Analytics: Vercel Dashboard → Analytics
- Logs: Vercel Dashboard → Logs
- Errores: Vercel Dashboard → Issues

## 🔄 Actualizaciones Futuras

Cada push a la rama configurada desplegará automáticamente:
```bash
git add .
git commit -m "Update feature"
git push origin feature/qr-despedida
```

Vercel auto-desplegará y te notificará por email.

## 📞 Soporte

- Vercel Docs: https://vercel.com/docs
- Next.js Deploy: https://nextjs.org/docs/deployment
- Supabase + Vercel: https://supabase.com/docs/guides/hosting/vercel

