'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import type { AnalyticsSummary } from '@/types/despedida'

interface AnalyticsPanelProps {
  analytics: AnalyticsSummary | undefined
}

export function AnalyticsPanel({ analytics }: AnalyticsPanelProps) {
  const lineData = useMemo(() => {
    if (!analytics) return []
    const byDate = new Map<string, { date: string; scans: number }>()
    analytics.timeline.forEach((scan) => {
      const dateKey = scan.createdAt.slice(0, 10)
      const entry = byDate.get(dateKey) ?? { date: dateKey, scans: 0 }
      entry.scans += 1
      byDate.set(dateKey, entry)
    })
    return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [analytics])

  const destinationData = useMemo(() => {
    if (!analytics) return []
    return analytics.destinations.map((entry) => ({
      label: entry.destination.label ?? 'Sin título',
      type: entry.destination.type ?? 'desconocido',
      totalScans: entry.metrics.reduce((sum, metric) => sum + metric.scanCount, 0),
      uniqueVisitors: entry.metrics.reduce((sum, metric) => sum + metric.uniqueVisitors, 0),
    }))
  }, [analytics])

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Analítica de escaneos</h2>
      <p className="mt-1 text-sm text-gray-600">
        Monitoriza el rendimiento de cada QR y detecta picos de interacción durante la despedida.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-700">Escaneos diarios</h3>
          {lineData.length === 0 ? (
            <p className="mt-6 text-xs text-gray-500">Aún no hay datos suficientes.</p>
          ) : (
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="scans" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="h-64 rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold text-gray-700">Top destinos</h3>
          {destinationData.length === 0 ? (
            <p className="mt-6 text-xs text-gray-500">Crea destinos y recibe visitas para ver estadísticas.</p>
          ) : (
            <ResponsiveContainer width="100%" height="90%">
              <AreaChart data={destinationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" stroke="#6b7280" fontSize={12} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} tickLine={false} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="totalScans" stroke="#10b981" fill="#6ee7b7" />
                <Area type="monotone" dataKey="uniqueVisitors" stroke="#6366f1" fill="#c7d2fe" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <h3 className="text-sm font-semibold text-gray-700">Timeline reciente</h3>
        <div className="mt-3 flex max-h-40 flex-col gap-2 overflow-y-auto">
          {analytics?.timeline?.length ? (
            analytics.timeline.slice(0, 20).map((scan, index) => (
              <div key={`${scan.createdAt}-${index}`} className="flex justify-between text-xs text-gray-600">
                <span>{scan.destination?.label ?? 'Destino desconocido'}</span>
                <span>{new Date(scan.createdAt).toLocaleString('es-ES')}</span>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500">Sin registros recientes</p>
          )}
        </div>
      </div>
    </section>
  )
}