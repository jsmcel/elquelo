'use client'

import React, { useState } from 'react'
import { DraggableItem } from './DraggableItem'
import type { DraggableItem as DraggableItemType } from './DragDropManager'
import { 
  Image, 
  MessageSquare, 
  Trophy, 
  Globe, 
  Link as LinkIcon,
  Search,
  Plus,
  Sparkles
} from 'lucide-react'

interface ContentLibraryProps {
  eventId: string
  summary: any
}

export function ContentLibrary({ eventId, summary }: ContentLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'album' | 'messages' | 'retos' | 'urls'>('all')

  // Preparar objetos draggables
  const albums: DraggableItemType[] = [
    {
      type: 'album',
      id: 'album-main',
      label: 'Álbum principal',
      url: `/e/${eventId}/album`,
      data: {},
    },
  ]

  const messages: DraggableItemType[] = summary.messages?.map((msg: any) => ({
    type: 'mensaje',
    id: msg.id,
    label: msg.sender_name || 'Mensaje anónimo',
    data: msg,
  })) || []

  const pruebas: DraggableItemType[] = summary.pruebas?.map((prueba: any) => ({
    type: 'prueba',
    id: prueba.id,
    label: prueba.title,
    url: `/e/${eventId}/reto/${prueba.id}`,
    data: prueba,
  })) || []

  const microsites: DraggableItemType[] = [
    {
      type: 'microsite',
      id: 'microsite-main',
      label: 'Microsite del evento',
      url: `/e/${eventId}/microsite`,
      data: {},
    },
  ]

  const urls: DraggableItemType[] = [
    {
      type: 'url',
      id: 'url-custom',
      label: 'URL personalizada',
      url: '',
      data: { editable: true },
    },
  ]

  const allItems = [...albums, ...messages, ...pruebas, ...microsites, ...urls]

  const filteredItems = allItems.filter((item) => {
    const matchesSearch = item.label.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'album' && item.type === 'album') ||
      (activeTab === 'messages' && item.type === 'mensaje') ||
      (activeTab === 'retos' && item.type === 'prueba') ||
      (activeTab === 'urls' && item.type === 'url' || item.type === 'microsite')
    return matchesSearch && matchesTab
  })

  const getIcon = (type: string) => {
    switch (type) {
      case 'album': return <Image className="h-4 w-4" alt="" />
      case 'mensaje': return <MessageSquare className="h-4 w-4" />
      case 'prueba': return <Trophy className="h-4 w-4" />
      case 'microsite': return <Globe className="h-4 w-4" />
      case 'url': return <LinkIcon className="h-4 w-4" />
      default: return <Sparkles className="h-4 w-4" />
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'album': return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'mensaje': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'prueba': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'microsite': return 'bg-green-100 text-green-700 border-green-300'
      case 'url': return 'bg-gray-100 text-gray-700 border-gray-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const tabs = [
    { key: 'all', label: 'Todo', count: allItems.length },
    { key: 'album', label: 'Álbum', count: albums.length },
    { key: 'messages', label: 'Mensajes', count: messages.length },
    { key: 'retos', label: 'Retos', count: pruebas.length },
    { key: 'urls', label: 'Enlaces', count: urls.length + microsites.length },
  ]

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary-600" />
          Biblioteca de Contenido
        </h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar contenido..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-3">
              {searchQuery ? <Search className="h-12 w-12 mx-auto" /> : <Sparkles className="h-12 w-12 mx-auto" />}
            </div>
            <p className="text-sm text-gray-600 font-semibold">
              {searchQuery ? 'No se encontró nada' : 'No hay contenido todavía'}
            </p>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              {searchQuery ? 'Intenta otra búsqueda' : 'Empieza rápido con plantillas preconfiguradas'}
            </p>
            {!searchQuery && allItems.length === 0 && (
              <button
                onClick={() => window.location.href = `?quickstart=true`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                <Sparkles className="h-4 w-4" />
                Quick Start (30 seg)
              </button>
            )}
          </div>
        ) : (
          filteredItems.map((item) => (
            <DraggableItem key={`${item.type}-${item.id}`} item={item}>
              <div className={`p-3 rounded-lg border ${getColor(item.type)} hover:shadow-md transition-all`}>
                <div className="flex items-center gap-2 mb-1">
                  {getIcon(item.type)}
                  <span className="font-semibold text-sm flex-1 truncate">{item.label}</span>
                </div>
                {item.url && (
                  <p className="text-xs opacity-75 font-mono truncate">{item.url}</p>
                )}
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase opacity-75">{item.type}</span>
                  <span className="text-xs opacity-60">🖱️ Arrastra a un QR</span>
                </div>
              </div>
            </DraggableItem>
          ))
        )}
      </div>

      {/* Footer con estadísticas */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-xl font-bold text-primary-600">{pruebas.length}</div>
            <div className="text-xs text-gray-600">Retos</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-600">{messages.length}</div>
            <div className="text-xs text-gray-600">Mensajes</div>
          </div>
          <div>
            <div className="text-xl font-bold text-purple-600">{albums.length}</div>
            <div className="text-xs text-gray-600">Álbumes</div>
          </div>
        </div>
      </div>
    </div>
  )
}

