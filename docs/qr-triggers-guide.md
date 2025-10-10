# 🔗 Guía de QR Triggers (Dependencias)

## 🎯 ¿Qué son los Triggers?

Los **Triggers** son acciones automáticas que ocurren en UN QR cuando OTRO QR se escanea.

Es como el sistema de **quest chains** en videojuegos:
- Completas misión A
- Se desbloquea misión B
- Que desbloquea misión C

---

## 💡 Casos de Uso Reales

### Caso 1: **"Que una desconocida te lea el QR"**

**Setup:**

```
QR del Novio (Camiseta)
  └─ Destino actual: Reto "Busca una desconocida que te lea el QR"

QR de María (Camiseta)  
  └─ Destino actual: Microsite (info básica)
  └─ Destino inactivo: Video mensaje sorpresa
```

**Trigger configurado:**

```
EN: Reto "Busca una desconocida..."
CUANDO: Se escanee este destino
ENTONCES: Activar "Video mensaje sorpresa" en QR de María
```

**Flujo:**

1. Novio pide a desconocida que escanee su QR
2. Desconocida escanea → Ve el reto
3. **🔥 TRIGGER SE EJECUTA AUTOMÁTICAMENTE**
4. QR de María cambia de Microsite → Video sorpresa
5. María escanea su QR → Ve el video mensaje

---

### Caso 2: **Búsqueda del Tesoro Colaborativa**

**Setup: 5 personas deben escanear para desbloquear el tesoro**

```
QR Ana (Pista 1)
  Trigger: "Al escanear → Contar"

QR Luis (Pista 2)
  Trigger: "Al escanear → Contar"

QR Pedro (Pista 3)
  Trigger: "Al escanear → Contar"

QR María (Pista 4)
  Trigger: "Al escanear → Contar"

QR Juan (Pista 5)
  Trigger: "Tras 5 escaneos → Activar TESORO en QR del Novio"
```

**Flujo:**

1. Ana escanea (1/5)
2. Luis escanea (2/5)
3. Pedro escanea (3/5)
4. María escanea (4/5)
5. Juan escanea (5/5) → **🎉 TESORO DESBLOQUEADO**
6. QR del novio cambia a video sorpresa de todos

---

### Caso 3: **Cadena de Retos**

```
QR 1: Reto "Conseguir 3 números de desconocid@s"
  Trigger: Al completar → Activar Reto 2 en QR 2

QR 2: Reto "Bailar Macarena en público"
  Trigger: Al completar → Activar Reto 3 en QR 3

QR 3: Reto "Karaoke de Rosalía"
  Trigger: Al completar → Activar Premio Final
```

---

## 🛠️ Cómo Configurar

### Paso 1: Ir al Scheduler del QR

```
Dashboard → Tu Evento → QRs y destinos
→ Expandir QR → Ver timeline
→ Expandir destino específico
```

### Paso 2: Añadir Trigger

1. Click en **"+ Añadir"** en la sección "Triggers"
2. Configurar:

```
┌─────────────────────────────────────┐
│ ¿Cuándo activar?                    │
│ ○ Al escanear este destino          │
│ ○ Al completar este reto            │
│ ○ Tras X escaneos                   │
├─────────────────────────────────────┤
│ ¿Qué QR afectar?                    │
│ [Selecciona QR...▼]                 │
│   QR 05c68e375eb0                   │
│   QR 7c910bec6007                   │
├─────────────────────────────────────┤
│ ¿Qué hacer?                         │
│ ○ Activar un destino específico     │
│ ○ Cambiar al siguiente destino      │
│ ○ Desactivar destino actual         │
├─────────────────────────────────────┤
│ ¿Qué destino activar?               │
│ [Video sorpresa▼]                   │
└─────────────────────────────────────┘
    [Cancelar]  [Añadir Trigger]
```

### Paso 3: Guardar

Click en **"Guardar Triggers"**

---

## 📋 Tipos de Triggers

### 1. **on_scan** (Al escanear)

```
CUANDO: Alguien escanea este destino
ENTONCES: Ejecutar acción
```

**Ejemplo:**
```
Destino: "Reto del novio"
Trigger: Al escanear → Activar "Mensaje sorpresa" en QR de María
```

---

### 2. **on_complete** (Al completar reto)

```
CUANDO: Se marca el reto como completado
ENTONCES: Ejecutar acción
```

**Ejemplo:**
```
Destino: "Reto 1: Brindis"
Trigger: Al completar → Activar "Reto 2" en otro QR
```

---

### 3. **on_count** (Tras X escaneos)

```
CUANDO: El QR alcanza X escaneos totales
ENTONCES: Ejecutar acción
```

**Ejemplo:**
```
Destino: "Coleccionista"
Trigger: Tras 10 escaneos → Desbloquear premio
```

---

## ⚡ Acciones Disponibles

### 1. **activate** (Activar destino)

Activa un destino específico en otro QR.

```
QR A se escanea
  ↓
Activa "Video sorpresa" en QR B
```

**Usa cuando:** Quieres desbloquear contenido nuevo.

---

### 2. **deactivate** (Desactivar)

Desactiva el destino actual de otro QR.

```
QR A se escanea
  ↓
Desactiva destino actual de QR B
  ↓
QR B queda sin redirección (404 o fallback)
```

**Usa cuando:** Quieres "bloquear" un QR temporalmente.

---

### 3. **switch** (Cambiar)

Desactiva el destino actual Y activa uno nuevo.

```
QR A se escanea
  ↓
QR B cambia de Microsite → Reto
```

**Usa cuando:** Quieres cambiar completamente el contenido de un QR.

---

## 🎮 Mecánicas Avanzadas

### Mecánica 1: **Countdown Colaborativo**

```
Necesitas que 5 QRs se escaneen para desbloquear algo.

QR 1-4: Sin trigger especial
QR 5: Trigger "Tras 5 escaneos totales del grupo → Desbloquear"
```

**Implementación:**

1. Crea un QR "maestro" que cuenta
2. Otros QRs incrementan el contador
3. Al llegar a 5 → Trigger se ejecuta

---

### Mecánica 2: **Árbol de Decisiones**

```
QR Inicio
  ├─ Opción A → Activa QR Ruta A
  └─ Opción B → Activa QR Ruta B

QR Ruta A
  └─ Lleva a Final A

QR Ruta B
  └─ Lleva a Final B
```

---

### Mecánica 3: **Mystery Box**

```
QR Misterioso
  Trigger: Al escanear → Activar destino ALEATORIO en otro QR
  
Posibilidades:
  - 50%: Reto fácil
  - 30%: Reto difícil
  - 20%: Premio directo
```

*(Esto requeriría lógica custom en la función SQL)*

---

## 🔒 Casos de Uso por Tipo de Evento

### Despedida de Soltero/a

```
1. "Keeper of Secrets"
   - Cada amigo tiene un QR
   - Al escanear, activan parte de mensaje secreto
   - Cuando todos lo hacen → Mensaje completo se revela

2. "Chain Reaction"
   - Retos encadenados
   - Solo puedes hacer tu reto después del anterior

3. "Unlock the Party"
   - QRs ocultos en el bar
   - Encontrar 3 → Desbloquea ubicación del after party
```

---

### Boda

```
1. "Messages Unlock"
   - Invitados escanean durante la ceremonia
   - Tras 50 escaneos → Video sorpresa en pantalla gigante

2. "Table Quest"
   - Cada mesa tiene un QR
   - Completar reto de mesa → Desbloquea postre especial
```

---

### Cumpleaños

```
1. "Birthday Countdown"
   - Cada hora, un QR nuevo se activa
   - Al final del día → Todos juntos forman mensaje

2. "Friend Relay"
   - Amigo 1 escanea → Activa para Amigo 2
   - Amigo 2 escanea → Activa para Amigo 3
   - ...hasta el cumpleañero
```

---

## 🐛 Troubleshooting

### "El trigger no se ejecuta"

**Posibles causas:**

1. El trigger está mal configurado
2. La condición no se cumple (ej: esperabas 5 escaneos pero solo hay 3)
3. El destino objetivo no existe
4. El QR objetivo no está vinculado al evento

**Solución:**

1. Revisa los logs del servidor al escanear
2. Verifica que el destino objetivo existe y está inactivo
3. Confirma que el trigger está guardado (ver JSON en BD)

---

### "Se activan múltiples destinos"

**Problema:** Varios triggers se ejecutan a la vez

**Solución:**

- Los triggers son acumulativos
- Si quieres exclusividad, usa acción `switch` en lugar de `activate`
- O añade lógica de "desactivar otros primero"

---

### "Quiero resetear todo"

**Solución:**

1. Ir a cada destino
2. Eliminar todos los triggers
3. O desactivar todos los destinos manualmente
4. Empezar de nuevo

---

## 💡 Tips y Mejores Prácticas

### ✅ DO:

1. **Documenta tu cadena**
   ```
   QR A → QR B → QR C → Final
   ```
   Dibuja un diagrama antes de configurar

2. **Prueba el flujo completo**
   - Escanea cada QR en orden
   - Verifica que los triggers se ejecutan
   - Usa varios dispositivos para simular múltiples usuarios

3. **Usa nombres descriptivos**
   ```
   ❌ "Destino 1", "Destino 2"
   ✅ "Reto inicio", "Video desbloqueado tras reto"
   ```

4. **Trigger visual feedback**
   - Los participantes deben saber que algo cambió
   - Añade instrucciones: "¡Ahora escanea el QR de María!"

### ❌ DON'T:

1. **No crees loops infinitos**
   ```
   QR A activa QR B
   QR B activa QR A
   → LOOP INFINITO ❌
   ```

2. **No dependas de orden exacto si no es necesario**
   - La gente puede escanear en desorden
   - Usa contadores en lugar de secuencias estrictas

3. **No olvides el fallback**
   - ¿Qué pasa si alguien escanea antes de tiempo?
   - Siempre ten un destino "por defecto"

---

## 🚀 Próximas Features

Ideas en desarrollo:

- [ ] Triggers con delay (activar después de X minutos)
- [ ] Triggers condicionales (solo si es de noche)
- [ ] Triggers aleatorios (probabilidades)
- [ ] Triggers por ubicación GPS
- [ ] Notificaciones push cuando se activa un trigger
- [ ] Dashboard en tiempo real de triggers ejecutados

---

## 📞 Soporte

¿Dudas? ¿Ideas de mecánicas?
- GitHub Issues
- Email: support@elquelo.com

---

**¡Crea experiencias interactivas épicas con QR Triggers!** 🎮🔥




