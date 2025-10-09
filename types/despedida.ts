export interface EventSummary {
  event: {
    id: string
    name: string | null
    description: string | null
    status: string
    type: string
    event_date: string | null
    expires_at: string | null
    content_ttl_days: number | null
    event_timezone: string | null
    qr_group_id: string | null
    config: Record<string, unknown> | null
  }
  role: string
  stats: {
    qrCount: number
    totalScans: number
    scheduledMessages: number
    activeModules: number
  }
  destinations: Array<{
    id: string
    qr_id: string | null
    type: string
    label: string | null
    target_url: string | null
    is_active: boolean
    start_at: string | null
    end_at: string | null
    priority: number
  }>
  modules: Array<{
    id: string
    type: string
    status: string
    start_at: string | null
    end_at: string | null
    settings: Record<string, unknown> | null
  }>
  qrs: Array<{
    id: string
    code: string
    scan_count: number
    active_destination_id: string | null
    last_active_at: string | null
  }>
  messages: Array<{
    id: string
    visibility: string
    scheduled_at: string | null
    published_at: string | null
  }>
  pruebas: Array<{
    id: string
    title: string
    start_at: string | null
    end_at: string | null
    auto_lock: boolean | null
  }>
}

export interface DestinationMetric {
  destination: {
    id: string
    qr_id: string | null
    label: string | null
    type: string | null
  }
  metrics: Array<{
    date: string
    scanCount: number
    uniqueVisitors: number
  }>
}

export interface AnalyticsSummary {
  destinations: DestinationMetric[]
  timeline: Array<{
    destinationId: string | null
    createdAt: string
    destination: DestinationMetric['destination'] | null
  }>
}

