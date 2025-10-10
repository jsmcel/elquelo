-- Script para limpiar completamente la base de datos
-- ⚠️  CUIDADO: Este script elimina TODOS los datos
-- Ejecutar solo en desarrollo o cuando quieras empezar desde cero

-- Deshabilitar temporalmente las restricciones de clave foránea
SET session_replication_role = replica;

-- Eliminar todas las tablas en orden (respetando dependencias)
DROP TABLE IF EXISTS public.participants CASCADE;
DROP TABLE IF EXISTS public.qr_designs CASCADE;
DROP TABLE IF EXISTS public.qrs CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Eliminar tablas relacionadas con eventos si existen
DROP TABLE IF EXISTS public.event_albums CASCADE;
DROP TABLE IF EXISTS public.event_media CASCADE;
DROP TABLE IF EXISTS public.event_messages CASCADE;
DROP TABLE IF EXISTS public.event_modules CASCADE;
DROP TABLE IF EXISTS public.event_destinations CASCADE;
DROP TABLE IF EXISTS public.event_pruebas CASCADE;

-- Eliminar tablas de autenticación si existen
DROP TABLE IF EXISTS auth.users CASCADE;
DROP TABLE IF EXISTS auth.identities CASCADE;
DROP TABLE IF EXISTS auth.sessions CASCADE;
DROP TABLE IF EXISTS auth.refresh_tokens CASCADE;

-- Eliminar esquemas si están vacíos
DROP SCHEMA IF EXISTS public CASCADE;
DROP SCHEMA IF EXISTS auth CASCADE;

-- Recrear esquemas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS auth;

-- Restaurar permisos por defecto
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA auth TO postgres;
GRANT ALL ON SCHEMA auth TO public;

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Restaurar restricciones de clave foránea
SET session_replication_role = DEFAULT;

-- Limpiar storage de Supabase (esto se hace desde el dashboard o API)
-- Los archivos en storage se mantienen, pero las referencias en BD se eliminan

-- Mensaje de confirmación
SELECT 'Base de datos limpiada completamente' as status;
