# ELQUELO - Camisetas Inteligentes con QR Dinámicos

Una plataforma completa de dropshipping para camisetas con códigos QR dinámicos, NFTs y experiencias interactivas.

## 🚀 Características Principales

### 4 Líneas de Negocio

1. **Colecciones DROP** - Camisetas con QR estáticos y NFTs únicos
2. **Eventos** - Team building, despedidas y eventos corporativos
3. **Merchandising** - Menús interactivos y ofertas con QR
4. **Estado** - QR dinámicos con suscripción mensual/anual

### Tecnologías

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Pagos**: Stripe (Checkout + Subscriptions)
- **POD**: Printful API
- **NFTs**: Thirdweb SDK (Base Network)
- **QR**: Sistema propio con dominio corto
- **Email**: Brevo

## 🤖 Actualizaciones Automáticas

El sistema actualiza automáticamente los datos de Printful:

- **Catálogo de Productos**: Diariamente a las 3:00 AM UTC (~433 productos)
- **Printfiles (Dimensiones)**: Solo cuando el catálogo cambia (~433 productos)

**Características:**
- ✅ Solo actualiza si hay cambios reales (eficiente)
- ✅ Preserva ajustes manuales optimizados (back offset, etc.)
- ✅ Dimensiones basadas en datos reales de Printful
- ✅ Caché inteligente para minimizar deploys

Ver más detalles en [docs/PRINTFUL_UPDATES.md](docs/PRINTFUL_UPDATES.md)

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd elquelo
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp env.example .env.local
```

Completar las variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_THIRDWEB_CLIENT_ID`
- `THIRDWEB_SECRET_KEY`
- `PRINTFUL_API_KEY`
- `BREVO_API_KEY`
- `QR_DOMAIN`

4. **Configurar Supabase**
```bash
# Ejecutar el esquema de base de datos
psql -h <supabase-host> -U postgres -d postgres -f supabase/schema.sql
```

5. **Ejecutar el proyecto**
```bash
npm run dev
```

## 📁 Estructura del Proyecto

```
elquelo/
├── app/                    # App Router de Next.js
│   ├── api/               # API Routes
│   ├── auth/              # Páginas de autenticación
│   ├── dashboard/         # Panel de usuario
│   ├── drops/            # Colecciones DROP
│   ├── eventos/          # Eventos
│   ├── merchandising/    # Merchandising
│   └── estado/           # Camisetas Estado
├── components/           # Componentes reutilizables
├── lib/                 # Utilidades y configuraciones
├── supabase/            # Esquema de base de datos
└── public/              # Archivos estáticos
```

## 🔧 Configuración de Servicios

### Supabase
1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ejecutar el esquema SQL en `supabase/schema.sql`
3. Configurar RLS (Row Level Security)

### Stripe
1. Crear cuenta en [stripe.com](https://stripe.com)
2. Obtener claves de API
3. Configurar webhooks para `/api/webhooks/stripe`

### Printful
1. Crear cuenta en [printful.com](https://printful.com)
2. Obtener API key
3. Configurar webhooks para `/api/printful/webhook`

### Thirdweb
1. Crear proyecto en [thirdweb.com](https://thirdweb.com)
2. Configurar red Base
3. Obtener claves de API

## 🚀 Despliegue

### Vercel (Recomendado)
1. Conectar repositorio a Vercel
2. Configurar variables de entorno
3. Desplegar automáticamente

### Otras plataformas
- Netlify
- Railway
- DigitalOcean App Platform

## 📊 Funcionalidades Implementadas

### ✅ Completado
- [x] Estructura del proyecto Next.js
- [x] Autenticación con Supabase
- [x] Base de datos completa
- [x] Páginas de productos (4 líneas)
- [x] Sistema de pagos con Stripe
- [x] QR dinámicos
- [x] Sistema de NFTs
- [x] Panel de usuario
- [x] Integración con Printful

### 🔄 En desarrollo
- [ ] Panel de administración completo
- [ ] Analytics avanzados
- [ ] App móvil
- [ ] Integración con redes sociales

## 🎯 Próximos Pasos

1. **Configurar servicios externos**
2. **Probar flujo completo de compra**
3. **Configurar dominio personalizado**
4. **Implementar analytics**
5. **Optimizar rendimiento**

## 📞 Soporte

Para soporte técnico o consultas:
- Email: hola@elquelo.com
- Teléfono: +34 600 000 000

## 📄 Licencia

Este proyecto es privado y confidencial. Todos los derechos reservados.
