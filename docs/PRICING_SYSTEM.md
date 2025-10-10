# Sistema de Precios con Markup Automático

## 📊 Cómo Funciona

El sistema calcula los precios automáticamente basándose en los productos de Printful con un **markup del 40%**.

### Flujo de Cálculo

```
1. Usuario diseña producto en PrintfulDesignEditor
   ↓
2. Se guarda el diseño con variantId de Printful
   ↓
3. ConfirmOrderButton carga los diseños guardados
   ↓
4. Se extraen los variantIds
   ↓
5. Endpoint /api/printful/variants/price calcula:
   - Busca precio USD en el catálogo JSON
   - Convierte USD → EUR (tipo cambio: 0.92)
   - Aplica markup del 40%
   ↓
6. Se muestra el precio total calculado
```

## 🔧 Componentes

### 1. Endpoint de Precios
**Archivo**: `app/api/printful/variants/price/route.ts`

```typescript
POST /api/printful/variants/price
Body: { variantIds: [12345, 67890] }

Response: {
  success: true,
  prices: {
    12345: {
      basePrice: 18.50,    // Precio base en EUR
      finalPrice: 25.90,   // Con markup 40%
      currency: "EUR"
    }
  },
  markup: 40
}
```

**Configuración**:
- Catálogo: `mocks/printful-catalog-full.json`
- Cache catálogo: 15 minutos
- Tipo de cambio USD→EUR: **Automático** desde Frankfurter API (Banco Central Europeo)
- Cache tipo de cambio: 24 horas
- Tipo de cambio fallback: **0.92** (si falla la API)
- Markup: **40%** (editable en línea 6)

### 2. ConfirmOrderButton Mejorado
**Archivo**: `components/ConfirmOrderButton.tsx`

**Características**:
- ✅ Carga automática de diseños al montar
- ✅ Cálculo de precios desde el catálogo
- ✅ Spinner mientras calcula
- ✅ Fallback a 29€ si no hay diseño o error
- ✅ Muestra "Incluye markup 40%" en la UI

## 📈 Ejemplo de Cálculo

```
Producto: Unisex Staple T-Shirt
Variant: XL, Black
Precio Printful (USD): $18.50

Paso 1: Obtener tipo de cambio del día
API Frankfurter → 1 USD = 0.9245 EUR

Paso 2: Convertir a EUR
$18.50 × 0.9245 = €17.10

Paso 3: Aplicar markup 40%
€17.10 × 1.40 = €23.94

Precio final al cliente: €23.94
```

## ⚙️ Configuración

### Cambiar el Markup

Edita `app/api/printful/variants/price/route.ts` línea 6:

```typescript
const MARKUP_PERCENTAGE = 40 // Cambiar aquí (ej: 50 para 50%)
```

### Cambiar el Tipo de Cambio Fallback

El tipo de cambio se obtiene automáticamente de la API de Frankfurter (Banco Central Europeo).

Si quieres cambiar el **valor fallback** (usado si falla la API), edita `app/api/printful/variants/price/route.ts` línea 7:

```typescript
const FALLBACK_EXCHANGE_RATE = 0.92  // ← Cambiar fallback aquí
```

**Nota**: El tipo de cambio real se actualiza automáticamente cada 24 horas desde la API.

### Cambiar el Precio Fallback

Si no hay diseño guardado o hay error, se usa un precio por defecto.

Edita `components/ConfirmOrderButton.tsx` líneas 66, 92, 115:

```typescript
price: 29 // Cambiar aquí
```

## 🔍 Debug

Para ver los precios calculados en consola:

```typescript
// En ConfirmOrderButton.tsx después de obtener precios:
console.log('Precios calculados:', prices)
console.log('Designs con precios:', designsWithPrices)
console.log('Total:', total)
```

## 🚨 Casos Especiales

### QR sin Diseño Guardado
- **Comportamiento**: Usa precio fallback de 29€
- **Razón**: No hay variantId para consultar

### Error en Catálogo
- **Comportamiento**: Usa precio fallback de 29€
- **Razón**: El catálogo no está disponible o no se encuentra la variante

### Error de Red
- **Comportamiento**: Usa precio fallback de 29€
- **Razón**: No se pudo conectar al endpoint de precios

## 📝 Notas

- Los precios se cachean 15 minutos para mejorar rendimiento
- El catálogo se actualiza automáticamente cada día a las 3:00 AM UTC (GitHub Action)
- El tipo de cambio se obtiene automáticamente de Frankfurter API (datos del BCE)
- El tipo de cambio se cachea 24 horas y se actualiza automáticamente
- Los precios en el checkout de Stripe usan los precios calculados con tipo de cambio real
- Si falla la API de tipo de cambio, usa el valor fallback (0.92)

## 🔄 Actualizar Manualmente

### Actualizar Catálogo de Productos

1. Ve a GitHub → Actions → "Update Printful Catalog"
2. Click "Run workflow"
3. Espera 5-10 minutos
4. El catálogo se actualizará automáticamente

### Ver Tipo de Cambio Actual

Puedes consultar el tipo de cambio actual que está usando el sistema:

```bash
GET https://elquelo.eu/api/exchange-rate
```

Respuesta:
```json
{
  "success": true,
  "rate": 0.9245,
  "from": "USD",
  "to": "EUR",
  "source": "api",
  "cachedAt": "2025-01-10T10:30:00.000Z",
  "expiresIn": 82800000
}
```

### Fuente del Tipo de Cambio

- **API**: Frankfurter (https://www.frankfurter.app)
- **Datos**: Banco Central Europeo
- **Actualización**: Cada 24 horas automáticamente
- **Gratuito**: Sin límite de requests

