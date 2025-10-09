# QR Despedida Control Platform

## Objective
Create an end-to-end control surface for despedida events that lets organisers manage every QR after purchase, dynamically routing scans to curated experiences (albums, microsites, links, pruebas, mensajes, etc.) while mirroring the same capabilities in a dedicated Expo 52 mobile app.

## Key Principles
- Event-centric domain: an event groups every QR and module, decoupling the design flow from post-purchase operations.
- Dynamic routing: all short codes resolve through our backend and choose the right destination according to the event configuration at scan time.
- Parity across clients: the web dashboard (Next.js) and the Expo app share Supabase APIs and offer identical management features.
- Analytics by default: every scan, destination switch, and engagement surface is logged for reporting.
- Extensible modules: albums, microsites, guestbooks, pruebas, mensajes, playlists, etc. plug into the same event/module framework so we can ship new experiences without schema churn.
- Ephemeral-first: all event content auto-expires after a configurable window following the despedida and endpoints respect schedule windows.

## Experience Content Types
### Destination modules (per QR)
- External link (custom URL, fallback default).
- Album viewer (web-hosted gallery with optional PIN).
- Microsite page (sections composed inside builder).
- Challenge / prueba (task instructions + validation flow and optional proof upload).
- Timeline entry (sub-event info, schedule, map pin, CTA to calendar).
- Absent friend message board (async voice/text/video messages recorded before event, unveiled at chosen time).
- Playlist / media stream (Spotify, YouTube, or uploaded audio set).
- Map / logistics (Google Maps deep link, meeting point, transport info).
- Surprise reveal (locked page that unlocks at schedule time).

### Event-wide interactive flows
- Challenge board aggregating all pruebas with completion tracking.
- Agenda with milestones, each tied to QR schedules.
- Remote friend wall with moderation queue and publish window controls.
- Highlight reel auto-generated from album uploads (optional AI summary later).

## Data Model Additions / Changes
All tables live in the `public` schema (Supabase):

| Table | Purpose | Key Columns |
| --- | --- | --- |
| events (augment) | Represent each despedida event post purchase | type (`evento_despedida`), status (`design`, `pending_payment`, `live`, `archived`), owner_id, order_id, stripe_session_id, qr_group_id, event_date, expires_at, content_ttl_days, config JSONB, timestamps |
| event_members | Collaborator access separate from QR creation roles | event_id, user_id, role (`owner`, `editor`, `viewer`), invite_token, invited_email, accepted_at |
| qrs (augment) | Link QR directly to event and current destination | event_id, active_destination_id, metadata JSONB, last_active_at |
| qr_destinations | Catalog menu of destinations per QR | id, qr_id, type (`external`, `album`, `microsite`, `prueba`, `timeline`, `message_wall`, `playlist`, ...), label, slug, target_url, payload JSONB, is_active, priority, start_at, end_at, switch_rule JSONB |
| event_modules | Feature toggles for the event | id, event_id, type (`album`, `microsite`, `challenge_board`, `message_wall`, `timeline`, `analytics_plus`, ...), status, settings JSONB, start_at, end_at |
| event_albums | Album container per event | id, event_id, title, cover_url, settings JSONB, published_at |
| event_album_media | Store uploaded media metadata (files in Supabase storage bucket `event-albums`) | id, album_id, uploader_id, asset_url, thumbnail_url, type (`image`, `video`, `gif`, `audio`), caption, visibility, recorded_at |
| event_pages | Configurable microsite sections | id, event_id, slug, schema JSONB, is_published, theme, start_at, end_at |
| event_pruebas | Canonical challenge definitions | id, event_id, title, description, instructions JSONB, reward JSONB, start_at, end_at, auto_lock BOOLEAN |
| event_prueba_attempts | Track completions per QR or participant | id, prueba_id, qr_id, participant_name, submission JSONB, status, reviewed_by, reviewed_at |
| event_messages | Absent friend messages | id, event_id, module_id, sender_name, sender_email, media_url, transcript, visibility, scheduled_at, published_at, expires_at |
| event_actions_log | Auditing for admin plus analytics | id, event_id, actor_id, action, payload JSONB, created_at |
| scans (augment) | Track which destination handled the scan | id, qr_id, destination_id, event_id, resolved_url, status_code, device_type, geo JSONB, created_at |
| qr_destination_metrics_daily (mat view) | Roll-up stats per destination and day | destination_id, date, scan_count, unique_visitors, top_referrer |

Other infra:
- Supabase storage buckets: `event-albums`, `event-assets`, `event-exports`, `event-messages`.
- Supabase scheduled functions for content expiry and analytics aggregation.
- Optional edge function later for geolocation enrichment and mobility detection.

## Backend Flow Updates
1. Checkout metadata
   - `ConfirmOrderButton` sends `group_id`, `event_type`, `qr_codes`, preferred `event_date`, and `content_ttl_days` in metadata.
   - `orders` insert stores `group_id`, `event_type`, `qr_codes` snapshot, `event_date_request`.

2. Stripe webhook (`checkout.session.completed`)
   - Upsert `events` by `stripe_session_id`; set `event_date` (from metadata or user flow) and `expires_at = event_date + content_ttl_days`.
   - Attach `group_id` QRs to the event and seed default `qr_destinations` with `start_at = NOW()` and `end_at = expires_at`.
   - Enable default modules (album, message wall draft, microsite shell) via `event_modules` with schedule windows.
   - Insert owner into `event_members` as `owner` role and create invite tokens for collaborators captured during checkout.

3. Dynamic QR redirect (`app/api/qr/[code]/route.ts`)
   - Resolve QR, event, active destination respecting current timestamp between `start_at` and `end_at`; if outside window, fall back to event default or expiry notice.
   - If destination type is `album`, `microsite`, `prueba`, or `message_wall`, redirect to hosted route with signed params; otherwise use `target_url`.
   - Log scans including `destination_id`, `device_type`, `geo` (when available), and mark invalid attempts if event expired (`expires_at`).

4. Event control APIs (new routes under `app/api/events/[eventId]`)
   - `GET /summary`, `GET /qrs`, `POST /destinations`, `PATCH /destinations/:id`, `POST /modules/:type`, `POST /album/media`, `DELETE /album/media/:id`, `POST /pruebas`, `PATCH /pruebas/:id`, `POST /messages`, `PATCH /messages/:id/publish`, `GET /analytics`, `POST /schedule/sync`.
   - Schedule endpoints validate that `start_at` < `end_at` <= `event.expires_at`.
   - All routes enforce membership via RLS referencing `event_members` and per-role capabilities.

5. Scheduling utilities
   - Supabase scheduled task runs daily to:
     - Auto-publish message wall entries whose `scheduled_at <= NOW()`.
     - Disable destinations whose `end_at < NOW()` by clearing `active_destination_id`.
     - Mark events as `archived` when `expires_at < NOW()` and queue data purge (storage cleanup) after grace period.
   - Optional real-time channel to notify clients when schedule transitions occur.

## Ephemeral Lifecycle & Scheduling
- `event.event_date` recorded during creation; `expires_at = event_date + content_ttl_days` (default 30 days, configurable per event).
- Dashboard warns organisers on upcoming expiry and allows extension (subject to plan).
- At expiry:
  1. All destinations set to inactive and QR redirect serves archival landing (download memories CTA).
  2. Media buckets move content to cold storage or delete after additional buffer (configurable, default 7 days).
  3. Analytics exports generated automatically and emailed to owner before purge.
- Each module (album, pruebas, message wall) inherits event expiry but can also specify `start_at` / `end_at` for phased releases during the despedida weekend.

## Content Scheduling Mechanics
- `qr_destinations.start_at/end_at` determine when a QR points to a given experience; scheduler ensures there is always at least one active destination or a fallback.
- `event_pruebas` and `event_messages` include `scheduled_at` to support reveal moments (e.g., release remote friend videos at midnight).
- Cron job `sync_event_schedule` recalculates `qrs.active_destination_id` based on upcoming windows and sends Supabase real-time notifications so clients refresh UI.

## Web Dashboard (Next.js)
Route group: `app/(authenticated)/dashboard/despedida/[eventId]/`

Modules:
- Overview: payment status, event date, expiry countdown, quick stats, auto-extend controls.
- QR Matrix: table/grid of all QRs with inline controls for active destination, schedule timeline, scan stats, search and filters.
- Destinations Editor: create or edit destinations per QR, drag to reorder, define `start_at/end_at`, bulk apply presets, preview future routing.
- Challenge Board: manage `pruebas`, set difficulty, attach evidence requirements, review submissions in moderation queue.
- Message Wall: moderate absent friend messages, schedule reveal, share submission link, auto-generate thank-you responses.
- Album Manager: upload, moderate, reorder gallery, share album link, create slideshows, export ZIP before expiry.
- Microsite Builder: layout builder (hero, timeline, location, CTA). MVP = hero + schedule + links with drag-and-drop order and per-section schedules.
- Analytics: charts (daily scans, top destinations, message engagement, challenge completion) using `scans` and metrics view, plus upcoming schedule heatmap.
- Settings: event rename, slug, invites, domain toggles, webhook secrets, TTL override, content purge controls.

UI approach:
- Reuse Tailwind components; add timeline visualization for scheduled destinations.
- Use TanStack Table + faceted filters for QR matrix.
- Charting with Recharts (`@nivo` fallback) and timeline with `vis-timeline` or custom D3.
- Real-time updates via Supabase channels for schedule changes, new messages, new album media.

Access gating:
- When hitting `/dashboard/despedida`, fetch events with `status` in (`live`, `design`) where related order is `paid`; otherwise surface paywall message and CTA back to checkout.
- Display schedule summary to emphasise expiry window.

## Expo App (SDK 52)
Structure: create `apps/mobile` using Expo Router with TypeScript config.

Feature parity highlights:
- Supabase auth (magic link + OAuth) using `expo-auth-session` or `@supabase/auth-helpers-react-native`.
- Event list cards showing event date, expiry countdown, recent activity badges.
- QR detail screen with destination switcher, schedule editor (date/time pickers), quick stat sparkline, preview/scan tester (powered by `expo-barcode-scanner`).
- Challenge board: view challenges, mark completions, review attempts with approve/reject.
- Message wall: review scheduled remote messages, approve/reject, trigger early release.
- Album management: capture or upload from camera roll, moderate submissions, offline queue for pending uploads.
- Push notifications (Expo push) for new uploads, challenge completions, upcoming schedule switches, and impending expiry.
- Offline cache via React Query + SQLite for last-known state, with TTL awareness.

Shared code strategy:
- Move shared API clients, hooks, and types into `packages/shared`.
- Use React Query for caching/sync; share validation schemas via `zod`.

## Analytics Implementation
- Extend `scans` inserts with `destination_id`, `device_type`, `geo`, `event_phase` (derived from schedule) and `expired` flag.
- Supabase scheduled function (nightly) populates `qr_destination_metrics_daily` plus challenge/message engagement rollups.
- Provide RPC for aggregated stats filtered by event/QR/destination/time window for fast dashboards.
- CSV export endpoint `GET /events/:id/analytics/export` uploads report to storage and returns signed URL before event expiry.
- Optional Slack/Webhook notifications for scan spikes or proof completion thresholds.

## Testing Strategy
- Unit tests: schedule resolution, QR redirect fallback, Supabase RPC validators, TTL calculations.
- Integration tests: Stripe webhook to event activation, challenge submission workflow, message scheduling publish job, storage cleanup script.
- E2E tests (Playwright) covering dashboard flows: create destination with schedule, approve message wall entry, run through event expiry path.
- Mobile tests: Detox or Expo E2E for login, destination edit, offline album upload queue.
- Load/soak tests for QR redirect endpoint under scan spikes near reveal moments.

## Implementation Roadmap (high level)
1. Foundation
   - Author migrations (`supabase/migrations/<timestamp>_qr_despedida.sql`) including new tables, RLS, indexes.
   - Update Stripe webhook and checkout metadata flow; seed events with expiry.
   - Implement scheduled Supabase function for schedule sync and expiry handling.

2. Dynamic routing
   - Extend QR redirect API, schedule resolution logic, fallback messaging for expired events.

3. Web dashboard MVP
   - Scaffold routes, fetch event summary, implement QR matrix, destination editor with scheduling, paywall gating.

4. Experience modules
   - Challenge board APIs/UI, message wall submission pipeline, album storage, microsite viewer routes.

5. Analytics surfaces
   - Charts, metrics view, activity log timeline, export jobs, spike notifications.

6. Expo app
   - Initialise project, authentication, event list, QR detail, schedule editor, album upload, challenge moderation, analytics summary.

7. Ephemeral enforcement & QA
   - Expiry cron, storage cleanup, reminder emails.
   - Tests (Playwright, unit, mobile), linting, docs, release notes.

## Dependencies / Tools
- Continue using `supabase-js`; add service-layer wrappers for schedule-aware queries.
- Add `zod` for payload validation, `date-fns` for scheduling helpers, `@tanstack/react-query` for shared data fetching, `recharts` (or alternative) for charts, `luxon` optional for timezone math.
- Expo libraries: `expo-router`, `expo-secure-store`, `expo-image-picker`, `expo-file-system`, `expo-notifications`, `expo-task-manager` (for background sync).
- Consider Sentry for monitoring both clients; cron job observability via Supabase logs.

## Outstanding Items / Assumptions
- Short domain already points to Next serverless runtime; scheduler simply selects correct destination.
- Stripe product for despedida priced at 29 EUR per QR (confirm). Adjust metadata mapping if different.
- Need legal confirmation on retention window (default 30 days) and comms for content purge.
- Push notifications require Expo credentials setup; plan for later iteration.
- Need visual assets or brand guidelines for microsite builder and challenge badges.
- Storage costs monitored; consider automatic compression for media uploads.

## Next Steps
- Finalise schema migration draft with new tables and scheduling columns; share for approval.
- Prototype schedule resolution logic and cron function in Supabase (SQL + TypeScript function).
- Align on UI wireframes for challenge board, message wall, and schedule timeline before coding heavy UI modules.
- Kick off backend implementation (plan step 4) once schema and scheduling approach are signed off.
