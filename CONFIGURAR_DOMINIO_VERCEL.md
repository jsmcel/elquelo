# 🌐 Configurar Dominio Personalizado elquelo.eu en Vercel

## 📋 Requisitos Previos
- ✅ Proyecto desplegado en Vercel
- ✅ Dominio `elquelo.eu` registrado
- ✅ Acceso al panel de administración de tu proveedor de dominio (ej: Namecheap, GoDaddy, Cloudflare, etc.)

---

## 🚀 Paso 1: Añadir el Dominio en Vercel

### 1.1 Acceder a la Configuración de Dominios
1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en tu proyecto **elquelo**
3. Click en **Settings** (en el menú superior)
4. Click en **Domains** (en el menú lateral)

### 1.2 Añadir el Dominio Principal
1. En el campo "Domain", escribe: **`elquelo.eu`**
2. Click en **Add**
3. Vercel te mostrará los registros DNS que necesitas configurar

### 1.3 Añadir el Subdominio WWW (Recomendado)
1. En el mismo campo "Domain", escribe: **`www.elquelo.eu`**
2. Click en **Add**
3. Selecciona la opción: **"Redirect to elquelo.eu"** (para redirigir automáticamente)

---

## 🔧 Paso 2: Configurar DNS en tu Proveedor de Dominio

Vercel te mostrará los registros DNS necesarios. Generalmente son:

### Opción A: Usar Nameservers de Vercel (Más Fácil)
**Recomendado si no tienes otros servicios en este dominio**

Vercel te dará nameservers como:
```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

**Pasos**:
1. Ve al panel de tu proveedor de dominio (donde compraste elquelo.eu)
2. Busca la sección **DNS** o **Nameservers**
3. Cambia los nameservers a los que te dio Vercel
4. Guarda los cambios

**Ventajas**: Vercel maneja todo automáticamente, incluyendo SSL.

---

### Opción B: Usar Registros A y CNAME (Manual)
**Usa esta opción si ya tienes otros servicios configurados en tu dominio**

#### Para el dominio principal (elquelo.eu):

**Registro A**:
```
Tipo: A
Nombre: @ (o dejar vacío)
Valor: 76.76.21.21
TTL: 3600 (o automático)
```

#### Para el subdominio www (www.elquelo.eu):

**Registro CNAME**:
```
Tipo: CNAME
Nombre: www
Valor: cname.vercel-dns.com
TTL: 3600 (o automático)
```

---

## 📝 Ejemplos por Proveedor

### Si usas **Namecheap**:
1. Login en Namecheap
2. Dashboard → Domain List → Manage (al lado de elquelo.eu)
3. Advanced DNS → Add New Record
4. Añade los registros A y CNAME

### Si usas **GoDaddy**:
1. Login en GoDaddy
2. My Products → DNS (al lado de elquelo.eu)
3. Add → selecciona A o CNAME
4. Añade los registros

### Si usas **Cloudflare**:
1. Login en Cloudflare
2. Selecciona elquelo.eu
3. DNS → Add record
4. Añade los registros A y CNAME
5. **IMPORTANTE**: Activa el "Proxy status" (nube naranja) para ambos registros

### Si usas **Google Domains**:
1. Login en Google Domains
2. My domains → elquelo.eu → DNS
3. Custom records → Manage custom records
4. Añade los registros

---

## ⏱️ Paso 3: Esperar la Propagación DNS

- **Tiempo**: Entre 5 minutos y 48 horas (normalmente 30 minutos)
- Vercel te enviará un email cuando el dominio esté listo
- Vercel configurará automáticamente el certificado SSL (HTTPS)

### Verificar Propagación:
Abre terminal y ejecuta:
```bash
# Windows
nslookup elquelo.eu

# Mac/Linux
dig elquelo.eu
```

Deberías ver la IP `76.76.21.21` si está propagado correctamente.

También puedes usar: https://dnschecker.org/#A/elquelo.eu

---

## 🔐 Paso 4: Actualizar Variables de Entorno en Vercel

Una vez que el dominio esté funcionando, actualiza las variables:

1. Ve a **Settings** → **Environment Variables** en Vercel
2. Actualiza o añade:

```env
NEXT_PUBLIC_APP_URL=https://elquelo.eu
QR_DOMAIN=https://elquelo.eu/qr
```

3. **IMPORTANTE**: Después de cambiar variables, ve a **Deployments** → **Redeploy**

---

## 🔗 Paso 5: Actualizar Configuraciones Externas

### 5.1 Supabase
Ve a **Supabase Dashboard** → tu proyecto → **Authentication** → **URL Configuration**:

```
Site URL: 
https://elquelo.eu

Additional Redirect URLs (una por línea):
https://elquelo.eu/auth/callback
https://elquelo.eu/**
https://www.elquelo.eu/auth/callback
https://www.elquelo.eu/**
```

También en **Settings** → **API** → **CORS Allowed Origins**:
```
https://elquelo.eu
https://www.elquelo.eu
```

### 5.2 Stripe
Ve a **Stripe Dashboard** → **Developers** → **Webhooks**:

1. Edita tu webhook existente (o crea uno nuevo)
2. Endpoint URL: **`https://elquelo.eu/api/webhooks/stripe`**
3. Copia el **Signing secret** y actualiza `STRIPE_WEBHOOK_SECRET` en Vercel

### 5.3 Printful
Ve a **Printful Dashboard** → **Stores** → tu tienda → **Settings**:

1. Store URL: **`https://elquelo.eu`**
2. Webhook URL: **`https://elquelo.eu/api/webhooks/printful`** (si lo usas)

---

## ✅ Paso 6: Verificación Final

Después de que todo esté configurado, verifica:

### Checklist:
- [ ] `https://elquelo.eu` carga correctamente
- [ ] `https://www.elquelo.eu` redirige a `https://elquelo.eu`
- [ ] El candado 🔒 (SSL) aparece en el navegador
- [ ] Login/Registro funciona sin errores
- [ ] Puedes crear un evento de prueba
- [ ] Los QR generados usan el dominio correcto
- [ ] El checkout de Stripe funciona
- [ ] No hay errores en DevTools Console (F12)

### Prueba Completa:
1. Abre DevTools (F12)
2. Ve a la pestaña **Console**
3. Navega por tu sitio
4. No deberías ver errores 404, 401, o CORS

---

## 🐛 Troubleshooting

### ❌ "Invalid Configuration" en Vercel
**Causa**: El dominio ya está en uso en otro proyecto de Vercel

**Solución**: 
- Ve al proyecto anterior en Vercel
- Settings → Domains → Elimina el dominio
- Vuelve a añadirlo en el nuevo proyecto

---

### ❌ DNS no propaga (después de 24h)
**Causa**: Registros DNS incorrectos o caché

**Solución**:
1. Verifica los registros en tu proveedor:
   - `@` o raíz → `76.76.21.21` (tipo A)
   - `www` → `cname.vercel-dns.com` (tipo CNAME)
2. Elimina registros duplicados o conflictivos
3. Limpia caché DNS local:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```

---

### ❌ Certificado SSL no se genera
**Causa**: Vercel no puede validar el dominio

**Solución**:
1. Espera 15-30 minutos después de configurar DNS
2. Verifica que los registros DNS apunten correctamente a Vercel
3. En Vercel: Domains → click en "Refresh" o elimina y vuelve a añadir el dominio

---

### ❌ Error CORS después de configurar dominio
**Causa**: Supabase no tiene el nuevo dominio autorizado

**Solución**: Añade el dominio en Supabase (ver Paso 5.1)

---

### ❌ Webhooks de Stripe fallan
**Causa**: El endpoint webhook no está actualizado

**Solución**: Actualiza el webhook en Stripe Dashboard (ver Paso 5.2)

---

## 📊 Monitoreo Post-Configuración

### Verifica Regularmente:
- **Analytics**: Vercel Dashboard → Analytics
- **Logs**: Vercel Dashboard → Logs (busca errores)
- **SSL**: Verifica que el certificado no expire (Vercel lo renueva automáticamente)

### Herramientas Útiles:
- SSL Check: https://www.ssllabs.com/ssltest/analyze.html?d=elquelo.eu
- DNS Check: https://dnschecker.org/#A/elquelo.eu
- Speed Test: https://pagespeed.web.dev/

---

## 🎉 ¡Listo!

Tu sitio ahora está accesible en **https://elquelo.eu**

### Próximos Pasos:
1. Actualiza tus redes sociales con el nuevo dominio
2. Actualiza tu firma de email
3. Crea un email profesional: info@elquelo.eu (usando Google Workspace, Zoho Mail, etc.)
4. Configura Google Analytics con el nuevo dominio
5. Registra tu sitio en Google Search Console

---

## 📞 Recursos Adicionales

- [Vercel Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [Vercel DNS Records](https://vercel.com/docs/concepts/projects/domains/dns-records)
- [Supabase Custom Domain Guide](https://supabase.com/docs/guides/platform/custom-domains)

---

**Última actualización**: 10 de octubre de 2025  
**Dominio**: elquelo.eu  
**Plataforma**: Vercel  

