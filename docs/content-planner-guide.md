# 📅 Guía del Content Planner

## 🎯 La Filosofía

El Content Planner separa **dos conceptos fundamentales**:

### 1. 📦 **Los Objetos** (Biblioteca de Contenido)
**QUÉ** vas a mostrar:
- Retos
- Mensajes
- Álbumes
- Microsite
- URLs externas

### 2. ⏰ **La Planificación** (Timeline de QRs)
**CUÁNDO** se va a mostrar cada objeto en cada QR

---

## 🎨 La Interfaz

### Layout

```
┌─────────────────────────────────────────────────────┐
│  📅 Planificador de Contenido                       │
│  Arrastra contenido desde biblioteca → Timeline     │
├────────────────┬───────────────────────────────────┤
│                │                                    │
│  📚 BIBLIOTECA │  📅 TIMELINE DE QRs               │
│                │                                    │
│  • Álbum       │  QR 418be880e8a6                  │
│  • Reto 1      │   ├─ 🟢 Microsite (ACTIVO)        │
│  • Reto 2      │   ├─ 🔵 Reto 1 (próximo)          │
│  • Mensaje 1   │   └─ ⚫ Álbum (terminado)         │
│  • Microsite   │                                    │
│                │  QR 05c68e375eb0                   │
│  [Buscar...]   │   └─ ⬅️ Arrastra aquí           │
│                │                                    │
│  Tab: Todo     │  QR 7c910bec6007                   │
│  Tab: Retos    │   ├─ 🟢 Reto 2 (ACTIVO)           │
│  Tab: Mensajes │   └─ 💜 Fallback permanente       │
│                │                                    │
└────────────────┴────────────────────────────────────┘
```

---

## 🖱️ Cómo Usar - Paso a Paso

### Paso 1: Preparar Contenido

**Antes de planificar, necesitas CREAR los objetos:**

1. **Retos:**
   ```
   Dashboard → Retos → Biblioteca de Retos → Añadir
   ```

2. **Mensajes:**
   ```
   Dashboard → Muro de Mensajes → Recolectar mensajes
   ```

3. **Álbum:**
   ```
   Dashboard → Álbum → Configurar
   ```

4. **Microsite:**
   ```
   Dashboard → Microsite → Elegir plantilla
   ```

### Paso 2: Abrir el Content Planner

```
Dashboard → Tu Evento → [Content Planner está en la parte superior]
```

### Paso 3: Drag & Drop

#### Arrastra desde Biblioteca (izquierda):

1. **Buscar** el contenido que quieres
   - Usa la barra de búsqueda
   - O filtra por tabs: Todo / Álbum / Mensajes / Retos / Enlaces

2. **Click y mantén** sobre el objeto
   - Aparecerá el icono de "grip" (≡)
   - El cursor cambia a "grab"

3. **Arrastra** hacia la derecha
   - Sobre el QR al que quieres asignar
   - El QR se iluminará en azul

4. **Suelta**
   - Se crea automáticamente un destino
   - El objeto aparece en la timeline del QR

### Paso 4: Ver y Editar Timeline

#### Expandir QR:
- Click en la flecha (>) al lado del código QR
- Se despliega la timeline completa

#### Visualización:
```
QR 418be880e8a6
├─ 📅 Viernes 20:00 → 23:59  [🟢 ACTIVO AHORA]
│  "Microsite con info del hotel"
│  → /e/evento-id/microsite
│  [Barra de progreso: ████████░░ 80%]
│
├─ 📅 Sábado 00:00 → 14:00   [🔵 PRÓXIMAMENTE]
│  "Reto: El brindis del desconocido"
│  → /e/evento-id/reto/reto-1
│
└─ 📅 Sábado 14:00 → ∞       [💜 PERMANENTE]
   "Álbum de fotos"
   → /e/evento-id/album
```

---

## 🎭 Estados Visuales

### Colores de Estado:

| Color | Emoji | Estado | Significado |
|-------|-------|--------|-------------|
| 🟢 Verde | Pulsante | **ACTIVO** | Está redirigiendo AHORA a este destino |
| 🔵 Azul | Estático | **PRÓXIMO** | Se activará en el futuro |
| ⚫ Gris | Opaco | **TERMINADO** | Ya pasó su fecha de fin |
| 💜 Morado | Brillante | **PERMANENTE** | Sin fechas, siempre disponible (fallback) |

### Indicadores:

- **Animación pulsante** = Destino activo en este momento
- **Barra de progreso** = Cuánto falta para que termine
- **Línea de tiempo vertical** = Orden cronológico

---

## 📊 Tipos de Objetos

### 1. 🎮 **Retos**
```
Biblioteca:
  [≡] 🏆 El brindis del desconocido
      prueba • 20 pts
      🖱️ Arrastra a un QR

→ Arrastra a QR →

Timeline:
  🎮 Reto: El brindis del desconocido
  → /e/evento-id/reto/reto-123
  📅 Sábado 00:00 → 14:00
```

### 2. 💬 **Mensajes**
```
Biblioteca:
  [≡] 💬 Mensaje de María
      mensaje
      🖱️ Arrastra a un QR

→ Arrastra a QR →

Timeline:
  💬 Mensaje: María
  → /e/evento-id/mensaje/msg-456
  📅 Domingo 10:00 → ∞
```

### 3. 📸 **Álbum**
```
Biblioteca:
  [≡] 📸 Álbum principal
      album
      🖱️ Arrastra a un QR

→ Arrastra a QR →

Timeline:
  📸 Álbum: Principal
  → /e/evento-id/album
  📅 Sábado 14:00 → ∞
```

### 4. 🌐 **Microsite**
```
Biblioteca:
  [≡] 🌐 Microsite del evento
      microsite
      🖱️ Arrastra a un QR

→ Arrastra a QR →

Timeline:
  🌐 Microsite del evento
  → /e/evento-id/microsite
  📅 Viernes 18:00 → Sábado 12:00
```

### 5. 🔗 **URL Externa**
```
Biblioteca:
  [≡] 🔗 URL personalizada
      url • editable
      🖱️ Arrastra a un QR

→ Arrastra a QR →

Timeline:
  🔗 Enlace externo
  → https://ejemplo.com
  📅 ∞ (permanente)
```

---

## 🎯 Casos de Uso Reales

### Caso 1: Despedida de Fin de Semana

**QR de la camiseta del homenajeado:**

```
BIBLIOTECA:              TIMELINE DEL QR:
─────────────           ────────────────────────────
📸 Álbum                Viernes 18:00 → 20:00
💬 Msg de Ana              🟢 Microsite (Info hotel)
💬 Msg de Luis          
🎮 Reto Brindis         Viernes 20:00 → 23:59
🎮 Reto Karaoke            🟢 Reto Brindis
🌐 Microsite            
                        Sábado 00:00 → 14:00
[≡] Arrastra aquí          🔵 Álbum de fotos
                        
                        Sábado 14:00 → 20:00
                           🔵 Reto Karaoke
                        
                        Sábado 20:00 → ∞
                           🔵 Mensajes sorpresa
```

**Flujo del participante:**

1. **Viernes 18:30** → Escanea QR → Ve microsite con info del hotel
2. **Viernes 21:00** → Escanea QR → Ve "Reto: El brindis"
3. **Sábado 10:00** → Escanea QR → Puede subir fotos al álbum
4. **Sábado 16:00** → Escanea QR → Ve "Reto: Karaoke"
5. **Sábado 22:00** → Escanea QR → Ve muro de mensajes sorpresa

---

### Caso 2: Búsqueda del Tesoro con QRs

**5 QRs ocultos en diferentes locales:**

```
QR 1 (Bar)                QR 2 (Restaurante)        QR 3 (Club)
─────────────            ────────────────────       ─────────────
20:00-21:00              21:00-22:00                22:00-23:00
🟢 Pista 1               🔵 Pista 2                 🔵 Pista 3
"Busca el QR            "Pregunta al               "Baila con
en el menú"             bartender"                 alguien"

QR 4 (Plaza)             QR 5 (Hotel)
─────────────            ────────────────────
23:00-00:00              00:00-∞
🔵 Pista 4               🔵 TESORO
"Foto con                "¡Video sorpresa
estatua"                 de todos!"
```

---

### Caso 3: QR Dinámico por Día

**Mismo QR físico, diferente contenido cada día:**

```
TIMELINE DEL QR 418be880:

Jueves (Pre-evento)
├─ 🟢 Microsite: Instrucciones de llegada
│  "Cómo llegar, qué traer, horarios"

Viernes (Día 1)
├─ 🔵 Reto del Día 1
│  "Conoce a todos los participantes"

Sábado (Día 2)
├─ 🔵 Reto del Día 2
│  "Actividad principal"

Domingo (Post-evento)
└─ 💜 Álbum de recuerdos
   "Sube tus mejores fotos"
```

---

## 💡 Tips y Mejores Prácticas

### ✅ DO:

1. **Prepara primero, planifica después**
   - Crea TODOS los retos antes de empezar a planificar
   - Así ves toda la biblioteca completa

2. **Usa destinos permanentes (sin fechas) como fallback**
   - Útil para cuando ningún otro destino está activo
   - Ej: Página de agradecimiento

3. **Deja gaps entre horarios**
   - No programa 20:00-22:00 y luego 22:00-23:00
   - Mejor: 20:00-21:59 y luego 22:00-23:00
   - Evita conflictos de segundos

4. **Prueba antes del evento**
   - Usa el botón "👁️ Ver" en cada QR
   - Verifica que redirige correctamente

5. **Ordena lógicamente**
   - El sistema ordena por fecha de inicio automáticamente
   - Pero tú puedes ajustar las fechas para cambiar el orden

### ❌ DON'T:

1. **No actives múltiples destinos simultáneos**
   - Solo uno debe estar activo a la vez
   - Si hay solapamiento, toma el de mayor prioridad

2. **No olvides asignar fechas**
   - Sin fechas = destino permanente
   - Puede causar confusión si no es intencional

3. **No borres contenido usado**
   - Si eliminas un reto, los QRs que lo usan fallarán
   - Desactiva en lugar de eliminar

4. **No confíes solo en el drag & drop**
   - Después de arrastrar, VERIFICA las fechas
   - Edita si es necesario

---

## 🔧 Troubleshooting

### "Arrastro pero no pasa nada"

**Posibles causas:**
1. El QR no está vinculado al evento
2. No sueltas sobre el QR (debe iluminarse azul)
3. El navegador no soporta drag & drop (prueba Chrome/Edge)

**Solución:**
- Verifica que ves el QR en la lista
- Asegúrate de soltar cuando el QR se ilumine
- Prueba en otro navegador

---

### "Tengo múltiples destinos activos"

**Problema:** Dos destinos con fechas solapadas

**Solución:**
1. Expande el QR
2. Desactiva uno de los destinos (botón ⏸️)
3. O ajusta las fechas para que no se solapen

---

### "El QR redirige al destino incorrecto"

**Posibles causas:**
1. Las fechas están mal configuradas
2. Hay un destino permanente con mayor prioridad

**Solución:**
1. Expande el QR y revisa la timeline
2. Verifica que el destino correcto tiene el 🟢 verde
3. Si no, ajusta fechas o prioridades

---

### "No veo el contenido en la biblioteca"

**Posibles causas:**
1. No has creado el contenido todavía
2. Estás en el tab incorrecto (Retos cuando buscas Mensajes)
3. El filtro de búsqueda está activo

**Solución:**
1. Ve a crear el contenido primero (Retos, Mensajes, etc.)
2. Cambia de tab o haz click en "Todo"
3. Limpia la barra de búsqueda

---

## 🚀 Flujo Completo de Trabajo

### 1. Preparación (1-2 días antes)

```
[ ] Crear retos desde la biblioteca
[ ] Configurar microsite con plantilla
[ ] Recolectar mensajes de invitados
[ ] Configurar álbum
[ ] Vincular QRs físicos al evento
```

### 2. Planificación (1 día antes)

```
[ ] Abrir Content Planner
[ ] Para cada QR físico:
    [ ] Arrastrar contenido de la biblioteca
    [ ] Configurar fechas/horarios
    [ ] Verificar con "👁️ Ver"
[ ] Probar escaneo de QR real con móvil
```

### 3. Durante el Evento

```
[ ] Monitorear en tiempo real qué destino está activo
[ ] Ver escaneos en la tabla de QRs
[ ] Aprobar fotos/mensajes si es necesario
```

### 4. Post-Evento

```
[ ] Cambiar todos los QRs a "Álbum de recuerdos"
[ ] O a página de agradecimiento
[ ] Exportar estadísticas
```

---

## 🎨 Personalización Avanzada

### Prioridades

Si tienes múltiples destinos activos simultáneamente, el sistema elige por:

1. **Prioridad** (número mayor = más prioridad)
2. **Fecha específica** (con fechas > sin fechas)
3. **Orden de creación** (más nuevo > más viejo)

---

## 📞 Soporte

¿Dudas? ¿Ideas?
- GitHub Issues
- Email: support@elquelo.com

---

**¡Domina el Content Planner y crea experiencias inolvidables!** 🎉




