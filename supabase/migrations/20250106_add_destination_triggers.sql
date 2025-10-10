-- Añadir columna de triggers a qr_destinations
ALTER TABLE qr_destinations 
ADD COLUMN IF NOT EXISTS triggers JSONB DEFAULT '[]'::jsonb;

-- Comentario explicativo
COMMENT ON COLUMN qr_destinations.triggers IS 'Array de triggers que se ejecutan cuando este destino se activa o escanea. Formato: [{type, condition, target_qr_id, action, target_destination_id}]';

-- Índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_qr_destinations_triggers ON qr_destinations USING GIN (triggers);

-- Función para ejecutar triggers cuando un QR se escanea
CREATE OR REPLACE FUNCTION execute_qr_triggers(
  p_destination_id UUID,
  p_scan_count INTEGER DEFAULT 1
) RETURNS JSONB AS $$
DECLARE
  v_triggers JSONB;
  v_trigger JSONB;
  v_result JSONB := '[]'::jsonb;
  v_action JSONB;
BEGIN
  -- Obtener triggers del destino
  SELECT triggers INTO v_triggers
  FROM qr_destinations
  WHERE id = p_destination_id;

  -- Si no hay triggers, retornar vacío
  IF v_triggers IS NULL OR jsonb_array_length(v_triggers) = 0 THEN
    RETURN v_result;
  END IF;

  -- Iterar sobre cada trigger
  FOR v_trigger IN SELECT * FROM jsonb_array_elements(v_triggers)
  LOOP
    -- Verificar condición
    IF (v_trigger->>'type' = 'on_scan') OR
       (v_trigger->>'type' = 'on_count' AND (v_trigger->'condition')::int <= p_scan_count) THEN
      
      -- Ejecutar acción
      CASE v_trigger->>'action'
        WHEN 'activate' THEN
          -- Activar destino específico
          UPDATE qr_destinations
          SET is_active = true
          WHERE id = (v_trigger->>'target_destination_id')::uuid;
          
          v_action := jsonb_build_object(
            'trigger_id', v_trigger->>'id',
            'action', 'activate',
            'target_destination_id', v_trigger->>'target_destination_id',
            'success', true
          );
          
        WHEN 'deactivate' THEN
          -- Desactivar destino del QR objetivo
          UPDATE qr_destinations
          SET is_active = false
          WHERE qr_id = (v_trigger->>'target_qr_id')::uuid
            AND is_active = true;
            
          v_action := jsonb_build_object(
            'trigger_id', v_trigger->>'id',
            'action', 'deactivate',
            'target_qr_id', v_trigger->>'target_qr_id',
            'success', true
          );
          
        WHEN 'switch' THEN
          -- Desactivar actual y activar nuevo
          UPDATE qr_destinations
          SET is_active = false
          WHERE qr_id = (v_trigger->>'target_qr_id')::uuid
            AND is_active = true;
            
          UPDATE qr_destinations
          SET is_active = true
          WHERE id = (v_trigger->>'target_destination_id')::uuid;
          
          v_action := jsonb_build_object(
            'trigger_id', v_trigger->>'id',
            'action', 'switch',
            'target_destination_id', v_trigger->>'target_destination_id',
            'success', true
          );
          
        ELSE
          v_action := jsonb_build_object(
            'trigger_id', v_trigger->>'id',
            'error', 'Unknown action'
          );
      END CASE;
      
      v_result := v_result || v_action;
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Comentario sobre la función
COMMENT ON FUNCTION execute_qr_triggers IS 'Ejecuta todos los triggers asociados a un destino cuando se escanea. Retorna array de acciones ejecutadas.';




