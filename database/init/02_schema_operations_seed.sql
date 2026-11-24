-- =============================================================================
-- SCRIPT SQL 02: MENSUALIDADES, CLASES, GEOFENCING, AUDITORÍA Y DATOS SEMILLA
-- Sistema Híbrido de Gestión de Dojo
-- Regla de Ingeniería: Archivo modular < 300 líneas, documentado en español.
-- =============================================================================

-- =============================================================================
-- 1. TIPOS ENUMERADOS DE OPERACIÓN (MENSUALIDADES, ASISTENCIA Y AUDITORÍA)
-- =============================================================================

-- Estado estricto de la mensualidad (Sin renovación automática cuando vence)
DO $$ BEGIN
    CREATE TYPE membership_status_enum AS ENUM ('ACTIVA', 'POR_VENCER', 'VENCIDA', 'SUSPENDIDA');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Color del semáforo visual calculado según los días restantes
DO $$ BEGIN
    CREATE TYPE traffic_light_enum AS ENUM ('VERDE', 'AMARILLO', 'ROJO');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Método por el cual se registró la presencia del estudiante en el Dojo
DO $$ BEGIN
    CREATE TYPE attendance_method_enum AS ENUM ('AUTO_GPS', 'MANUAL_ADMIN', 'MANUAL_AYUDANTE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Tipo de operación registrada en la bitácora de auditoría inmutable
DO $$ BEGIN
    CREATE TYPE audit_action_enum AS ENUM (
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'RENEW_MEMBERSHIP',
        'BELT_PROMOTION',
        'ATTENDANCE_CHECKIN',
        'ATTENDANCE_OVERRIDE',
        'OCR_SCAN'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 2. TABLA: memberships (Control de Mensualidades y Regla de Renovación Manual)
-- =============================================================================
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cycle_days INT NOT NULL DEFAULT 30,
    status membership_status_enum NOT NULL DEFAULT 'ACTIVA',
    -- Bandera de seguridad: jamas se auto-renueva; requiere acción explícita del ADMIN
    auto_renew_allowed BOOLEAN NOT NULL DEFAULT FALSE CHECK (auto_renew_allowed = FALSE),
    amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    last_payment_confirmed_at TIMESTAMPTZ,
    last_confirmed_by_admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    payment_reference VARCHAR(120),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE memberships IS 'Estado actual de la mensualidad de cada estudiante. Prohibida la renovación automática.';
COMMENT ON COLUMN memberships.auto_renew_allowed IS 'Restricción CHECK(FALSE): garantiza a nivel de motor BD que nunca exista auto-renovación.';

-- Historial de todos los pagos y renovaciones aprobadas explícitamente por un ADMIN
CREATE TABLE IF NOT EXISTS membership_payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    amount_paid NUMERIC(12,2) NOT NULL,
    approved_by_admin_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approved_by_admin_name VARCHAR(150) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'EFECTIVO_TRANSFERENCIA',
    notes TEXT,
    approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE membership_payment_history IS 'Respaldo histórico de cada clic en "Confirmar Pago / Renovar Mensualidad" hecho por un ADMIN.';

-- =============================================================================
-- 3. TABLA: attendance_sessions (Asistencia a Clases, Geofencing y Técnicas)
-- =============================================================================
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_out_time TIMESTAMPTZ,
    -- Indica si el estudiante se encuentra actualmente entrenando en el tatami ("En Clase Ahora")
    is_currently_in_class BOOLEAN NOT NULL DEFAULT TRUE,
    detection_method attendance_method_enum NOT NULL DEFAULT 'AUTO_GPS',
    -- Coordenadas GPS reportadas por la App Android al confirmar permanencia en el Dojo
    gps_latitude NUMERIC(10,7),
    gps_longitude NUMERIC(10,7),
    gps_distance_meters NUMERIC(7,2),
    dwell_time_minutes INT DEFAULT 0,
    -- Registro técnico llenado por el AYUDANTE o ADMIN (si queda NULL, cuenta como asistencia simple)
    techniques_practiced TEXT,
    training_observations TEXT,
    recorded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recorded_by_role user_role_enum,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Un estudiante tiene un registro consolidado por día de entrenamiento
    CONSTRAINT uq_student_daily_session UNIQUE (student_id, session_date)
);

COMMENT ON TABLE attendance_sessions IS 'Historial de clases tomadas, detección GPS por Geofencing y bitácora de técnicas practicadas.';

-- =============================================================================
-- 4. TABLA: notifications (Cola e Historial de Notificaciones Push / Locales)
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'IN_CLASS_GPS', 'MEMBERSHIP_WARNING', 'MEMBERSHIP_EXPIRED', 'BELT_PROMOTION'
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    delivered_to_device BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE notifications IS 'Alertas enviadas a la App Android del estudiante (ingreso a clase, vencimiento de mensualidad, ascensos).';

-- =============================================================================
-- 5. TABLA: audit_logs (BITÁCORA DE AUDITORÍA INMUTABLE)
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_full_name VARCHAR(150) NOT NULL,
    actor_role user_role_enum NOT NULL,
    action audit_action_enum NOT NULL,
    target_table VARCHAR(80) NOT NULL,
    target_record_id VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE audit_logs IS 'Bitácora inmutable que registra quién (user_id, nombre y rol) creó, editó o eliminó cualquier dato.';

-- Regla de inmutabilidad: Prohibir UPDATE o DELETE sobre la tabla audit_logs
CREATE OR REPLACE FUNCTION prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'SEGURIDAD DOJO: Los registros de audit_logs son estrictamente inmutables y no pueden modificarse ni eliminarse.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_audit_logs ON audit_logs;
CREATE TRIGGER trg_immutable_audit_logs
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_tampering();

-- =============================================================================
-- 6. VISTA INTELIGENTE: vw_student_membership_traffic_light (Semáforo en Vivo)
-- =============================================================================
CREATE OR REPLACE VIEW vw_student_membership_traffic_light AS
SELECT
    m.id AS membership_id,
    s.id AS student_id,
    s.document_number,
    s.first_name || ' ' || s.last_name AS student_full_name,
    b.name AS belt_name,
    b.color_hex AS belt_color_hex,
    m.start_date,
    m.end_date,
    m.cycle_days,
    GREATEST(0, (CURRENT_DATE - m.start_date)) AS days_elapsed,
    (m.end_date - CURRENT_DATE) AS days_remaining,
    CASE
        WHEN m.end_date < CURRENT_DATE OR m.status = 'VENCIDA' THEN 'VENCIDA'::membership_status_enum
        WHEN (m.end_date - CURRENT_DATE) <= 5 THEN 'POR_VENCER'::membership_status_enum
        ELSE 'ACTIVA'::membership_status_enum
    END AS computed_status,
    CASE
        WHEN m.end_date < CURRENT_DATE OR m.status = 'VENCIDA' THEN 'ROJO'::traffic_light_enum
        WHEN (m.end_date - CURRENT_DATE) <= 5 THEN 'AMARILLO'::traffic_light_enum
        ELSE 'VERDE'::traffic_light_enum
    END AS traffic_light_color,
    m.last_payment_confirmed_at,
    m.last_confirmed_by_admin_id
FROM memberships m
JOIN students s ON s.id = m.student_id
JOIN belts b ON b.id = s.current_belt_id;

COMMENT ON VIEW vw_student_membership_traffic_light IS 'Calcula en tiempo real días transcurridos, días restantes y color del semáforo (VERDE -> AMARILLO -> ROJO).';

-- =============================================================================
-- 7. DATOS SEMILLA (CINTURONES OFICIALES Y USUARIOS INICIALES POR ROL)
-- =============================================================================

-- Catálogo inicial de cinturones
INSERT INTO belts (name, color_hex, secondary_color_hex, rank_order, description) VALUES
    ('Cinturón Blanco', '#FFFFFF', NULL, 1, 'Grado principiante - Pureza e inicio del camino marcial'),
    ('Cinturón Amarillo', '#FACC15', NULL, 2, 'Comprensión de los fundamentos y posturas básicas'),
    ('Cinturón Naranja', '#FB923C', NULL, 3, 'Desarrollo de coordinación, desplazamientos y defensas'),
    ('Cinturón Verde', '#22C55E', NULL, 4, 'Crecimiento técnico, combinaciones e inicio de combate controlado'),
    ('Cinturón Azul', '#3B82F6', NULL, 5, 'Fluidez táctica, dominio de katas/formas intermedias'),
    ('Cinturón Marrón', '#78350F', NULL, 6, 'Grado avanzado previo al Dan - Madurez técnica y física'),
    ('Cinturón Negro (1er Dan)', '#111827', '#EAB308', 7, 'Instructor / Experto - Dominio integral del arte marcial')
ON CONFLICT (rank_order) DO NOTHING;

-- Usuarios iniciales por defecto (Contraseñas hasheadas con bcrypt vía pgcrypto):
-- 1. ADMIN:     usuario: "admin"      | clave: "AdminDojo2026!"
-- 2. AYUDANTE:  usuario: "ayudante"   | clave: "AyudanteDojo2026!"
-- 3. ESTUDIANTE:usuario: "1020304050" | clave: "EstudianteDojo2026!"
INSERT INTO users (id, username, email, password_hash, full_name, role) VALUES
    ('11111111-1111-4111-8111-111111111111', 'admin', 'sensei@dojo.local', crypt('AdminDojo2026!', gen_salt('bf', 10)), 'Sensei Administrador Principal', 'ADMIN'),
    ('22222222-2222-4222-8222-222222222222', 'ayudante', 'senpai@dojo.local', crypt('AyudanteDojo2026!', gen_salt('bf', 10)), 'Senpai Ayudante de Tatami', 'AYUDANTE'),
    ('33333333-3333-4333-8333-333333333333', '1020304050', 'alumno.demo@dojo.local', crypt('EstudianteDojo2026!', gen_salt('bf', 10)), 'Carlos Andrés Rodríguez Gómez', 'ESTUDIANTE')
ON CONFLICT (username) DO NOTHING;

-- Estudiante de demostración vinculado al usuario ESTUDIANTE
INSERT INTO students (
    id, user_id, document_type, document_number, first_name, last_name,
    birth_date, blood_type, eps_entity, phone, address,
    emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
    current_belt_id, created_by
) VALUES (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '33333333-3333-4333-8333-333333333333',
    'CC', '1020304050', 'Carlos Andrés', 'Rodríguez Gómez',
    '1999-05-14', 'O+', 'EPS Sura', '3001234567', 'Calle 72 # 10-34, Bogotá',
    'María Elena Gómez', '3109876543', 'Madre',
    3, '11111111-1111-4111-8111-111111111111'
) ON CONFLICT (document_number) DO NOTHING;

-- Mensualidad inicial activa para el estudiante demo
INSERT INTO memberships (
    student_id, start_date, end_date, cycle_days, status, amount_paid,
    last_payment_confirmed_at, last_confirmed_by_admin_id, payment_reference
) VALUES (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '20 days',
    30, 'ACTIVA', 150000.00,
    NOW() - INTERVAL '10 days',
    '11111111-1111-4111-8111-111111111111',
    'RECIBO-INICIAL-001'
) ON CONFLICT (student_id) DO NOTHING;
