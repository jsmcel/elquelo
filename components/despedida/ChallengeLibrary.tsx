'use client'

import { useState } from 'react'
import { Search, Filter, Star, Clock, Camera, Zap } from 'lucide-react'
import { CHALLENGE_TEMPLATES, CHALLENGE_CATEGORIES, type ChallengeTemplate, type ChallengeCategory } from '@/lib/challenge-templates'

interface ChallengeLibraryProps {
  onSelectChallenge: (challenge: ChallengeTemplate) => void
  onDragStart?: (challenge: ChallengeTemplate) => void
}

export function ChallengeLibrary({ onSelectChallenge, onDragStart }: ChallengeLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ChallengeCategory | 'all'>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'facil' | 'medio' | 'dificil'>('all')
  const [showQROnly, setShowQROnly] = useState(false)

  const filteredChallenges = CHALLENGE_TEMPLATES.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || challenge.category === selectedCategory
    const matchesDifficulty = selectedDifficulty === 'all' || challenge.difficulty === selectedDifficulty
    const matchesQR = !showQROnly || challenge.usesQR

    return matchesSearch && matchesCategory && matchesDifficulty && matchesQR
  })

  const handleDragStart = (e: React.DragEvent, challenge: ChallengeTemplate) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/json', JSON.stringify(challenge))
    if (onDragStart) {
      onDragStart(challenge)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facil': return 'bg-green-100 text-green-700'
      case 'medio': return 'bg-yellow-100 text-yellow-700'
      case 'dificil': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">📚 Biblioteca de Retos</h3>
        <p className="mt-1 text-sm text-gray-600">
          Arrastra y suelta retos predefinidos o haz clic para añadirlos
        </p>
      </div>

      {/* Filtros */}
      <div className="mb-6 space-y-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar retos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>

        {/* Categorías */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {Object.entries(CHALLENGE_CATEGORIES).map(([key, { name, color, icon }]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as ChallengeCategory)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                selectedCategory === key ? color : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {icon} {name}
            </button>
          ))}
        </div>

        {/* Filtros adicionales */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">Dificultad:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as any)}
              className="rounded-lg border border-gray-200 px-2 py-1 text-xs font-medium focus:border-primary-400 focus:outline-none"
            >
              <option value="all">Todas</option>
              <option value="facil">Fácil</option>
              <option value="medio">Medio</option>
              <option value="dificil">Difícil</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
            <input
              type="checkbox"
              checked={showQROnly}
              onChange={(e) => setShowQROnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Solo retos con QR 📱
          </label>

          <span className="ml-auto text-xs text-gray-500">
            {filteredChallenges.length} retos
          </span>
        </div>
      </div>

      {/* Lista de retos */}
      <div className="max-h-[600px] space-y-3 overflow-y-auto pr-2">
        {filteredChallenges.map((challenge) => {
          const category = CHALLENGE_CATEGORIES[challenge.category]
          
          return (
            <div
              key={challenge.id}
              draggable
              onDragStart={(e) => handleDragStart(e, challenge)}
              onClick={() => onSelectChallenge(challenge)}
              className="group relative cursor-move rounded-xl border border-gray-200 bg-gray-50 p-4 transition hover:border-primary-300 hover:bg-primary-50 hover:shadow-md active:cursor-grabbing"
            >
              {/* Badge de categoría */}
              <div className="mb-2 flex items-center gap-2">
                <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${category.color}`}>
                  {category.icon} {category.name}
                </span>
                <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${getDifficultyColor(challenge.difficulty)}`}>
                  {challenge.difficulty}
                </span>
                {challenge.usesQR && (
                  <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
                    📱 USA QR
                  </span>
                )}
              </div>

              {/* Título */}
              <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                {challenge.icon} {challenge.title}
              </h4>

              {/* Descripción */}
              <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                {challenge.description}
              </p>

              {/* Instrucción QR */}
              {challenge.qrInstruction && (
                <p className="mt-2 rounded-lg bg-indigo-50 px-2 py-1 text-xs text-indigo-700">
                  💡 {challenge.qrInstruction}
                </p>
              )}

              {/* Metadata */}
              <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {challenge.points} pts
                </span>
                {challenge.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {challenge.duration} min
                  </span>
                )}
                {challenge.requiresProof && (
                  <span className="flex items-center gap-1">
                    <Camera className="h-3 w-3" />
                    {challenge.proofType === 'video' ? 'Video' : challenge.proofType === 'both' ? 'Foto/Video' : 'Foto'}
                  </span>
                )}
              </div>

              {/* Indicador de drag */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 transition group-hover:opacity-100">
                <Zap className="h-5 w-5 text-primary-500" />
              </div>
            </div>
          )
        })}

        {filteredChallenges.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500">
              No se encontraron retos con los filtros seleccionados
            </p>
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="text-xs font-semibold text-blue-900">💡 Cómo usar:</p>
        <ul className="mt-2 space-y-1 text-xs text-blue-800">
          <li>• <strong>Arrastra</strong> un reto a la lista de retos activos</li>
          <li>• <strong>Haz clic</strong> para añadirlo directamente</li>
          <li>• Retos con 📱 usan los QRs de las camisetas de forma especial</li>
          <li>• Puedes editar el reto después de añadirlo</li>
        </ul>
      </div>
    </div>
  )
}
















