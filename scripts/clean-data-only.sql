-- Script para limpiar solo los datos pero mantener la estructura de tablas
-- ⚠️  CUIDADO: Este script elimina TODOS los datos pero mantiene las tablas

-- Deshabilitar temporalmente las restricciones de clave foránea
SET session_replication_role = replica;

-- Limpiar datos en orden (respetando dependencias)
DELETE FROM public.participants;
DELETE FROM public.qr_designs;
DELETE FROM public.qrs;
DELETE FROM public.groups;
DELETE FROM public.events;
DELETE FROM public.user_profiles;

-- Limpiar tablas relacionadas con eventos si existen
DELETE FROM public.event_albums;
DELETE FROM public.event_media;
DELETE FROM public.event_messages;
DELETE FROM public.event_modules;
DELETE FROM public.event_destinations;
DELETE FROM public.event_pruebas;

-- Limpiar datos de autenticación (cuidado con esto)
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.sessions;
DELETE FROM auth.identities;
DELETE FROM auth.users;

-- Restaurar restricciones de clave foránea
SET session_replication_role = DEFAULT;

-- Resetear secuencias de auto-incremento
ALTER SEQUENCE IF EXISTS public.events_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.groups_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS public.qrs_id_seq RESTART WITH 1;

-- Mensaje de confirmación
SELECT 'Datos limpiados completamente (estructura mantenida)' as status;
