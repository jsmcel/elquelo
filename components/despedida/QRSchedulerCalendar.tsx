'use client'

import React, { useMemo, useState } from 'react'
import clsx from 'clsx'
import {
  addDays,
  addMinutes,
  differenceInMinutes,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  max,
  min,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)
const HOUR_HEIGHT = 64
const MIN_EVENT_HEIGHT = 44
const MIN_DURATION_MINUTES = 30

interface CalendarDestination {
  id: string
  label: string
  type: string
  target_url: string | null
  is_active: boolean
  start_at: string | null
  end_at: string | null
  priority: number
}

interface CalendarEventLayout {
  destination: CalendarDestination
  start: Date
  end: Date
  top: number
  height: number
  columnIndex: number
  totalColumns: number
  leftPercent: number
  widthPercent: number
}

interface QRSchedulerCalendarProps {
  destinations: CalendarDestination[]
  onEdit?: (destination: CalendarDestination) => void
  onToggleActive?: (destination: CalendarDestination) => void
  getStatusLabel?: (destination: CalendarDestination) => string
  getStatusColor?: (destination: CalendarDestination) => string
  selectedDestinationId?: string | null
  timezone?: string | null
}

function parseDate(value: string | null): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function resolveTimezone(timezone?: string | null): string | undefined {
  if (timezone) {
    try {
      // Throws if timezone is invalid
      new Intl.DateTimeFormat('es-ES', { timeZone: timezone })
      return timezone
    } catch (error) {
      console.warn('[QRSchedulerCalendar] Invalid timezone provided', timezone)
    }
  }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (error) {
    return undefined
  }
}

export function QRSchedulerCalendar({
  destinations,
  onEdit,
  onToggleActive,
  getStatusLabel,
  getStatusColor,
  selectedDestinationId,
  timezone,
}: QRSchedulerCalendarProps) {
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const tz = resolveTimezone(timezone)

  const timeFormatter = useMemo(() => {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz,
    })
  }, [tz])

  const weekStart = useMemo(() => startOfWeek(weekAnchor, { weekStartsOn: 1 }), [weekAnchor])
  const weekEnd = useMemo(() => endOfWeek(weekAnchor, { weekStartsOn: 1 }), [weekAnchor])
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)), [weekStart])

  const scheduledDestinations = useMemo(
    () => destinations.filter((dest) => dest.start_at),
    [destinations],
  )
  const unscheduledDestinations = useMemo(
    () => destinations.filter((dest) => !dest.start_at),
    [destinations],
  )

  const weekEvents = useMemo(() => {
    const startBoundary = startOfWeek(weekStart, { weekStartsOn: 1 })
    const endBoundary = endOfWeek(weekStart, { weekStartsOn: 1 })

    return scheduledDestinations
      .map((destination) => {
        const start = parseDate(destination.start_at)
        if (!start) return null
        const end = parseDate(destination.end_at) ?? addMinutes(start, MIN_DURATION_MINUTES)
        return { destination, start, end }
      })
      .filter((event): event is { destination: CalendarDestination; start: Date; end: Date } => !!event)
      .filter((event) => event.end >= startBoundary && event.start <= endBoundary)
  }, [scheduledDestinations, weekStart])

  const eventsByDay = useMemo(() => {
    const dayHeight = HOURS.length * HOUR_HEIGHT
    return days.map((day) => {
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)

      const dayEvents = weekEvents
        .filter((event) => event.end >= dayStart && event.start <= dayEnd)
        .map((event) => {
          const boundedStart = max([event.start, dayStart])
          const boundedEnd = max([
            min([event.end, dayEnd]),
            addMinutes(boundedStart, MIN_DURATION_MINUTES),
          ])
          const minutesFromStart = Math.max(0, differenceInMinutes(boundedStart, dayStart))
          const durationMinutes = Math.max(
            MIN_DURATION_MINUTES,
            differenceInMinutes(boundedEnd, boundedStart),
          )
          const top = (minutesFromStart / 60) * HOUR_HEIGHT
          const height = Math.max(MIN_EVENT_HEIGHT, (durationMinutes / 60) * HOUR_HEIGHT)

          return {
            destination: event.destination,
            start: boundedStart,
            end: boundedEnd,
            top,
            height: Math.min(height, dayHeight - top),
          }
        })
        .sort((a, b) => a.start.getTime() - b.start.getTime())

      const columnEndTimes: number[] = []
      const laidOut: CalendarEventLayout[] = []

      dayEvents.forEach((event) => {
        let columnIndex = columnEndTimes.findIndex((endTime) => endTime <= event.start.getTime())
        if (columnIndex === -1) {
          columnIndex = columnEndTimes.length
          columnEndTimes.push(event.end.getTime())
        } else {
          columnEndTimes[columnIndex] = event.end.getTime()
        }

        const totalColumns = columnEndTimes.length || 1
        const widthPercent = 100 / totalColumns
        const leftPercent = widthPercent * columnIndex

        laidOut.push({
          destination: event.destination,
          start: event.start,
          end: event.end,
          top: event.top,
          height: event.height,
          columnIndex,
          totalColumns,
          leftPercent,
          widthPercent,
        })
      })

      return laidOut
    })
  }, [days, weekEvents])

  const now = new Date()
  const hasEventsThisWeek = weekEvents.length > 0

  const weekRangeLabel = useMemo(() => {
    const sameMonth = format(weekStart, 'MMMM', { locale: es }) === format(weekEnd, 'MMMM', { locale: es })
    if (sameMonth) {
      return `${format(weekStart, 'd', { locale: es })} – ${format(weekEnd, "d 'de' MMMM", { locale: es })}`
    }
    return `${format(weekStart, "d 'de' MMM", { locale: es })} – ${format(weekEnd, "d 'de' MMM", { locale: es })}`
  }, [weekStart, weekEnd])

  const handlePrevWeek = () => {
    setWeekAnchor((prev) => addDays(prev, -7))
  }

  const handleNextWeek = () => {
    setWeekAnchor((prev) => addDays(prev, 7))
  }

  const handleResetWeek = () => {
    setWeekAnchor(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          <Calendar className="h-4 w-4 text-primary-600" />
          <span className="font-semibold text-gray-900">Semana:</span>
          <span>{weekRangeLabel}</span>
          {tz && (
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              {tz.replace('_', ' ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="flex items-center justify-center rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleResetWeek}
            className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={handleNextWeek}
            className="flex items-center justify-center rounded-lg border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-gray-200 bg-gray-50">
        <div className="flex h-full items-center justify-center px-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          Hora
        </div>
        {days.map((day) => (
          <div key={day.toISOString()} className="border-l border-gray-200 px-3 py-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase text-primary-600">
                {format(day, 'EEE', { locale: es })}
              </span>
              <span className="text-sm font-semibold text-gray-800">
                {format(day, 'd MMM', { locale: es })}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="relative grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
        {/* Hour scale */}
        <div className="relative border-r border-gray-200 bg-white">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex h-[64px] items-start justify-end pr-2 text-[11px] text-gray-500"
            >
              <span>{hour.toString().padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day, dayIndex) => {
          const columnHeight = HOURS.length * HOUR_HEIGHT
          const dayEvents = eventsByDay[dayIndex] || []
          const isToday = isSameDay(day, now)
          const minutesFromStart = differenceInMinutes(now, startOfDay(day))
          const nowPosition = Math.max(0, Math.min(columnHeight, (minutesFromStart / 60) * HOUR_HEIGHT))

          return (
            <div key={day.toISOString()} className="relative border-l border-gray-100 bg-white">
              {/* Hour grid lines */}
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-dashed border-gray-100"
                  style={{ top: `${hour * HOUR_HEIGHT}px` }}
                />
              ))}

              {isToday && minutesFromStart >= 0 && minutesFromStart <= 24 * 60 && (
                <div
                  className="pointer-events-none absolute left-0 right-0"
                  style={{ top: `${nowPosition}px` }}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-primary-500 via-primary-500 to-transparent" />
                    <span className="rounded bg-primary-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {timeFormatter.format(now)}
                    </span>
                  </div>
                </div>
              )}

              {/* Events */}
              {dayEvents.map((event) => {
                const statusColor = getStatusColor?.(event.destination)
                const statusLabel = getStatusLabel?.(event.destination)
                const isSelected = selectedDestinationId === event.destination.id

                return (
                  <button
                    key={event.destination.id}
                    type="button"
                    onClick={() => onEdit?.(event.destination)}
                    className={clsx(
                      'group absolute rounded-lg border px-3 py-2 text-left text-[11px] shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
                      event.destination.is_active
                        ? 'bg-primary-50 border-primary-200 hover:border-primary-300'
                        : 'bg-gray-100 border-gray-200 hover:border-gray-300',
                      isSelected && 'ring-2 ring-primary-400 ring-offset-2',
                    )}
                    style={{
                      top: `${event.top}px`,
                      height: `${event.height}px`,
                      left: `calc(${event.leftPercent}% + ${event.columnIndex * 6}px)`,
                      width: `calc(${event.widthPercent}% - 8px)`,
                      zIndex: isSelected ? 30 : 10,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-gray-900 line-clamp-2">
                        {event.destination.label || 'Sin nombre'}
                      </span>
                      {statusLabel && (
                        <span
                          className={clsx(
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            statusColor || 'bg-gray-100 text-gray-600',
                          )}
                        >
                          {statusLabel}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 font-mono text-[10px] text-gray-600">
                      {`${timeFormatter.format(event.start)} – ${timeFormatter.format(event.end)}`}
                    </div>
                    {event.destination.target_url && (
                      <div className="mt-1 line-clamp-1 text-[10px] text-gray-500">
                        {event.destination.target_url}
                      </div>
                    )}
                    {onToggleActive && (
                      <div className="mt-2 flex items-center justify-end">
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            onToggleActive(event.destination)
                          }}
                          className="cursor-pointer text-[10px] font-semibold text-primary-600 hover:text-primary-700"
                        >
                          {event.destination.is_active ? 'Desactivar' : 'Activar'}
                        </span>
                      </div>
                    )}
                  </button>
                )
              })}

              {/* Empty state for the week */}
              {!hasEventsThisWeek && dayIndex === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                  No hay destinos programados en esta semana.
                </div>
              )}

              <div style={{ height: `${columnHeight}px` }} />
            </div>
          )
        })}
      </div>

      {unscheduledDestinations.length > 0 && (
        <div className="border-t border-gray-200 bg-gray-50 px-5 py-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
            Sin fecha asignada
          </h4>
          <div className="flex flex-wrap gap-2">
            {unscheduledDestinations.map((destination) => (
              <button
                key={destination.id}
                type="button"
                onClick={() => onEdit?.(destination)}
                className={clsx(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition',
                  destination.is_active
                    ? 'border-primary-200 bg-white text-primary-700 hover:border-primary-300'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300',
                )}
              >
                {destination.label || 'Sin nombre'}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
