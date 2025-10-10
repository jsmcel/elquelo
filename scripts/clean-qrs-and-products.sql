-- Script para limpiar solo QRs, productos y diseños
-- Mantiene eventos, grupos y usuarios

-- Deshabilitar temporalmente las restricciones de clave foránea
SET session_replication_role = replica;

-- Limpiar en orden (respetando dependencias)
DELETE FROM public.participants;
DELETE FROM public.qr_designs;
DELETE FROM public.qrs;

-- Restaurar restricciones de clave foránea
SET session_replication_role = DEFAULT;

-- Resetear secuencias
ALTER SEQUENCE IF EXISTS public.qrs_id_seq RESTART WITH 1;

-- Mensaje de confirmación
SELECT 'QRs, productos y diseños limpiados' as status;
