import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Link } from 'expo-router'
import { format } from 'date-fns'
import es from 'date-fns/locale/es'

interface EventListItem {
  id: string
  name: string | null
  status: string
  event_date: string | null
  expires_at: string | null
  qr_count: number
  scan_count: number
  role: string
}

interface EventCardProps {
  event: EventListItem
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = event.event_date ? new Date(event.event_date) : null
  const expiresAt = event.expires_at ? new Date(event.expires_at) : null

  return (
    <Link href={`/events/${event.id}`} asChild>
      <TouchableOpacity style={styles.card}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.roleText}>{event.role.toUpperCase()}</Text>
            <Text style={styles.title}>{event.name ?? 'Despedida sin título'}</Text>
          </View>
          <Text style={styles.status}>{event.status}</Text>
        </View>
        <View style={styles.dateBlock}>
          <Text style={styles.metaText}>
            Evento: {eventDate ? format(eventDate, "dd MMM yyyy · HH:mm", { locale: es }) : 'Sin programar'}
          </Text>
          <Text style={styles.metaText}>
            Caducidad: {expiresAt ? format(expiresAt, "dd MMM yyyy", { locale: es }) : 'Sin definir'}
          </Text>
        </View>
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, styles.qrCard]}>
            <Text style={styles.metricLabel}>QRs</Text>
            <Text style={styles.metricValue}>{event.qr_count}</Text>
          </View>
          <View style={[styles.metricCard, styles.scanCard]}>
            <Text style={styles.metricLabel}>Escaneos</Text>
            <Text style={styles.metricValue}>{event.scan_count}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  title: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  status: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f46e5',
    textTransform: 'uppercase',
  },
  dateBlock: {
    marginTop: 12,
  },
  metaText: {
    fontSize: 12,
    color: '#4b5563',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  qrCard: {
    backgroundColor: '#eef2ff',
  },
  scanCard: {
    backgroundColor: '#dcfce7',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563',
  },
  metricValue: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
})
