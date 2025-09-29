# MVP Despedidas - Guía End to End

## 1. Alcance del MVP
- **Landing única** enfocada al kit de despedidas: storytelling, pasos, precio y CTA al configurador.
- **Configurador web** con wizard en 3 pasos: detalles, integrantes y confirmación/pago.
- **Gestión de QRs**: creación individual o en masa, edición, activación/desactivación y subida de diseños PNG por integrante.
- **Redirección dinámica**: `/api/qr/[code]` mantiene estadísticas de escaneos y redirige a la URL activa.
- **Panel**: dashboard para gestionar camisetas, diseños y QRs en tiempo real.

## 2. Preparar entorno local
1. `cp env.example .env.local`
2. Completar las variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - (Opcional) claves de Stripe si quieres probar el checkout real.
3. En Supabase → SQL Editor → ejecutar `supabase/schema.sql`.
4. En Supabase Storage crea un bucket público llamado `designs` (opción *Public bucket*).
5. Asegúrate de correr con Node 20+: `nvm use 20` o similar.
6. `npm install`
7. `npm run dev`

## 3. Tests rápidos (local)
- `npm run lint`
- Workflow manual sugerido:
  1. Registrar/entrar desde la landing.
  2. Visitar `/configurador`, añadir 5 integrantes, subir PNG (dummy) y generar QRs.
  3. Completar pago (simulado) y verificar que se abren los QRs.
  4. En `/dashboard` probar edición, activación/desactivación y nueva subida de PNG.
  5. Escanear un QR (abrir link corto) y validar que el contador sube.

## 4. Despliegue
1. **Supabase**
   - Proyecto creado previamente → ejecutar `schema.sql` y activar el bucket `designs`.
   - Añadir variables en Vercel (mismas que `.env.local`).
2. **Dominio corto**
   - Configurar subdominio (ej. `qr.midominio.com`) → apuntar a Vercel.
   - Actualizar `QR_DOMAIN` & `NEXT_PUBLIC_APP_URL` en los entornos.
3. **Vercel**
   - `vercel link` → `vercel`.
   - Incluir variables y habilitar Node 20 en las settings del proyecto.
4. **Stripe (opcional)**
   - Crear producto “Kit Despedida”.
   - Añadir `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
5. **Post deploy**
   - Crear cuenta demo, generar kit, subir PNG y validar redirecciones + dashboard.

## 5. Próximos pasos sugeridos
- Conectar flujo de pago con Printful / logística real.
- Añadir métricas en el dashboard (escaneos por integrante, actividad, timeline).
- Automatizar email de bienvenida + recordatorios (Brevo).
- Añadir modo colaborativo (compartir acceso temporal con el grupo) y seguimiento del estado de producción/envío.
