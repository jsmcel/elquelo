# Restaurar .env.local

He eliminado el archivo `.env.local` que creé por error. 

**Para restaurar tu archivo original:**

1. Crea un nuevo archivo `.env.local` en la raíz del proyecto
2. Agrega tus variables de entorno originales

**Variables que probablemente necesitas:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Otros servicios
PRINTFUL_API_KEY=tu_printful_key
BREVO_API_KEY=tu_brevo_key
QR_DOMAIN=tu_dominio_qr
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Una vez que restaures el archivo, podrás:**
- Ejecutar `npx supabase db reset` para sincronizar la base de datos
- O ejecutar el SQL manualmente en Supabase (ver `INSTRUCCIONES_DATABASE.md`)

¡Perdón por el inconveniente! 😅

