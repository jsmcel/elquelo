# 🔒 Guía de Seguridad - Variables de Entorno

## ⚠️ IMPORTANTE: Nunca commits claves o tokens

### ❌ NUNCA HAGAS ESTO:
```javascript
// ❌ MALO - Clave hardcodeada
const supabase = createClient(
  'https://xyz.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // NUNCA!
)
```

### ✅ HAZ ESTO:
```javascript
// ✅ BUENO - Usando variables de entorno
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
```

## 🔧 Configuración Segura

### 1. Variables de Entorno Requeridas

Crea un archivo `.env.local` (que está en .gitignore):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Printful
PRINTFUL_API_KEY=tu_printful_api_key

# QR Domain
QR_DOMAIN=lql.to
```

### 2. Para Scripts de Node.js

Los scripts que usan Supabase deben cargar las variables de entorno:

```javascript
// ✅ BUENO
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
```

### 3. Archivos que NUNCA deben subirse a Git

- `.env`
- `.env.local`
- `.env.production`
- `env_*.txt`
- `env_*.js`
- Cualquier archivo con claves hardcodeadas

## 🚨 Si accidentalmente commiteaste una clave:

### 1. Inmediatamente:
- **Revoca la clave** en el dashboard de Supabase/Stripe
- **Genera una nueva clave**
- **Actualiza todas las variables de entorno**

### 2. Limpia el historial de Git:
```bash
# Elimina el archivo del historial completo
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch path/to/file' \
  --prune-empty --tag-name-filter cat -- --all

# Fuerza push (CUIDADO: esto reescribe la historia)
git push origin --force --all
```

### 3. Verifica que no queden rastros:
```bash
# Busca claves en todo el historial
git log --all --full-history -- path/to/file
```

## 🔍 Comandos de Verificación

### Buscar claves hardcodeadas:
```bash
# Buscar tokens JWT
grep -r "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" .

# Buscar claves de Stripe
grep -r "sk_test_\|pk_test_\|whsec_" .

# Buscar URLs de Supabase
grep -r "supabase\.co" .
```

### Verificar archivos en .gitignore:
```bash
git check-ignore env_*.txt
git check-ignore .env*
```

## 📝 Mejores Prácticas

1. **Siempre usa variables de entorno** para claves y tokens
2. **Nunca hardcodees** claves en el código
3. **Usa diferentes claves** para desarrollo y producción
4. **Revoca inmediatamente** cualquier clave comprometida
5. **Monitorea** el uso de tus claves regularmente
6. **Usa .gitignore** para excluir archivos sensibles
7. **Revisa** todos los commits antes de hacer push

## 🆘 Contacto de Emergencia

Si encuentras una clave comprometida:
1. Revoca la clave inmediatamente
2. Genera una nueva clave
3. Actualiza todas las variables de entorno
4. Limpia el historial de Git si es necesario

---

**Recuerda: La seguridad es responsabilidad de todos. Cuando en duda, pregunta antes de commitear.**
