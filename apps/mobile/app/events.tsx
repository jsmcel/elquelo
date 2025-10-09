import { useCallback, useState } from 'react'
import { View, Text, ScrollView, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { EventCard } from '@/components/EventCard'
import { supabase } from '@/lib/supabase'
import { useSupabaseSession } from '@/hooks/useSupabaseSession'

export default function EventsScreen() {
  const { session, loading } = useSupabaseSession()
  const [events, setEvents] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadEvents = useCallback(async () => {
    if (!session) return
    setRefreshing(true)

    const { data: memberships, error } = await supabase
      .from('event_members')
      .select(
        `event_id, role, events!inner (id, name, status, event_date, expires_at)`
      )
      .eq('user_id', session.user.id)

    if (error) {
      console.error(error)
      setRefreshing(false)
      return
    }

    const eventIds = memberships?.map((item) => item.event_id) ?? []
    let metrics: Record<string, { qr_count: number; scan_count: number }> = {}
    if (eventIds.length > 0) {
      const { data: qrs } = await supabase
        .from('qrs')
        .select('event_id, scan_count')
        .in('event_id', eventIds)

      metrics = (qrs ?? []).reduce((acc, qr) => {
        if (!qr.event_id) return acc
        const current = acc[qr.event_id] ?? { qr_count: 0, scan_count: 0 }
        acc[qr.event_id] = {
          qr_count: current.qr_count + 1,
          scan_count: current.scan_count + (qr.scan_count ?? 0),
        }
        return acc
      }, {} as Record<string, { qr_count: number; scan_count: number }>)
    }

    const mapped = (memberships ?? []).map((item) => {
      const event = (item as any).events
      const metric = metrics[event.id] ?? { qr_count: 0, scan_count: 0 }
      return {
        id: event.id,
        name: event.name,
        status: event.status,
        event_date: event.event_date,
        expires_at: event.expires_at,
        role: item.role,
        ...metric,
      }
    })

    setEvents(mapped)
    setRefreshing(false)
  }, [session])

  useFocusEffect(
    useCallback(() => {
      if (session) {
        loadEvents()
      }
    }, [session, loadEvents])
  )

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#4f46e5" />
      </View>
    )
  }

  if (!session) {
    return (
      <View style={[styles.centered, styles.padded]}>
        <Text style={styles.infoText}>
          Inicia sesión en la web para configurar tus QRs y vuelve para gestionarlos desde el móvil.
        </Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadEvents} />}>
      <Text style={styles.heading}>Mis despedidas</Text>
      {events.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            Todavía no tienes despedidas activas. Completa tu compra para desbloquear este panel.
          </Text>
        </View>
      ) : (
        events.map((event) => <EventCard key={event.id} event={event} />)
      )}
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
  padded: {
    paddingHorizontal: 24,
  },
  infoText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#1f2937',
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: '#c7d2fe',
    borderStyle: 'dashed',
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#4b5563',
  },
})
