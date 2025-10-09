# Guía de Despliegue en Vercel - elquilo.eu

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
NEXT_PUBLIC_APP_URL=https://elquilo.eu
QR_DOMAIN=https://elquilo.eu/qr
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
2. Añadir dominio: `elquilo.eu`
3. Añadir también: `www.elquilo.eu`
4. Vercel te dará registros DNS para configurar:
   - Tipo: `A` → Valor: `76.76.21.21`
   - Tipo: `CNAME` → Valor: `cname.vercel-dns.com`

### Paso 5: Configurar tu Proveedor de Dominio
Ve a tu proveedor de dominio (donde compraste elquilo.eu) y añade:
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
https://elquilo.eu/api/webhooks/stripe
```

### 2. URLs Autorizadas en Supabase
En Supabase Dashboard → Authentication → URL Configuration:
```
Site URL: https://elquilo.eu
Redirect URLs:
  - https://elquilo.eu/auth/callback
  - https://elquilo.eu/dashboard
```

### 3. CORS en Supabase (si es necesario)
En Supabase → Settings → API:
```
Allowed Origins: https://elquilo.eu, https://www.elquilo.eu
```

### 4. Variables de QR_DOMAIN
Asegúrate que todos los QRs generados usen: `https://elquilo.eu/qr`

## 🔍 Verificación Post-Despliegue

1. ✅ Visita https://elquilo.eu (debe cargar)
2. ✅ Prueba login/registro
3. ✅ Crea un evento de prueba
4. ✅ Genera un QR y escanéalo
5. ✅ Prueba el checkout de Stripe
6. ✅ Verifica webhooks en Stripe Dashboard

## 🐛 Troubleshooting

### Error de Variables de Entorno
- Verifica que TODAS las variables estén configuradas en Vercel
- Redeploy después de añadir variables: `vercel --prod`

### Error de Dominio
- Espera 24-48h para propagación DNS
- Verifica registros DNS: `nslookup elquilo.eu`

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

