'use client'

import React, { useState } from 'react'
import { MICROSITE_TEMPLATES, TEMPLATE_CATEGORIES, MicrositeTemplate, getTemplatesByCategory } from '@/lib/microsite-templates'
import { Check, Eye, Info } from 'lucide-react'

interface MicrositeTemplateLibraryProps {
  onSelectTemplate: (template: MicrositeTemplate) => void
  currentTemplateId?: string
}

export const MicrositeTemplateLibrary: React.FC<MicrositeTemplateLibraryProps> = ({
  onSelectTemplate,
  currentTemplateId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof TEMPLATE_CATEGORIES | 'all'>('all')
  const [previewTemplate, setPreviewTemplate] = useState<MicrositeTemplate | null>(null)

  const filteredTemplates = selectedCategory === 'all' 
    ? MICROSITE_TEMPLATES 
    : getTemplatesByCategory(selectedCategory)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">📄 Plantillas de Microsite</h2>
        <p className="text-sm text-gray-600 mt-1">
          Selecciona una plantilla base y personalízala a tu gusto
        </p>
      </div>

      {/* Filtros por categoría */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            selectedCategory === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        {Object.entries(TEMPLATE_CATEGORIES).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key as keyof typeof TEMPLATE_CATEGORIES)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              selectedCategory === key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      {/* Grid de plantillas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const isSelected = template.id === currentTemplateId

          return (
            <div
              key={template.id}
              className={`relative rounded-2xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                isSelected
                  ? 'border-primary-600 shadow-md bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
              onClick={() => onSelectTemplate(template)}
            >
              {/* Badge de seleccionado */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white shadow-md">
                  <Check className="h-5 w-5" />
                </div>
              )}

              <div className="p-5 space-y-3">
                {/* Preview Icon */}
                <div
                  className="flex h-20 w-full items-center justify-center rounded-xl text-5xl"
                  style={{
                    background: `linear-gradient(135deg, ${template.colors.primary} 0%, ${template.colors.secondary} 100%)`,
                  }}
                >
                  {template.preview}
                </div>

                {/* Info */}
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{template.name}</h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {template.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{template.sections.length} secciones</span>
                  <span className="px-2 py-1 rounded-full bg-gray-100">
                    {TEMPLATE_CATEGORIES[template.category].icon} {TEMPLATE_CATEGORIES[template.category].name}
                  </span>
                </div>

                {/* Paleta de colores */}
                <div className="flex gap-2">
                  <div
                    className="h-6 w-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: template.colors.primary }}
                    title="Color primario"
                  />
                  <div
                    className="h-6 w-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: template.colors.secondary }}
                    title="Color secundario"
                  />
                  <div
                    className="h-6 w-6 rounded-full border border-gray-200"
                    style={{ backgroundColor: template.colors.accent }}
                    title="Color de acento"
                  />
                </div>

                {/* Acciones */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPreviewTemplate(template)
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <Eye className="h-3 w-3" /> Ver
                  </button>
                  <button
                    onClick={() => onSelectTemplate(template)}
                    className={`flex-1 inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      isSelected
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {isSelected ? <Check className="h-3 w-3" /> : null}
                    {isSelected ? 'Seleccionada' : 'Usar esta'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewTemplate(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>

            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-xl text-3xl"
                  style={{
                    background: `linear-gradient(135deg, ${previewTemplate.colors.primary} 0%, ${previewTemplate.colors.secondary} 100%)`,
                  }}
                >
                  {previewTemplate.preview}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{previewTemplate.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{previewTemplate.description}</p>
                </div>
              </div>

              {/* Detalles */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase">Categoría</h4>
                  <p className="text-sm text-gray-900 mt-1">
                    {TEMPLATE_CATEGORIES[previewTemplate.category].icon}{' '}
                    {TEMPLATE_CATEGORIES[previewTemplate.category].name} -{' '}
                    {TEMPLATE_CATEGORIES[previewTemplate.category].description}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase">Colores</h4>
                  <div className="flex gap-3 mt-2">
                    <div className="text-center">
                      <div
                        className="h-10 w-10 rounded-lg border border-gray-200 mx-auto"
                        style={{ backgroundColor: previewTemplate.colors.primary }}
                      />
                      <p className="text-xs text-gray-600 mt-1">Primario</p>
                    </div>
                    <div className="text-center">
                      <div
                        className="h-10 w-10 rounded-lg border border-gray-200 mx-auto"
                        style={{ backgroundColor: previewTemplate.colors.secondary }}
                      />
                      <p className="text-xs text-gray-600 mt-1">Secundario</p>
                    </div>
                    <div className="text-center">
                      <div
                        className="h-10 w-10 rounded-lg border border-gray-200 mx-auto"
                        style={{ backgroundColor: previewTemplate.colors.accent }}
                      />
                      <p className="text-xs text-gray-600 mt-1">Acento</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-gray-700 uppercase">Tipografía</h4>
                  <p className="text-sm text-gray-900 mt-1">
                    Títulos: <span className="font-semibold">{previewTemplate.fonts.heading}</span>
                    {' • '}
                    Texto: <span className="font-semibold">{previewTemplate.fonts.body}</span>
                  </p>
                </div>
              </div>

              {/* Secciones incluidas */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  📋 Secciones Incluidas ({previewTemplate.sections.length})
                </h4>
                <div className="space-y-2">
                  {previewTemplate.sections.map((section, idx) => (
                    <div key={section.id} className="rounded-lg border border-gray-200 bg-white p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 text-sm">{section.title}</h5>
                          <p className="text-xs text-gray-600 mt-0.5 capitalize">
                            {section.type.replace('_', ' ')}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {section.content.split('\n')[0]}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 ml-2">#{idx + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botón de acción */}
              <button
                onClick={() => {
                  onSelectTemplate(previewTemplate)
                  setPreviewTemplate(null)
                }}
                className="w-full rounded-xl bg-primary-600 px-4 py-3 font-semibold text-white hover:bg-primary-700"
              >
                Usar esta plantilla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}








