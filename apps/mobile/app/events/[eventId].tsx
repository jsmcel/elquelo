import { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native'
import { useLocalSearchParams } from 'expo-router'

interface MobileEventSummary {
  event: {
    id: string
    name: string | null
    status: string
    event_date: string | null
    expires_at: string | null
  }
  modules: Array<{ type: string; status: string }>
  qrs: Array<{ code: string; scan_count: number }>
  messages: Array<{ id: string; visibility: string }>
}

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>()
  const [summary, setSummary] = useState<MobileEventSummary | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadSummary = useCallback(async () => {
    if (!eventId) return
    setRefreshing(true)
    const response = await fetch(`/api/events/${eventId}/summary`)
    if (response.ok) {
      const payload = await response.json()
      setSummary({
        event: {
          id: payload.event.id,
          name: payload.event.name,
          status: payload.event.status,
          event_date: payload.event.event_date,
          expires_at: payload.event.expires_at,
        },
        modules: payload.modules,
        qrs: payload.qrs,
        messages: payload.messages,
      })
    }
    setRefreshing(false)
  }, [eventId])

  useEffect(() => {
    loadSummary()
  }, [loadSummary])

  if (!summary) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#4f46e5" />
      </View>
    )
  }

  const eventDate = summary.event.event_date ? new Date(summary.event.event_date) : null

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadSummary} />}>
      <View style={styles.card}>
        <Text style={styles.status}>{summary.event.status}</Text>
        <Text style={styles.title}>{summary.event.name ?? 'Despedida sin título'}</Text>
        <Text style={styles.meta}>
          {eventDate ? eventDate.toLocaleString('es-ES') : 'Fecha pendiente'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionHeading}>Actividad</Text>
        {summary.qrs.map((qr) => (
          <View key={qr.code} style={styles.listItem}>
            <Text style={styles.listLabel}>{qr.code}</Text>
            <Text style={styles.listValue}>{qr.scan_count} escaneos</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionHeading}>Módulos</Text>
        <View style={styles.rowWrap}>
          {summary.modules.map((module) => (
            <View key={module.type} style={styles.chip}>
              <Text style={styles.chipText}>
                {module.type} · {module.status}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionHeading}>Mensajes programados</Text>
        {summary.messages.length === 0 ? (
          <Text style={styles.meta}>No hay mensajes pendientes.</Text>
        ) : (
          summary.messages.map((message) => (
            <View key={message.id} style={styles.listItem}>
              <Text style={styles.listLabel}>{message.visibility}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  meta: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  listItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  listLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  listValue: {
    fontSize: 12,
    color: '#4b5563',
    marginTop: 2,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    backgroundColor: '#e0e7ff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4338ca',
  },
})
