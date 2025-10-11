'use client'

import React from 'react'
import { useDragDrop, DraggableItem as DraggableItemType } from './DragDropManager'
import { GripVertical } from 'lucide-react'

interface DraggableItemProps {
  item: DraggableItemType
  children: React.ReactNode
  className?: string
}

export function DraggableItem({ item, children, className = '' }: DraggableItemProps) {
  const { setDraggedItem } = useDragDrop()

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/json', JSON.stringify(item))
    setDraggedItem(item)

    // Añadir clase visual al elemento arrastrado
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.add('opacity-50')
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedItem(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.classList.remove('opacity-50')
    }
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`cursor-grab active:cursor-grabbing transition-opacity ${className}`}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0" />
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}









