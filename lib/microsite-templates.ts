// Biblioteca de plantillas de microsites para despedidas

export type MicrositeTemplate = {
  id: string
  name: string
  description: string
  category: 'clasico' | 'divertido' | 'elegante' | 'aventura' | 'tematico'
  preview: string
  sections: MicrositeSection[]
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  fonts: {
    heading: string
    body: string
  }
  icon: string
}

export type MicrositeSection = {
  id: string
  type: 'hero' | 'countdown' | 'agenda' | 'ubicacion' | 'dress_code' | 'gallery' | 'rules' | 'team' | 'trivia' | 'poll' | 'map' | 'faq' | 'contact' | 'custom'
  title: string
  content: string
  order: number
  settings?: Record<string, any>
}

export const MICROSITE_TEMPLATES: MicrositeTemplate[] = [
  // PLANTILLA 1: CLÁSICA ELEGANTE
  {
    id: 'clasico-elegante',
    name: 'Elegancia Atemporal',
    description: 'Microsite clásico y sofisticado con toda la info esencial',
    category: 'clasico',
    preview: '🎩',
    icon: '🎩',
    colors: {
      primary: '#1a202c',
      secondary: '#2d3748',
      accent: '#d4af37',
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Inter',
    },
    sections: [
      {
        id: 'hero-1',
        type: 'hero',
        title: 'Despedida de [NOMBRE]',
        content: 'Un fin de semana inolvidable',
        order: 0,
        settings: {
          imageUrl: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=1200',
          overlay: true,
          textAlign: 'center',
        }
      },
      {
        id: 'countdown-1',
        type: 'countdown',
        title: 'Cuenta Atrás',
        content: 'Faltan X días para el gran día',
        order: 1,
        settings: {
          targetDate: '',
          showDays: true,
          showHours: true,
        }
      },
      {
        id: 'agenda-1',
        type: 'agenda',
        title: 'Agenda del Fin de Semana',
        content: `Viernes 20:00 - Cena de bienvenida en [Restaurante]
Sábado 10:00 - Actividad sorpresa
Sábado 14:00 - Comida en [Lugar]
Sábado 18:00 - Tiempo libre
Sábado 23:00 - Fiesta nocturna
Domingo 12:00 - Brunch de despedida`,
        order: 2,
      },
      {
        id: 'ubicacion-1',
        type: 'ubicacion',
        title: 'Dónde Nos Alojamos',
        content: '[Hotel Name]\n[Dirección]\n\nCheck-in: Viernes 16:00\nCheck-out: Domingo 12:00',
        order: 3,
        settings: {
          mapsUrl: 'https://maps.google.com',
          showMap: true,
        }
      },
      {
        id: 'dress-1',
        type: 'dress_code',
        title: 'Dress Code',
        content: `Viernes (Cena): Smart Casual
Sábado (Día): Casual/Deportivo
Sábado (Noche): Elegante Sport
Domingo: Casual`,
        order: 4,
      },
      {
        id: 'contact-1',
        type: 'contact',
        title: 'Contacto',
        content: 'Organizador: [Nombre]\nTeléfono: [Número]\nWhatsApp: [Link]',
        order: 5,
      },
    ],
  },

  // PLANTILLA 2: PARTY ANIMAL
  {
    id: 'party-animal',
    name: 'Party Animal 🎉',
    description: 'Microsite divertido y colorido para los más fiesteros',
    category: 'divertido',
    preview: '🎉',
    icon: '🎉',
    colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#fbbf24',
    },
    fonts: {
      heading: 'Fredoka One',
      body: 'Nunito',
    },
    sections: [
      {
        id: 'hero-2',
        type: 'hero',
        title: '🎊 ¡LA ÚLTIMA NOCHE DE LIBERTAD! 🎊',
        content: 'Despedida épica de [NOMBRE]',
        order: 0,
        settings: {
          imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200',
          overlay: true,
          animation: 'bounce',
        }
      },
      {
        id: 'rules-1',
        type: 'rules',
        title: '📜 Las Reglas del Juego',
        content: `1. Lo que pasa en la despedida, se queda en la despedida
2. El homenajeado/a tiene que hacer todos los retos
3. Fotos y videos son OBLIGATORIOS
4. El que llegue tarde paga ronda
5. Nada de hablar de trabajo
6. Drink responsibly (pero drink!)
7. ¡DIVERTIRSE ES OBLIGATORIO!`,
        order: 1,
      },
      {
        id: 'countdown-2',
        type: 'countdown',
        title: '⏰ Cuenta Regresiva',
        content: '¡El momento se acerca!',
        order: 2,
      },
      {
        id: 'agenda-2',
        type: 'agenda',
        title: '🗓️ Plan de Ataque',
        content: `🍕 20:00 - Pre-party Pizza & Drinks
🎮 22:00 - Gaming Tournament
🍻 00:00 - Bar Crawl
🕺 02:00 - Club Time
🌅 05:00 - After Party (los valientes)
😴 12:00 - Recovery Brunch`,
        order: 3,
      },
      {
        id: 'trivia-1',
        type: 'trivia',
        title: '🎯 Trivia del Homenajeado',
        content: `¿Cuánto conoces a [NOMBRE]?
- ¿Su primera novia/novio?
- ¿Peor borrachera?
- ¿Hobby secreto?
- ¿Mayor vergüenza?`,
        order: 4,
      },
      {
        id: 'gallery-1',
        type: 'gallery',
        title: '📸 Galería de la Vergüenza',
        content: 'Fotos épicas de [NOMBRE] a través de los años',
        order: 5,
        settings: {
          columns: 3,
          lightbox: true,
        }
      },
    ],
  },

  // PLANTILLA 3: AVENTURA OUTDOOR
  {
    id: 'outdoor-adventure',
    name: 'Aventura Extrema',
    description: 'Para despedidas llenas de adrenalina y naturaleza',
    category: 'aventura',
    preview: '🏔️',
    icon: '🏔️',
    colors: {
      primary: '#065f46',
      secondary: '#059669',
      accent: '#f59e0b',
    },
    fonts: {
      heading: 'Montserrat',
      body: 'Roboto',
    },
    sections: [
      {
        id: 'hero-3',
        type: 'hero',
        title: '🏔️ AVENTURA ÉPICA',
        content: 'Despedida de [NOMBRE] - Edición Supervivencia',
        order: 0,
        settings: {
          imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200',
          overlay: true,
        }
      },
      {
        id: 'agenda-3',
        type: 'agenda',
        title: '🗺️ Itinerario de Aventuras',
        content: `Sábado
08:00 - Salida desde [Ciudad]
10:00 - Llegada al campamento base
11:00 - Trekking a cascada
14:00 - BBQ en la montaña
16:00 - Rafting / Tirolina
19:00 - Fogata y cervezas
22:00 - Acampada (o hotel para los débiles)

Domingo
07:00 - Desayuno campestre
09:00 - Ruta en bici / Kayak
12:00 - Comida final
15:00 - Regreso`,
        order: 1,
      },
      {
        id: 'rules-2',
        type: 'rules',
        title: '⚠️ Equipo Necesario',
        content: `IMPRESCINDIBLE:
✅ Ropa deportiva cómoda
✅ Zapatillas de trekking
✅ Bañador
✅ Protector solar
✅ Repelente de insectos
✅ Botella de agua reutilizable
✅ Cargador portátil
✅ Medicamentos personales

OPCIONAL:
- Cámara de acción (GoPro)
- Bolsa seca (waterproof)
- Linterna frontal
- Ganas de aventura (esto no es opcional)`,
        order: 2,
      },
      {
        id: 'ubicacion-2',
        type: 'ubicacion',
        title: '📍 Punto de Encuentro',
        content: `Parking [Nombre]
[Dirección]
GPS: [Coordenadas]

⏰ HORA: Sábado 8:00 AM SHARP
🚗 Carpooling organizado
📞 Emergencias: [Número]`,
        order: 3,
      },
      {
        id: 'faq-1',
        type: 'faq',
        title: '❓ Preguntas Frecuentes',
        content: `P: ¿Es peligroso?
R: Solo si eres muy torpe. Todo está supervisado.

P: ¿Puedo llevar alcohol?
R: Con moderación. Nada de botellones en el trekking.

P: ¿Qué pasa si llueve?
R: ¡Nos mojamos! (tenemos plan B bajo techo)

P: ¿Nivel de forma física requerido?
R: Básico. Si puedes subir 3 pisos sin morir, estás ok.`,
        order: 4,
      },
    ],
  },

  // PLANTILLA 4: VEGAS STYLE
  {
    id: 'vegas-style',
    name: 'Vegas Night',
    description: 'Casino, lujo y diversión estilo Las Vegas',
    category: 'tematico',
    preview: '🎰',
    icon: '🎰',
    colors: {
      primary: '#dc2626',
      secondary: '#000000',
      accent: '#fbbf24',
    },
    fonts: {
      heading: 'Bebas Neue',
      body: 'Open Sans',
    },
    sections: [
      {
        id: 'hero-4',
        type: 'hero',
        title: '🎰 WHAT HAPPENS IN VEGAS... 🎰',
        content: 'Despedida Casino de [NOMBRE]',
        order: 0,
        settings: {
          imageUrl: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200',
          overlay: true,
          animation: 'neon',
        }
      },
      {
        id: 'dress-2',
        type: 'dress_code',
        title: '👔 Dress Code: CASINO ROYALE',
        content: `CHICOS:
- Traje o americana obligatoria
- Zapatos de vestir
- Opcional: Pajarita

CHICAS:
- Vestido de cóctel
- Tacones
- Accessories que brillen

🚫 NO PERMITIDO:
- Zapatillas deportivas
- Vaqueros rotos
- Chandal (obvio)`,
        order: 1,
      },
      {
        id: 'agenda-4',
        type: 'agenda',
        title: '🎲 Programa de la Noche',
        content: `20:00 - Cocktails de bienvenida
20:30 - Cena privada VIP
22:00 - Casino Time
   • Póker Texas Hold'em
   • Blackjack
   • Ruleta
   • Slots
00:00 - Show sorpresa
01:00 - Club VIP
04:00 - After party (reservado)

💰 Budget por persona: [€€€]
🎁 Fichas de casino incluidas`,
        order: 2,
      },
      {
        id: 'rules-3',
        type: 'rules',
        title: '🎯 Reglas del Juego',
        content: `1. Mínimo de apuesta: 1 shot
2. Máximo de apuesta: tu dignidad
3. El homenajeado juega GRATIS
4. Ganador de la noche se lleva corona
5. Perdedor paga taxi de todos
6. Fotos autorizadas (pero no de las mesas)
7. What happens here, STAYS here`,
        order: 3,
      },
      {
        id: 'poll-1',
        type: 'poll',
        title: '🗳️ Vota: Desafío Final',
        content: `¿Qué reto debe hacer [NOMBRE]?
□ Cantar en el karaoke del hotel
□ Bailar en la barra del bar
□ Declaración de amor a desconocid@
□ Stand-up comedy improvisado`,
        order: 4,
      },
    ],
  },

  // PLANTILLA 5: BEACH VIBES
  {
    id: 'beach-paradise',
    name: 'Paraíso Playero',
    description: 'Sol, playa y buenas vibras',
    category: 'tematico',
    preview: '🏖️',
    icon: '🏖️',
    colors: {
      primary: '#0ea5e9',
      secondary: '#06b6d4',
      accent: '#fb923c',
    },
    fonts: {
      heading: 'Pacifico',
      body: 'Poppins',
    },
    sections: [
      {
        id: 'hero-5',
        type: 'hero',
        title: '🏖️ BEACH PARTY DESPEDIDA',
        content: '[NOMBRE] se va... ¡pero primero la playa!',
        order: 0,
        settings: {
          imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
          overlay: false,
        }
      },
      {
        id: 'agenda-5',
        type: 'agenda',
        title: '🌊 Programa Playero',
        content: `Sábado
11:00 - Beach setup (llega pronto para buen sitio!)
12:00 - Volleyball tournament
14:00 - Paella en chiringuito
16:00 - Siesta optional / Paddle surf
18:00 - Sunset drinks
20:00 - Beach BBQ
22:00 - Chiringuito party
02:00 - Moonlight swim (los valientes)

Domingo
11:00 - Brunch frente al mar
13:00 - Última cervecita
15:00 - Adiós paradise`,
        order: 1,
      },
      {
        id: 'rules-4',
        type: 'rules',
        title: '🎒 Qué Traer',
        content: `☀️ ESENCIALES:
- Bañador (obvio)
- Toalla grande
- Protector solar SPF 50+
- Gafas de sol
- Gorra o sombrero
- Chanclas
- Cambio de ropa

🎉 PARA LA DIVERSIÓN:
- Altavoz Bluetooth
- Frisbee / Palas
- Hinchable gracioso
- Cámara acuática
- Flotador gigante
- Cash para chiringuito

🧴 POR SI ACASO:
- After sun
- Aspirinas (por si eso)
- Preservativos (seguridad)`,
        order: 2,
      },
      {
        id: 'map-1',
        type: 'map',
        title: '📍 Nuestra Playa',
        content: `[Nombre Playa]
[Zona específica]

CÓMO LLEGAR:
🚗 Parking: [Ubicación]
🚌 Bus: Línea X hasta [Parada]
🚕 Taxi: "Playa [Nombre], zona [X]"

PUNTO DE ENCUENTRO:
Chiringuito "[Nombre]"
Busca las banderas [COLOR]`,
        order: 3,
        settings: {
          latitude: '41.3851',
          longitude: '2.1734',
        }
      },
      {
        id: 'trivia-2',
        type: 'trivia',
        title: '🎮 Beach Games',
        content: `TORNEOS DEL DÍA:
🏐 Volleyball (14:00)
🏓 Palas (16:00)
🏄 Surf competition (17:00)
🍺 Beer pong (sunset)

PREMIOS:
🥇 Corona + shot gratis
🥈 Respeto del grupo
🥉 Foto para Instagram`,
        order: 4,
      },
    ],
  },

  // PLANTILLA 6: RETRO 80s/90s
  {
    id: 'retro-party',
    name: 'Fiesta Retro',
    description: 'Vuelta a los 80s/90s con mucho estilo',
    category: 'tematico',
    preview: '📼',
    icon: '📼',
    colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#fbbf24',
    },
    fonts: {
      heading: 'Press Start 2P',
      body: 'Courier Prime',
    },
    sections: [
      {
        id: 'hero-6',
        type: 'hero',
        title: '📼 BACK TO THE 90s',
        content: 'Despedida Retro de [NOMBRE]',
        order: 0,
        settings: {
          imageUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=1200',
          overlay: true,
          vhsEffect: true,
        }
      },
      {
        id: 'dress-3',
        type: 'dress_code',
        title: '👕 DRESS CODE: RETRO OBLIGATORIO',
        content: `IDEAS OUTFIT:
□ Chándal colorido (Adidas, Kappa)
□ Camiseta de banda rock
□ Vaqueros anchos
□ Zapatillas chunky
□ Riñonera (bonus points)
□ Gorra hacia atrás
□ Gafas de sol oversize

BONUS:
- Pelo cardado
- Choker
- Tamagotchi
- Walkman de mentira`,
        order: 1,
      },
      {
        id: 'agenda-6',
        type: 'agenda',
        title: '🕹️ PROGRAMACIÓN',
        content: `19:00 - Llegada (foto polaroid de cada uno)
19:30 - Cena tipo diner americano
21:00 - Torneo Arcade Games
   • Street Fighter II
   • Mario Kart 64
   • Tetris championship
22:30 - Karaoke 90s hits
00:00 - Discoteca retro
02:00 - After con videoclips MTV

🎵 PLAYLIST: Solo hits 80s-90s
📹 Todo grabado en VHS style`,
        order: 2,
      },
      {
        id: 'trivia-3',
        type: 'trivia',
        title: '🎯 TRIVIA RETRO',
        content: `TEST GENERACIONAL:
¿Quién recuerda...?
- La sintonía de "El Príncipe de Bel-Air"
- Cómo rebobinar un cassette con un boli
- El sonido del dial-up de internet
- Tamagotchis muriéndose en clase
- Grabar CDs con Nero Burning ROM
- Messenger y sus zumbidos

Premio al que saque más puntos!`,
        order: 3,
      },
      {
        id: 'gallery-2',
        type: 'gallery',
        title: '📺 GALERÍA RETRO',
        content: 'Fotos vintage de todos los invitados',
        order: 4,
        settings: {
          filter: 'vintage',
          columns: 2,
        }
      },
    ],
  },

  // PLANTILLA 7: MINIMALISTA INFO
  {
    id: 'minimal-info',
    name: 'Minimalista',
    description: 'Simple, directo al grano, sin distracciones',
    category: 'elegante',
    preview: '⚪',
    icon: '◻️',
    colors: {
      primary: '#000000',
      secondary: '#ffffff',
      accent: '#3b82f6',
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter',
    },
    sections: [
      {
        id: 'hero-7',
        type: 'hero',
        title: 'Despedida de [NOMBRE]',
        content: '[Fecha] • [Ciudad]',
        order: 0,
        settings: {
          minimal: true,
          centered: true,
        }
      },
      {
        id: 'agenda-7',
        type: 'agenda',
        title: 'Agenda',
        content: `Viernes 20:00 → Cena
Sábado 14:00 → Actividad
Sábado 22:00 → Fiesta
Domingo 12:00 → Despedida`,
        order: 1,
      },
      {
        id: 'ubicacion-3',
        type: 'ubicacion',
        title: 'Ubicación',
        content: '[Hotel]\n[Dirección]\n[Mapa]',
        order: 2,
      },
      {
        id: 'contact-2',
        type: 'contact',
        title: 'Contacto',
        content: '[Nombre] • [Teléfono]',
        order: 3,
      },
    ],
  },
]

// Categorías de plantillas
export const TEMPLATE_CATEGORIES = {
  clasico: { name: 'Clásico', icon: '🎩', description: 'Elegante y tradicional' },
  divertido: { name: 'Divertido', icon: '🎉', description: 'Colorido y festivo' },
  elegante: { name: 'Elegante', icon: '✨', description: 'Sofisticado y minimalista' },
  aventura: { name: 'Aventura', icon: '🏔️', description: 'Outdoor y deportivo' },
  tematico: { name: 'Temático', icon: '🎭', description: 'Con tema específico' },
}

// Funciones helper
export function getTemplatesByCategory(category: keyof typeof TEMPLATE_CATEGORIES) {
  return MICROSITE_TEMPLATES.filter(t => t.category === category)
}

export function getTemplateById(id: string) {
  return MICROSITE_TEMPLATES.find(t => t.id === id)
}
















