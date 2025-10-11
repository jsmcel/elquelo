// Biblioteca de retos predefinidos para despedidas de soltero/a

export type ChallengeCategory = 'social' | 'foto' | 'beber' | 'baile' | 'atrevido' | 'creativo' | 'qr_especial'

export interface ChallengeTemplate {
  id: string
  title: string
  description: string
  category: ChallengeCategory
  points: number
  duration?: number // minutos
  requiresProof: boolean
  proofType?: 'photo' | 'video' | 'both'
  icon: string
  difficulty: 'facil' | 'medio' | 'dificil'
  usesQR?: boolean // Indica si el reto usa el QR físico
  qrInstruction?: string // Instrucción específica sobre el QR
}

export const CHALLENGE_CATEGORIES = {
  social: { name: 'Social', color: 'bg-blue-100 text-blue-700', icon: '👥' },
  foto: { name: 'Foto', color: 'bg-purple-100 text-purple-700', icon: '📸' },
  beber: { name: 'Beber', color: 'bg-amber-100 text-amber-700', icon: '🍺' },
  baile: { name: 'Baile', color: 'bg-pink-100 text-pink-700', icon: '💃' },
  atrevido: { name: 'Atrevido', color: 'bg-red-100 text-red-700', icon: '🔥' },
  creativo: { name: 'Creativo', color: 'bg-green-100 text-green-700', icon: '🎨' },
  qr_especial: { name: 'QR Especial', color: 'bg-indigo-100 text-indigo-700', icon: '📱' },
}

export const CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
  // RETOS SOCIALES
  {
    id: 'social-1',
    title: 'Conoce a 5 desconocidos',
    description: 'Presenta al homenajeado/a a 5 personas que no conozca. Consigue sus nombres y una foto con cada uno.',
    category: 'social',
    points: 50,
    duration: 30,
    requiresProof: true,
    proofType: 'photo',
    icon: '👋',
    difficulty: 'facil',
  },
  {
    id: 'social-2',
    title: 'Pide un número de teléfono',
    description: 'Consigue el número de teléfono de alguien atractivo/a. Debe estar en la foto.',
    category: 'social',
    points: 100,
    requiresProof: true,
    proofType: 'photo',
    icon: '📞',
    difficulty: 'medio',
  },
  {
    id: 'social-3',
    title: 'Entrevista express',
    description: 'Graba un video de 30 segundos entrevistando a un desconocido sobre sus peores citas.',
    category: 'social',
    points: 75,
    duration: 5,
    requiresProof: true,
    proofType: 'video',
    icon: '🎤',
    difficulty: 'medio',
  },
  {
    id: 'social-4',
    title: 'Consigue una firma',
    description: 'Encuentra a alguien con el mismo nombre que el homenajeado/a y consigue su autógrafo.',
    category: 'social',
    points: 80,
    requiresProof: true,
    proofType: 'photo',
    icon: '✍️',
    difficulty: 'medio',
  },

  // RETOS DE FOTO
  {
    id: 'foto-1',
    title: 'Foto con uniforme',
    description: 'Hazte una foto con alguien en uniforme (policía, camarero, seguridad, etc.)',
    category: 'foto',
    points: 60,
    requiresProof: true,
    proofType: 'photo',
    icon: '👮',
    difficulty: 'medio',
  },
  {
    id: 'foto-2',
    title: 'Selfie en altura',
    description: 'Foto del grupo en el punto más alto que encuentren (escaleras, mirador, etc.)',
    category: 'foto',
    points: 40,
    requiresProof: true,
    proofType: 'photo',
    icon: '⛰️',
    difficulty: 'facil',
  },
  {
    id: 'foto-3',
    title: 'Recrear foto antigua',
    description: 'Recrear una foto antigua del homenajeado/a (debe compartirse la original)',
    category: 'foto',
    points: 100,
    requiresProof: true,
    proofType: 'photo',
    icon: '🖼️',
    difficulty: 'medio',
  },
  {
    id: 'foto-4',
    title: 'Foto grupal en espejo',
    description: 'Todo el grupo debe aparecer en un selfie frente a un espejo',
    category: 'foto',
    points: 50,
    requiresProof: true,
    proofType: 'photo',
    icon: '🪞',
    difficulty: 'facil',
  },

  // RETOS DE BEBER
  {
    id: 'beber-1',
    title: 'Chupito con desconocido',
    description: 'Invita a un chupito a un desconocido y brinda con él/ella',
    category: 'beber',
    points: 70,
    requiresProof: true,
    proofType: 'photo',
    icon: '🥃',
    difficulty: 'medio',
  },
  {
    id: 'beber-2',
    title: 'Bartender por un minuto',
    description: 'Consigue que te dejen servir una bebida en la barra y grábalo',
    category: 'beber',
    points: 150,
    requiresProof: true,
    proofType: 'video',
    icon: '🍹',
    difficulty: 'dificil',
  },
  {
    id: 'beber-3',
    title: 'Ronda misteriosa',
    description: 'Deja que el bartender elija una bebida sorpresa para ti',
    category: 'beber',
    points: 50,
    requiresProof: true,
    proofType: 'photo',
    icon: '❓',
    difficulty: 'facil',
  },
  {
    id: 'beber-4',
    title: 'Brindis épico',
    description: 'Graba un brindis de 60 segundos contando una anécdota embarazosa del homenajeado/a',
    category: 'beber',
    points: 80,
    duration: 2,
    requiresProof: true,
    proofType: 'video',
    icon: '🗣️',
    difficulty: 'medio',
  },

  // RETOS DE BAILE
  {
    id: 'baile-1',
    title: 'TikTok challenge',
    description: 'Graba un TikTok con todo el grupo haciendo un baile viral',
    category: 'baile',
    points: 100,
    requiresProof: true,
    proofType: 'video',
    icon: '📱',
    difficulty: 'medio',
  },
  {
    id: 'baile-2',
    title: 'Batalla de baile',
    description: 'Reta a alguien del local a una batalla de baile. Mínimo 30 segundos cada uno.',
    category: 'baile',
    points: 120,
    requiresProof: true,
    proofType: 'video',
    icon: '🕺',
    difficulty: 'dificil',
  },
  {
    id: 'baile-3',
    title: 'Baile de grupo',
    description: 'Consigue que 10 personas se unan a bailar en círculo',
    category: 'baile',
    points: 150,
    requiresProof: true,
    proofType: 'video',
    icon: '💫',
    difficulty: 'dificil',
  },
  {
    id: 'baile-4',
    title: 'Slow motion',
    description: 'Baila en cámara lenta durante 1 minuto completo',
    category: 'baile',
    points: 60,
    requiresProof: true,
    proofType: 'video',
    icon: '🐌',
    difficulty: 'facil',
  },

  // RETOS ATREVIDOS
  {
    id: 'atrevido-1',
    title: 'Discurso en bar',
    description: 'Sube a una silla/mesa y da un discurso sobre el matrimonio (mínimo 1 minuto)',
    category: 'atrevido',
    points: 150,
    requiresProof: true,
    proofType: 'video',
    icon: '📢',
    difficulty: 'dificil',
  },
  {
    id: 'atrevido-2',
    title: 'Piropo original',
    description: 'Di un piropo creativo a 5 personas diferentes. Todo en video.',
    category: 'atrevido',
    points: 100,
    requiresProof: true,
    proofType: 'video',
    icon: '💘',
    difficulty: 'medio',
  },
  {
    id: 'atrevido-3',
    title: 'Karaoke improvisado',
    description: 'Canta una canción romántica a un desconocido/a',
    category: 'atrevido',
    points: 120,
    requiresProof: true,
    proofType: 'video',
    icon: '🎤',
    difficulty: 'dificil',
  },
  {
    id: 'atrevido-4',
    title: 'Pide consejos matrimoniales',
    description: 'Pregunta a 3 parejas diferentes sus mejores consejos para el matrimonio',
    category: 'atrevido',
    points: 80,
    requiresProof: true,
    proofType: 'video',
    icon: '💍',
    difficulty: 'medio',
  },

  // RETOS CREATIVOS
  {
    id: 'creativo-1',
    title: 'Poema improvisado',
    description: 'Crea y recita un poema de 8 versos sobre el homenajeado/a',
    category: 'creativo',
    points: 90,
    requiresProof: true,
    proofType: 'video',
    icon: '📝',
    difficulty: 'medio',
  },
  {
    id: 'creativo-2',
    title: 'Arte con servilletas',
    description: 'Crea un retrato del homenajeado/a usando solo servilletas de bar',
    category: 'creativo',
    points: 80,
    requiresProof: true,
    proofType: 'photo',
    icon: '🎨',
    difficulty: 'medio',
  },
  {
    id: 'creativo-3',
    title: 'Mimo por 5 minutos',
    description: 'Actúa como mimo durante 5 minutos. Nadie puede hablar, solo gesticular.',
    category: 'creativo',
    points: 70,
    duration: 5,
    requiresProof: true,
    proofType: 'video',
    icon: '🤐',
    difficulty: 'medio',
  },
  {
    id: 'creativo-4',
    title: 'Hashtag del evento',
    description: 'Crea un hashtag único para la despedida y consigue que 10 personas lo usen en Instagram',
    category: 'creativo',
    points: 120,
    requiresProof: true,
    proofType: 'photo',
    icon: '#️⃣',
    difficulty: 'dificil',
  },

  // RETOS ESPECIALES CON QR
  {
    id: 'qr-1',
    title: 'Cazador de QRs',
    description: 'Encuentra y escanea el QR oculto en [UBICACIÓN]. El QR te dará la siguiente pista.',
    category: 'qr_especial',
    points: 200,
    requiresProof: true,
    proofType: 'photo',
    icon: '🔍',
    difficulty: 'dificil',
    usesQR: true,
    qrInstruction: 'Pega este QR en un lugar secreto y da pistas',
  },
  {
    id: 'qr-2',
    title: 'QR en movimiento',
    description: 'Haz que alguien escanee tu QR de la camiseta mientras bailas. Sin parar de moverte.',
    category: 'qr_especial',
    points: 100,
    requiresProof: true,
    proofType: 'video',
    icon: '🏃',
    difficulty: 'medio',
    usesQR: true,
    qrInstruction: 'Usa el QR de tu camiseta',
  },
  {
    id: 'qr-3',
    title: 'Coleccionista de QRs',
    description: 'Consigue fotos escaneando los QRs de 5 personas diferentes del grupo',
    category: 'qr_especial',
    points: 150,
    requiresProof: true,
    proofType: 'photo',
    icon: '🎯',
    difficulty: 'medio',
    usesQR: true,
    qrInstruction: 'Deben escanear los QRs de las camisetas de otros',
  },
  {
    id: 'qr-4',
    title: 'QR selfie chain',
    description: 'Crea una cadena: escanea un QR, haz un selfie, la persona escaneada escanea otro QR, y así hasta 10 personas',
    category: 'qr_especial',
    points: 250,
    duration: 20,
    requiresProof: true,
    proofType: 'photo',
    icon: '🔗',
    difficulty: 'dificil',
    usesQR: true,
    qrInstruction: 'Usar los QRs de las camisetas del grupo',
  },
  {
    id: 'qr-5',
    title: 'QR sorpresa',
    description: 'Haz que un desconocido escanee tu QR y graba su reacción al ver el contenido',
    category: 'qr_especial',
    points: 120,
    requiresProof: true,
    proofType: 'video',
    icon: '😲',
    difficulty: 'medio',
    usesQR: true,
    qrInstruction: 'Usa el QR de tu camiseta',
  },
  {
    id: 'qr-6',
    title: 'Búsqueda del tesoro QR',
    description: 'Sigue la cadena de QRs ocultos. Cada QR te lleva al siguiente hasta encontrar el "tesoro final".',
    category: 'qr_especial',
    points: 300,
    duration: 30,
    requiresProof: true,
    proofType: 'photo',
    icon: '🗺️',
    difficulty: 'dificil',
    usesQR: true,
    qrInstruction: 'Crea una cadena de 5 QRs ocultos en diferentes lugares',
  },
  {
    id: 'qr-7',
    title: 'QR artístico',
    description: 'Consigue una foto artística/creativa donde aparezca alguien escaneando tu QR',
    category: 'qr_especial',
    points: 80,
    requiresProof: true,
    proofType: 'photo',
    icon: '📷',
    difficulty: 'facil',
    usesQR: true,
    qrInstruction: 'Usa el QR de tu camiseta como elemento artístico',
  },
]

// Función para filtrar retos por categoría
export function getChallengesByCategory(category: ChallengeCategory): ChallengeTemplate[] {
  return CHALLENGE_TEMPLATES.filter(challenge => challenge.category === category)
}

// Función para obtener retos que usan QR
export function getQRChallenges(): ChallengeTemplate[] {
  return CHALLENGE_TEMPLATES.filter(challenge => challenge.usesQR)
}

// Función para obtener retos por dificultad
export function getChallengesByDifficulty(difficulty: 'facil' | 'medio' | 'dificil'): ChallengeTemplate[] {
  return CHALLENGE_TEMPLATES.filter(challenge => challenge.difficulty === difficulty)
}

// Función para obtener retos aleatorios
export function getRandomChallenges(count: number): ChallengeTemplate[] {
  const shuffled = [...CHALLENGE_TEMPLATES].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}











