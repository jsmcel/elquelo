# Sistema Multi-Producto por QR

## 🎯 Objetivo

Permitir que **1 QR pueda tener múltiples productos** con diseños independientes.

**Antes**:
```
QR "ABC123" → 1 Camiseta (talla M, negro) → €23.50
```

**Ahora**:
```
QR "ABC123" 
  ├── Camiseta (M, negro) → €23.50
  ├── Sudadera (L, blanca) → €35.80
  └── Poster (A1) → €12.20
Total: €71.50
```

---

## 📊 Modelo de Datos

### Nuevo Formato (v2.0)

```typescript
{
  "version": "2.0",
  "qrCode": "ABC123",
  "lastUpdated": "2025-01-10T10:30:00.000Z",
  "products": [
    {
      "id": "uuid-1",
      "productId": 71,
      "templateId": 71,
      "variantId": 12345,
      "productName": "Unisex Staple T-Shirt",
      "size": "M",
      "color": "Black",
      "colorCode": "#000000",
      "designsByPlacement": {
        "front": "https://storage.../front.png",
        "back": "https://storage.../back.png"
      },
      "designMetadata": {...},
      "variantMockups": {...},
      "createdAt": "2025-01-10T10:00:00.000Z",
      "updatedAt": "2025-01-10T10:30:00.000Z"
    },
    {
      "id": "uuid-2",
      "productId": 380,
      ...
    }
  ]
}
```

### Formato Legacy (automáticamente migrado)

Los diseños antiguos (1 producto) se migran automáticamente al abrir el editor.

---

## 🖥️ Interfaz de Usuario

### 1. MultiProductDesignEditor

**Ubicación**: Se abre al hacer clic en "Editar diseño" en cualquier QR

**Características**:
- **Sidebar izquierdo**: Lista de productos del QR
- **Área principal**: Editor de diseño para el producto seleccionado
- **Botones**: Agregar, Editar, Eliminar productos

**Flujo de trabajo**:
```
1. Usuario hace clic en "Editar diseño" en QR
2. Se abre MultiProductDesignEditor
3. Usuario hace clic en "Agregar Producto"
4. Se abre PrintfulDesignEditor para configurar el producto
5. Usuario selecciona producto, talla, color
6. Usuario diseña el producto (sube imágenes, coloca QR)
7. Usuario hace clic en "Guardar" (guarda el producto)
8. Vuelve al MultiProductDesignEditor
9. Usuario puede agregar más productos o "Guardar Todo"
```

### 2. ProductListManager

Componente que muestra la lista de productos:
- Nombre del producto
- Talla y color
- Variant ID
- Botón para eliminar

### 3. ConfirmOrderButton

Ahora calcula precios considerando **todos los productos de todos los QRs**:

```
QR 1: 2 productos → €58.00
QR 2: 1 producto → €23.50
Total: €81.50
```

---

## 🔄 Migración Automática

Los diseños existentes se migran automáticamente cuando:
1. Se abre el editor
2. Se calcula el precio en ConfirmOrderButton

### Migración Manual (Opcional)

Si quieres migrar todos los diseños de una vez:

```bash
npm run migrate-designs
```

O directamente:

```bash
node scripts/migrate-designs-to-v2.mjs
```

Esto:
- Lee todos los diseños de la base de datos
- Convierte los que están en formato antiguo
- Actualiza la base de datos
- Muestra un resumen

---

## 💰 Cálculo de Precios

### Antes (Legacy)
```javascript
// 1 QR = 1 producto
precio = precioProducto * cantidadQRs
```

### Ahora (Multi-Producto)
```javascript
// 1 QR puede tener N productos
const allProducts = []

qrs.forEach(qr => {
  qr.products.forEach(product => {
    allProducts.push({
      variantId: product.variantId,
      price: getPriceFromAPI(product.variantId)
    })
  })
})

total = allProducts.reduce((sum, p) => sum + p.price, 0)
```

**Ejemplo**:
```
QR "ABC123":
  - Camiseta variantId 12345 → €23.50
  - Sudadera variantId 67890 → €35.80
  
QR "DEF456":
  - Poster variantId 11111 → €12.20

Total: €71.50
```

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos

| Archivo | Descripción |
|---------|-------------|
| `types/qr-product.ts` | Tipos TypeScript para productos |
| `components/MultiProductDesignEditor.tsx` | Editor multi-producto |
| `components/ProductListManager.tsx` | Lista de productos |
| `scripts/migrate-designs-to-v2.mjs` | Script de migración |

### Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `components/QRGenerator.tsx` | Usa `MultiProductDesignEditor` |
| `components/ConfirmOrderButton.tsx` | Calcula precios de múltiples productos |

---

## 🚀 Uso

### Para el Usuario Final

1. **Crear diseño**:
   - Ir a Dashboard
   - Hacer clic en "Editar diseño" en cualquier QR
   - Hacer clic en "Agregar Producto"
   - Seleccionar producto, talla, color
   - Diseñar el producto
   - Guardar
   - Repetir para agregar más productos al mismo QR

2. **Ver productos**:
   - La lista en el sidebar muestra todos los productos
   - Hacer clic en cualquiera para editarlo

3. **Confirmar pedido**:
   - El precio se calcula automáticamente
   - Muestra "X productos en Y QRs"
   - Total calculado con markup del 40%

---

## ✅ Validaciones

- ✅ Cada producto debe tener `variantId` válido
- ✅ Al menos 1 producto por QR para poder guardar
- ✅ No se puede guardar sin seleccionar talla y color
- ✅ Diseños legacy se migran automáticamente

---

## 🐛 Troubleshooting

### "No se pueden calcular los precios"
**Causa**: Diseños sin variantId
**Solución**: Editar el diseño y seleccionar talla y color

### "Solo aparece 1 producto en el editor"
**Causa**: El diseño es legacy
**Solución**: El sistema lo migra automáticamente. Refrescar la página.

### "El precio sigue siendo 58€"
**Causa**: Los productos no tienen variantId configurado
**Solución**: 
1. Abrir el editor de diseño
2. Para cada producto, seleccionar talla y color
3. Guardar
4. Los precios se calcularán correctamente

---

## 🎉 Beneficios

✅ **Flexibilidad**: 1 QR puede tener múltiples productos  
✅ **Escalable**: Fácil agregar más productos  
✅ **Retrocompatible**: Diseños antiguos funcionan automáticamente  
✅ **Precios Reales**: Calcula desde el catálogo con markup del 40%  
✅ **UX Mejorada**: Interfaz clara para gestionar productos  

---

## 📝 Notas Técnicas

- La migración es **no destructiva** (mantiene referencia al diseño original en `legacyDesign`)
- Los IDs de productos son UUIDs únicos
- El sistema soporta cantidad = 1 por producto (futuro: cantidad configurable)
- Los mockups se generan por producto independientemente

