-- =============================================================================
-- SCRIPT SQL 01: ESQUEMA NUCLEAR (USUARIOS, ROLES, CINTURONES, ESTUDIANTES, DOCS)
-- Sistema Híbrido de Gestión de Dojo
-- Regla de Ingeniería: Archivo modular < 300 líneas, documentado en español.
-- =============================================================================

-- Habilitar extensión para generación de identificadores únicos UUID v4 y criptografía
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TIPOS ENUMERADOS DEL DOMINIO DEL DOJO
-- =============================================================================

-- Roles estrictos del sistema según especificación de arquitectura
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'AYUDANTE', 'ESTUDIANTE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Tipos de documentos de identidad aceptados en el Dojo
DO $$ BEGIN
    CREATE TYPE doc_type_enum AS ENUM ('CC', 'TI', 'CE', 'PASAPORTE');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Grupos sanguíneos y factor RH (extraídos por OCR o ingresados manualmente)
DO $$ BEGIN
    CREATE TYPE blood_type_enum AS ENUM ('O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Tipos de archivos adjuntos soportados en el expediente del estudiante
DO $$ BEGIN
    CREATE TYPE document_category_enum AS ENUM ('FOTO_PERFIL', 'CEDULA_CIUDADANIA', 'CERTIFICADO_EPS', 'OTRO');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 2. TABLA: users (Cuentas de Acceso y Autenticación Persistente)
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- El username suele ser el número de documento (Cédula) para login rápido del Estudiante
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'ESTUDIANTE',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    -- Token de refresco o identificador de dispositivo para sesión persistente en Android
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Cuentas de usuario para acceso Web y App Android con control de roles RBAC.';
COMMENT ON COLUMN users.username IS 'Identificador único de login (número de cédula para estudiantes o alias para staff).';
COMMENT ON COLUMN users.role IS 'Rol asignado: ADMIN (control total), AYUDANTE (operativo de clase), ESTUDIANTE (app móvil).';

-- =============================================================================
-- 3. TABLA: refresh_tokens (Sesiones Persistentes para App Android y Web)
-- =============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE refresh_tokens IS 'Almacena tokens de larga duración para mantener la sesión iniciada por defecto en Android.';

-- =============================================================================
-- 4. TABLA: belts (Catálogo Maestro de Cinturones / Grados del Dojo)
-- =============================================================================
CREATE TABLE IF NOT EXISTS belts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE,
    color_hex VARCHAR(7) NOT NULL,
    secondary_color_hex VARCHAR(7),
    rank_order INT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE belts IS 'Catálogo ordenado jerárquicamente de cinturones (Blanco a Negro).';
COMMENT ON COLUMN belts.rank_order IS 'Orden numérico ascendente del grado (1 = Blanco, 2 = Amarillo, etc.).';

-- =============================================================================
-- 5. TABLA: students (Ficha Integral del Estudiante de Artes Marciales)
-- =============================================================================
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Relación 1 a 1 con su cuenta de usuario para login en la App Android
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    document_type doc_type_enum NOT NULL DEFAULT 'CC',
    document_number VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birth_date DATE,
    blood_type blood_type_enum NOT NULL,
    eps_entity VARCHAR(120) NOT NULL,
    phone VARCHAR(30),
    address VARCHAR(250),
    -- Datos obligatorios de contacto de emergencia
    emergency_contact_name VARCHAR(150) NOT NULL,
    emergency_contact_phone VARCHAR(30) NOT NULL,
    emergency_contact_relationship VARCHAR(60),
    -- Cinturón actual del estudiante
    current_belt_id INT NOT NULL REFERENCES belts(id) ON DELETE RESTRICT,
    -- Rutas rápidas a los archivos principales
    profile_photo_url TEXT,
    id_card_doc_url TEXT,
    eps_certificate_url TEXT,
    -- Observaciones médicas o lesiones relevantes para el entrenamiento
    medical_notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    enrolled_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE students IS 'Ficha maestra de estudiantes con datos personales, RH, EPS, contacto de emergencia y cinturón.';
COMMENT ON COLUMN students.blood_type IS 'Grupo sanguíneo y RH extraído por OCR o verificado por ADMIN.';
COMMENT ON COLUMN students.eps_entity IS 'Entidad Promotora de Salud vigente extraída del certificado EPS.';

-- =============================================================================
-- 6. TABLA: belt_promotions (Historial de Ascensos de Cinturón)
-- =============================================================================
CREATE TABLE IF NOT EXISTS belt_promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    previous_belt_id INT REFERENCES belts(id) ON DELETE SET NULL,
    new_belt_id INT NOT NULL REFERENCES belts(id) ON DELETE RESTRICT,
    promoted_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    promotion_date DATE NOT NULL DEFAULT CURRENT_DATE,
    exam_score NUMERIC(5,2),
    sensei_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE belt_promotions IS 'Bitácora histórica de cada examen y ascenso de cinturón alcanzado por el estudiante.';

-- =============================================================================
-- 7. TABLA: student_documents (Documentos Escaneados y Resultado Crudo de OCR)
-- =============================================================================
CREATE TABLE IF NOT EXISTS student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    category document_category_enum NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    mime_type VARCHAR(80) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    -- Datos estructurados que el motor OCR extrajo automáticamente de la imagen/PDF
    ocr_extracted_json JSONB,
    ocr_confidence NUMERIC(5,2),
    uploaded_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE student_documents IS 'Almacena metadatos de Foto, Cédula (CC) y EPS junto con el JSON extraído por el motor OCR.';

-- Índices de rendimiento para búsquedas frecuentes por cédula, nombre y estado
CREATE INDEX IF NOT EXISTS idx_students_document_number ON students(document_number);
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_current_belt ON students(current_belt_id);
CREATE INDEX IF NOT EXISTS idx_belt_promotions_student ON belt_promotions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_student ON student_documents(student_id);
