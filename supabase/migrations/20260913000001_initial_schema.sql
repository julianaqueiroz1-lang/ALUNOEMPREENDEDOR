-- ==============================================================================
-- MIGRAÇÃO INICIAL SUPABASE: PLATAFORMA ALUNO EMPREENDEDOR (SEDUC CE)
-- Versão: 20260913000001
-- Descrição: Criação das tabelas centrais, tipos, índices, triggers de atualização
--            e políticas de segurança (Row Level Security - RLS).
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Definição de Tipos e Enums
DO $$ BEGIN
  CREATE TYPE attendance_status AS ENUM ('presente', 'ausente', 'justificado');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE check_in_method AS ENUM ('biometria_facial', 'qr_code', 'manual', 'online_ead', 'batch_simultaneo');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('aluno', 'professor', 'coordenador');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_status AS ENUM ('aprovado', 'em_analise', 'pendente');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Função auxiliar para atualização automática de timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 4. TABELAS CENTRAIS
-- ==============================================================================

-- 4.1 Tabela de Alunos (Students Profile)
CREATE TABLE IF NOT EXISTS public.students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  cpf TEXT NOT NULL,
  matricula TEXT NOT NULL UNIQUE,
  course_name TEXT NOT NULL DEFAULT 'Aluno Empreendedor - Gestão & Negócios',
  turma TEXT NOT NULL DEFAULT 'Turma 2026.1',
  institution TEXT NOT NULL DEFAULT 'SEDUC-CE / Polo SASP',
  avatar_url TEXT,
  facial_enrolled BOOLEAN NOT NULL DEFAULT FALSE,
  facial_confidence NUMERIC(5, 2) DEFAULT NULL,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 4.2 Tabela de Professores e Coordenação SEDUC
CREATE TABLE IF NOT EXISTS public.teachers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'Coordenadora Pedagógica SEDUC',
  registration TEXT NOT NULL UNIQUE,
  polo TEXT NOT NULL DEFAULT 'Polo SASP / Fortaleza-CE',
  avatar_url TEXT,
  institution TEXT NOT NULL DEFAULT 'Secretaria da Educação do Estado do Ceará (SEDUC)',
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 4.3 Tabela de Palestrantes
CREATE TABLE IF NOT EXISTS public.speakers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  company TEXT NOT NULL,
  bio TEXT,
  avatar TEXT,
  expertise TEXT[] DEFAULT '{}',
  linkedin_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 4.4 Tabela de Oficinas (Workshops)
CREATE TABLE IF NOT EXISTS public.workshops (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration_hours NUMERIC(4, 1) NOT NULL DEFAULT 2.0,
  speaker_id TEXT REFERENCES public.speakers(id) ON DELETE SET NULL,
  speaker_name TEXT NOT NULL,
  speaker_role TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT 'Polo SASP - Auditório Principal',
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('concluida', 'hoje', 'proxima')),
  materials JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 4.5 Tabela de Frequência e Presença (Attendance)
CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY, -- Formato: {student_id}_{workshop_id}
  workshop_id TEXT NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  workshop_title TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  hours NUMERIC(4, 1) NOT NULL DEFAULT 2.0,
  status attendance_status NOT NULL DEFAULT 'presente',
  check_in_method check_in_method NOT NULL DEFAULT 'manual',
  check_in_time TEXT,
  location TEXT NOT NULL DEFAULT 'Polo SASP',
  is_simultaneous BOOLEAN NOT NULL DEFAULT FALSE,
  simultaneous_group_id TEXT,
  synced_from_offline_queue BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_student_workshop_attendance UNIQUE (student_id, workshop_id)
);

-- 4.6 Tabela de Avaliações de Oficina (Workshop Evaluations)
CREATE TABLE IF NOT EXISTS public.workshop_evaluations (
  id TEXT PRIMARY KEY, -- Formato: {workshop_id}_{student_id}
  workshop_id TEXT NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  workshop_title TEXT,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  speaker_rating SMALLINT NOT NULL CHECK (speaker_rating BETWEEN 1 AND 5),
  content_applicability SMALLINT NOT NULL CHECK (content_applicability BETWEEN 1 AND 5),
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_student_workshop_evaluation UNIQUE (student_id, workshop_id)
);

-- 4.7 Tabela de Atividades Complementares
CREATE TABLE IF NOT EXISTS public.complementary_activities (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  workload_hours NUMERIC(4, 1) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  proof_file_name TEXT,
  proof_file_data TEXT,
  status activity_status NOT NULL DEFAULT 'pendente',
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 4.8 Tabela de Posts de Momentos / Mural da Turma
CREATE TABLE IF NOT EXISTS public.moment_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  caption TEXT NOT NULL,
  image_url TEXT NOT NULL,
  date DATE NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  tags TEXT[] DEFAULT '{}',
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 4.9 Tabela de Notificações Push
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('workshop', 'deadline', 'announcement')),
  target_student_id TEXT NOT NULL DEFAULT 'all',
  target_tab TEXT,
  date DATE NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- 4.10 Tabela de Tokens de Dispositivos (FCM Push Web/Mobile)
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
  token TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  device TEXT NOT NULL DEFAULT 'web_pwa',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- ==============================================================================
-- 5. ÍNDICES DE DESEMPENHO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance (student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_workshop_id ON public.attendance (workshop_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance (status);
CREATE INDEX IF NOT EXISTS idx_evaluations_student_id ON public.workshop_evaluations (student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_workshop_id ON public.workshop_evaluations (workshop_id);
CREATE INDEX IF NOT EXISTS idx_activities_student_id ON public.complementary_activities (student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON public.notifications (target_student_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_student ON public.fcm_tokens (student_id);

-- ==============================================================================
-- 6. TRIGGERS DE ATUALIZAÇÃO AUTOMÁTICA
-- ==============================================================================
DROP TRIGGER IF EXISTS trg_students_updated_at ON public.students;
CREATE TRIGGER trg_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_attendance_updated_at ON public.attendance;
CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_workshops_updated_at ON public.workshops;
CREATE TRIGGER trg_workshops_updated_at
  BEFORE UPDATE ON public.workshops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_workshop_evaluations_updated_at ON public.workshop_evaluations;
CREATE TRIGGER trg_workshop_evaluations_updated_at
  BEFORE UPDATE ON public.workshop_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 7. SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Habilita RLS em todas as tabelas públicas
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complementary_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moment_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso Público Anon/Autenticado (Leitura para oficinas, palestrantes e momentos)
CREATE POLICY "Leitura pública de oficinas" ON public.workshops FOR SELECT USING (true);
CREATE POLICY "Leitura pública de palestrantes" ON public.speakers FOR SELECT USING (true);
CREATE POLICY "Leitura pública de momentos" ON public.moment_posts FOR SELECT USING (true);
CREATE POLICY "Leitura de perfil de professores" ON public.teachers FOR SELECT USING (true);

-- Políticas para Alunos e Presença
CREATE POLICY "Alunos podem visualizar seus próprios perfis" ON public.students
  FOR SELECT USING (true);

CREATE POLICY "Alunos e Coordenação podem atualizar perfis de alunos" ON public.students
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura de frequências" ON public.attendance
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserção e atualização de frequências" ON public.attendance
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir envio e leitura de avaliações" ON public.workshop_evaluations
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura e submissão de atividades complementares" ON public.complementary_activities
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir leitura de notificações" ON public.notifications
  FOR SELECT USING (true);

CREATE POLICY "Permitir registro de tokens FCM" ON public.fcm_tokens
  FOR ALL USING (true) WITH CHECK (true);

-- Habilitar publicação Realtime no Supabase para Presença e Notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
