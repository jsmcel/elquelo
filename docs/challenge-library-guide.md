# 📚 Guía de la Biblioteca de Retos

## Resumen

La biblioteca de retos proporciona **40+ retos predefinidos** específicamente diseñados para despedidas de soltero/a, con soporte para códigos QR integrados en las camisetas.

## 🎯 Categorías de Retos

### 1. **Social** 👥
Retos de interacción con otras personas
- Conocer desconocidos
- Conseguir números de teléfono
- Entrevistas improvisadas
- **Puntos:** 50-100

### 2. **Foto** 📸
Retos fotográficos creativos
- Fotos con uniformes
- Selfies en altura
- Recrear fotos antiguas
- **Puntos:** 40-100

### 3. **Beber** 🍺
Retos relacionados con bebidas (consumo responsable)
- Chupitos con desconocidos
- Bartender por un minuto
- Brindis épicos
- **Puntos:** 50-150

### 4. **Baile** 💃
Retos de baile y movimiento
- TikTok challenges
- Batallas de baile
- Slow motion
- **Puntos:** 60-150

### 5. **Atrevido** 🔥
Retos que requieren valentía
- Discursos en público
- Piropos originales
- Karaoke improvisado
- **Puntos:** 80-150

### 6. **Creativo** 🎨
Retos artísticos y creativos
- Poemas improvisados
- Arte con servilletas
- Hashtags virales
- **Puntos:** 70-120

### 7. **QR Especial** 📱
**Retos que usan los QRs de las camisetas**
- Cazador de QRs
- QR en movimiento
- Coleccionista de QRs
- QR selfie chain
- Búsqueda del tesoro QR
- **Puntos:** 80-300

---

## 🎮 Cómo Usar los Retos con QR

### Ejemplo 1: "QR en movimiento"
```
Objetivo: Hacer que alguien escanee tu QR mientras bailas
Uso del QR: El QR de la camiseta del participante
Dificultad: Medio
Puntos: 100

Instrucciones:
1. Participante empieza a bailar
2. Sin parar de moverse, otra persona debe escanear el QR de su camiseta
3. Grabar video como prueba
4. El QR redirige a contenido sorpresa
```

### Ejemplo 2: "Búsqueda del tesoro QR"
```
Objetivo: Seguir cadena de QRs ocultos
Uso del QR: Múltiples QRs impresos y ocultos
Dificultad: Difícil
Puntos: 300

Setup del organizador:
1. Imprime 5 QRs adicionales (o usa stickers)
2. Cada QR redirige al siguiente con pista
3. Oculta QRs en: baño del bar, debajo de una mesa, detrás del menú, etc.
4. Último QR lleva a "tesoro" (foto o video sorpresa)

Flujo:
QR 1 → "Busca donde se lavan las manos" →
QR 2 → "Mira bajo la mesa del fondo" →
QR 3 → "Pide al bartender el menú especial" →
QR 4 → "Pregunta al DJ por la canción perdida" →
QR 5 → TESORO (video mensaje de amigo ausente)
```

### Ejemplo 3: "Coleccionista de QRs"
```
Objetivo: Escanear QRs de 5 personas del grupo
Uso del QR: QRs de las camisetas de otros participantes
Dificultad: Medio
Puntos: 150

Mecánica:
- Cada camiseta tiene un QR único
- Al escanear, redirige a perfil/foto de esa persona
- Coleccionar 5 QRs diferentes
- Hacer foto de cada escaneo como prueba
- Cada QR puede tener contenido personalizado (playlist favorita, foto embarazosa, etc.)
```

---

## 🛠️ Implementación Técnica

### Estructura de un Reto

```typescript
{
  id: 'qr-1',
  title: 'Cazador de QRs',
  description: 'Encuentra y escanea el QR oculto...',
  category: 'qr_especial',
  points: 200,
  duration: 30, // minutos
  requiresProof: true,
  proofType: 'photo',
  difficulty: 'dificil',
  usesQR: true, // ✅ Marca que usa QR
  qrInstruction: 'Pega este QR en un lugar secreto' // Instrucción para organizador
}
```

### Drag & Drop

```tsx
// El organizador puede:
1. Arrastrar reto desde biblioteca → Lista de retos activos
2. Click en reto → Se añade automáticamente
3. Editar reto después de añadir
4. Ver instrucciones específicas de QR
```

### Filtros Disponibles

- **Por categoría:** Social, Foto, Beber, Baile, etc.
- **Por dificultad:** Fácil, Medio, Difícil
- **Solo con QR:** Ver solo retos que usan QR
- **Búsqueda:** Por título o descripción

---

## 💡 Ideas de Implementación de QRs

### Setup Básico (Sin QRs extra)
```
✅ Usa solo los QRs de las camisetas
✅ Cada participante tiene su QR único
✅ Retos: "QR en movimiento", "Coleccionista", "QR sorpresa"
✅ No requiere preparación extra
```

### Setup Avanzado (Con QRs extra)
```
📱 Imprime 5-10 QRs adicionales
📍 Esconde QRs en locales del itinerario
🗺️ Crea búsquedas del tesoro
🎯 QRs con contenido programado (se activan a ciertas horas)
```

### QRs Dinámicos en Camisetas

Cada QR de camiseta puede:
- Cambiar de destino durante el evento
- Mostrar perfil personalizado del participante
- Llevar a playlist personal
- Mostrar contador de escaneos
- Revelar contenido a medianoche (mensajes sorpresa)

---

## 📊 Sistema de Puntos

### Por Dificultad
- **Fácil:** 40-70 puntos
- **Medio:** 70-120 puntos
- **Difícil:** 120-300 puntos

### Multiplicadores Sugeridos
```typescript
Completar reto dentro del tiempo: +20%
Primera persona en completarlo: +50%
Reto QR especial completado: +30%
Video especialmente divertido: +bonus discrecional
```

---

## 🎯 Flujo Completo de Uso

### Para el Organizador:

1. **Configuración Previa:**
   ```
   - Ir a /dashboard/despedida/[eventId]/retos
   - Activar módulo de retos
   - Configurar puntos/equipos/pruebas
   ```

2. **Selección de Retos:**
   ```
   - Ver biblioteca con 40+ retos
   - Filtrar por categoría/dificultad
   - Hacer clic o arrastrar retos deseados
   - Los retos se añaden a lista activa
   ```

3. **Asignación de QRs:**
   ```
   - Ir a "QRs y destinos" en panel
   - Asignar QR específico a cada reto
   - QR 1 → Reto "QR en movimiento"
   - QR 2 → Reto "Cazador de QRs"
   - etc.
   ```

4. **Durante el Evento:**
   ```
   - Participantes escanean QRs
   - Ven descripción del reto
   - Completan y suben prueba
   - Admin aprueba desde panel
   - Puntos se asignan automáticamente
   ```

### Para los Participantes:

1. **Ver Reto:**
   ```
   Escanear QR → Ver reto → Leer instrucciones
   ```

2. **Completar:**
   ```
   Hacer reto → Grabar/fotografiar prueba → Subir
   ```

3. **Verificar:**
   ```
   Ver ranking en tiempo real → Competir por puntos
   ```

---

## 📝 Mejores Prácticas

### ✅ DO:
- Mezcla retos fáciles y difíciles
- Incluye al menos 3-4 retos con QR
- Ten QRs extras preparados si vas a hacer búsqueda del tesoro
- Prueba escanear los QRs antes del evento
- Ten contenido sorpresa en destinos QR (videos, fotos)

### ❌ DON'T:
- No pongas solo retos difíciles (frustra)
- No ocultes QRs en lugares peligrosos
- No olvides configurar destinos antes del evento
- No uses retos de beber si hay menores

---

## 🔮 Próximas Features

Ideas para expandir:
- [ ] Retos desbloqueables (completar X para desbloquear Y)
- [ ] Retos por equipos vs individuales
- [ ] Retos con límite de tiempo en vivo
- [ ] Notificaciones push cuando se completa reto
- [ ] Leaderboard en tiempo real público
- [ ] Badges por categorías (Master de baile, Rey social, etc.)
- [ ] Integración con Instagram Stories

---

## 📞 Soporte

¿Tienes ideas para nuevos retos? ¿Encontraste un bug?
- GitHub Issues
- Email: support@elquelo.com

---

**¡Que comience la diversión!** 🎉



