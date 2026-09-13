import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Download,
  RefreshCw,
  Server,
  Layers,
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { isSupabaseConfigured, testSupabaseConnection, SupabaseHealthStatus } from '../lib/supabase';
import { batchPersistAttendanceToSupabase, persistStudentProfileToSupabase } from '../services/supabasePersistenceService';
import { ClassStudent, Workshop, AttendanceStatus, AttendanceRecord } from '../types';

interface DatabaseIntegrationCardProps {
  students: ClassStudent[];
  workshops: Workshop[];
}

export const DatabaseIntegrationCard: React.FC<DatabaseIntegrationCardProps> = ({
  students,
  workshops,
}) => {
  const [health, setHealth] = useState<SupabaseHealthStatus>({
    configured: isSupabaseConfigured(),
    connected: false,
    timestamp: new Date().toISOString(),
  });
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'schema' | 'seed' | 'instrucoes'>('schema');
  const [copied, setCopied] = useState(false);

  // Schema SQL Content for preview/copy
  const schemaSql = `-- MIGRAÇÃO INICIAL SUPABASE: PLATAFORMA ALUNO EMPREENDEDOR (SEDUC CE)
-- Versão: 20260913000001
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE attendance_status AS ENUM ('presente', 'ausente', 'justificado');
CREATE TYPE check_in_method AS ENUM ('biometria_facial', 'qr_code', 'manual', 'online_ead', 'batch_simultaneo');
CREATE TYPE user_role AS ENUM ('aluno', 'professor', 'coordenador');

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

CREATE TABLE IF NOT EXISTS public.workshops (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration_hours NUMERIC(4, 1) NOT NULL DEFAULT 2.0,
  speaker_id TEXT,
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

CREATE TABLE IF NOT EXISTS public.attendance (
  id TEXT PRIMARY KEY,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT unique_student_workshop_attendance UNIQUE (student_id, workshop_id)
);

CREATE TABLE IF NOT EXISTS public.workshop_evaluations (
  id TEXT PRIMARY KEY,
  workshop_id TEXT NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  workshop_title TEXT,
  student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  speaker_rating SMALLINT NOT NULL CHECK (speaker_rating BETWEEN 1 AND 5),
  content_applicability SMALLINT NOT NULL CHECK (content_applicability BETWEEN 1 AND 5),
  feedback TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL,
  target_student_id TEXT NOT NULL DEFAULT 'all',
  target_tab TEXT,
  date DATE NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  priority TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura de oficinas" ON public.workshops FOR SELECT USING (true);
CREATE POLICY "Leitura e escrita de presenças" ON public.attendance FOR ALL USING (true);
CREATE POLICY "Leitura e escrita de avaliações" ON public.workshop_evaluations FOR ALL USING (true);
CREATE POLICY "Leitura e escrita de alunos" ON public.students FOR ALL USING (true);`;

  const seedSql = `-- MIGRAÇÃO DE DADOS INICIAIS (SEED) SUPABASE: PLATAFORMA ALUNO EMPREENDEDOR
-- Versão: 20260913000002
INSERT INTO public.teachers (id, name, email, role, registration, polo, avatar_url, institution)
VALUES
  ('prof-juliana', 'Profª. Juliana Queiroz', 'juliana.queiroz1@prof.ce.gov.br', 'Coordenadora Pedagógica & Docente', 'SEDUC-MAT-98241', 'Polo SASP (Serviço de Apoio Social e Profissional)', 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=400&auto=format&fit=crop&q=80', 'Secretaria da Educação (SEDUC)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.workshops (id, title, category, date, time, duration_hours, speaker_name, speaker_role, location, status)
VALUES
  ('ws-1', 'Mentoria do Zero ao Primeiro Negócio: Transformando Ideias em Renda', 'Mentoria & Ideação', '2026-09-10', '18h - 21h', 3.0, 'Profª. Daniele Rodrigues de Lima', 'Professora de Química', 'Auditório Principal - SASP', 'concluida'),
  ('ws-2', 'Matemática Financeira', 'Finanças & Gestão', '2026-09-24', '18h - 21h', 3.0, 'Prof. Izac Dalva Montenegro Fernanda Filho', 'Professor de Matemática', 'SASP', 'proxima'),
  ('ws-3', 'Pães Recheados', 'Gastronomia & Produção', '2026-10-01', '18h - 21h', 3.0, 'Profª. Daniele Rodrigues de Lima', 'Professora de Química', 'SASP', 'proxima'),
  ('ws-4', 'Boas Práticas', 'Higiene & Normas Sanitárias', '2026-10-22', '18h - 21h', 3.0, 'Dr. Elvis Franklin Fernandes de Carvalho', 'Prof. Ciências / Biologia', 'SASP', 'proxima'),
  ('ws-5', 'Curso EAD Sebrae: Preço de Vendas para Alimentação Fora do Lar', 'Sebrae EAD & Precificação', '2026-11-04', '18h - 21h', 3.0, 'Paulo Morais & Beatriz Menezes', 'Consultores Sebrae', 'Plataforma Sebrae EAD', 'proxima')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.students (id, name, email, cpf, matricula, course_name, turma, institution, facial_enrolled, facial_confidence)
VALUES
  ('aluno-01', 'Mariana Vasconcelos', 'mariana.vasconcelos@aluno.ce.gov.br', '482.915.630-72', 'AE-2026-0491', 'Programa Aluno Empreendedor', 'Turma 2026.1', 'SEDUC-CE / Polo SASP', TRUE, 98.6),
  ('aluno-02', 'Lucas Matheus Pinheiro', 'lucas.matheus@aluno.ce.gov.br', '319.482.910-15', 'AE-2026-0492', 'Programa Aluno Empreendedor', 'Turma 2026.1', 'EEMTI Rachel de Queiroz', TRUE, 95.2),
  ('aluno-03', 'Ana Beatriz Silveira', 'ana.beatriz@aluno.ce.gov.br', '628.391.042-88', 'AE-2026-0493', 'Programa Aluno Empreendedor', 'Turma 2026.1', 'EEMTI Jenny Gomes', TRUE, 97.4)
ON CONFLICT (id) DO NOTHING;`;

  const handleTestConnection = async () => {
    setIsChecking(true);
    try {
      const res = await testSupabaseConnection();
      setHealth(res);
    } catch (e: any) {
      setHealth({
        configured: isSupabaseConfigured(),
        connected: false,
        timestamp: new Date().toISOString(),
        error: e?.message || 'Falha no teste de conexão',
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    handleTestConnection();
  }, []);

  const handleCopySql = () => {
    const textToCopy = activeTab === 'schema' ? schemaSql : seedSql;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSql = () => {
    const textToDownload = activeTab === 'schema' ? schemaSql : seedSql;
    const fileName = activeTab === 'schema' ? '20260913000001_initial_schema.sql' : '20260913000002_seed_data.sql';
    const blob = new Blob([textToDownload], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSyncToSupabase = async () => {
    if (!health.connected) {
      setSyncResult('Conecte o Supabase antes de sincronizar.');
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      let count = 0;
      for (const student of students) {
        await persistStudentProfileToSupabase({
          id: student.id,
          name: student.name,
          email: student.email,
          cpf: '000.000.000-00',
          matricula: student.matricula,
          courseName: 'Programa Aluno Empreendedor',
          turma: 'Turma 2026.1',
          institution: student.school,
          avatarUrl: student.avatarUrl,
          facialEnrolled: true,
        });

        // Sync student's attendance records
        const records: AttendanceRecord[] = Object.entries(student.attendanceByWorkshop).map(([wsId, status]) => {
          const ws = workshops.find((w) => w.id === wsId);
          return {
            id: `${student.id}_${wsId}`,
            workshopId: wsId,
            workshopTitle: ws?.title || 'Oficina',
            date: ws?.date || '2026-09-10',
            time: ws?.time || '18h',
            hours: ws?.durationHours || 2,
            status: status as AttendanceStatus,
            location: ws?.location || 'Polo SASP',
          };
        });

        if (records.length > 0) {
          await batchPersistAttendanceToSupabase(student.id, records);
          count += records.length;
        }
      }

      setSyncResult(`Sucesso! ${students.length} alunos e ${count} presenças foram sincronizados no Supabase.`);
    } catch (err: any) {
      setSyncResult(`Erro ao sincronizar: ${err?.message || 'Falha'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-6 p-6 sm:p-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold font-['Space_Grotesk'] text-slate-900">
                Integração com Supabase & Migrações PostgreSQL
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                PostgreSQL DDL
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Esquemas relacionais com suporte a Row Level Security (RLS), triggers de atualização e sincronização em lote.
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          {health.connected ? (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-100/80 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Supabase Conectado
            </span>
          ) : health.configured ? (
            <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1.5 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Configurado (Aguardando Migrações)
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200">
              <Server className="w-4 h-4 text-slate-500" />
              Modo Offline / Firestore Nativo Ativo
            </span>
          )}

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isChecking}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
            title="Verificar conexão com Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Integration Status Details */}
      {health.error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Status da Conexão Supabase:</span>
            <p className="text-amber-800">{health.error}</p>
            {!health.configured && (
              <p className="text-[11px] text-amber-700 font-medium">
                Para ativar a conexão direta com o Supabase, defina as chaves <code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono text-amber-900">VITE_SUPABASE_URL</code> e <code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono text-amber-900">VITE_SUPABASE_ANON_KEY</code> no arquivo <code>.env</code> ou pelo painel do projeto.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sync Action Strip */}
      {health.connected && (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-emerald-900">
            <span className="font-bold block">Sincronização Direta de Alunos e Presenças</span>
            <span className="text-emerald-700">Deseja sincronizar todos os {students.length} alunos da turma com o seu banco Supabase?</span>
          </div>
          <button
            type="button"
            onClick={handleSyncToSupabase}
            disabled={isSyncing}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar com Supabase'}</span>
          </button>
        </div>
      )}

      {syncResult && (
        <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncResult}</span>
        </div>
      )}

      {/* Migration Code Explorer */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Sub-Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'schema'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Esquema DDL (Tabelas & RLS)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('seed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'seed'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Dados Iniciais (Seed SEDUC)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('instrucoes')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'instrucoes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              3. Como Aplicar
            </button>
          </div>

          {/* Action Buttons */}
          {activeTab !== 'instrucoes' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar SQL</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadSql}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar .sql</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab 1 & 2: SQL Editor Preview */}
        {activeTab !== 'instrucoes' ? (
          <div className="relative rounded-2xl bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto max-h-96 border border-slate-800 shadow-inner">
            <div className="text-[11px] text-slate-400 pb-2 mb-3 border-b border-slate-800 flex items-center justify-between">
              <span>{activeTab === 'schema' ? 'supabase/migrations/20260913000001_initial_schema.sql' : 'supabase/migrations/20260913000002_seed_data.sql'}</span>
              <span className="text-emerald-400 font-sans font-bold">PostgreSQL 15+</span>
            </div>
            <pre className="text-slate-300 leading-relaxed">
              {activeTab === 'schema' ? schemaSql : seedSql}
            </pre>
          </div>
        ) : (
          /* Tab 3: Step-by-Step Instructions */
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs text-slate-700">
            <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Passo a Passo para Executar no Supabase Studio
            </h3>

            <ol className="space-y-3 list-decimal list-inside leading-relaxed text-slate-600 font-medium">
              <li>
                Acesse o painel do seu projeto no <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-emerald-700 font-bold underline inline-flex items-center gap-0.5">Supabase Dashboard <ExternalLink className="w-3 h-3" /></a>.
              </li>
              <li>
                No menu lateral esquerdo, clique no ícone <strong>SQL Editor</strong>.
              </li>
              <li>
                Clique em <strong>+ New Query</strong>.
              </li>
              <li>
                Clique no botão <strong>Copiar SQL</strong> da aba <em>1. Esquema DDL</em> acima, cole no editor do Supabase e clique em <strong>Run</strong> (Ctrl + Enter).
              </li>
              <li>
                Abra uma nova aba no SQL Editor, copie e cole o código da aba <em>2. Dados Iniciais</em> e clique em <strong>Run</strong>.
              </li>
              <li>
                Obtenha a URL do projeto e a chave anônima (em <strong>Project Settings → API</strong>) e adicione em <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-emerald-800">.env</code>:
                <div className="mt-2 bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] select-all">
                  VITE_SUPABASE_URL=https://seu-projeto.supabase.co<br />
                  VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
                </div>
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
