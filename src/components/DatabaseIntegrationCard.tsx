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
  Terminal,
  Zap,
  CheckCheck,
  Code
} from 'lucide-react';
import {
  isSupabaseConfigured,
  testSupabaseConnection,
  SupabaseHealthStatus,
  getNormalizedSupabaseConfig
} from '../lib/supabase';
import {
  FULL_MIGRATION_SQL,
  SCHEMA_MIGRATION_SQL,
  SEED_MIGRATION_SQL
} from '../lib/migrationSql';
import {
  batchPersistAttendanceToSupabase,
  persistStudentProfileToSupabase
} from '../services/supabasePersistenceService';
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
  const [activeTab, setActiveTab] = useState<'full' | 'schema' | 'seed' | 'instrucoes'>('full');
  const [copied, setCopied] = useState(false);

  const config = getNormalizedSupabaseConfig();
  const projectRef = health.projectRef || config.projectRef || 'fmgpvzvsuqrqenarqolb';
  const supabaseDashboardSqlUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

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
        error: e?.message || 'Falha no teste de conexão com o Supabase',
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    handleTestConnection();
  }, []);

  const getSqlContent = () => {
    switch (activeTab) {
      case 'full':
        return FULL_MIGRATION_SQL;
      case 'schema':
        return SCHEMA_MIGRATION_SQL;
      case 'seed':
        return SEED_MIGRATION_SQL;
      default:
        return FULL_MIGRATION_SQL;
    }
  };

  const getFileName = () => {
    switch (activeTab) {
      case 'full':
        return '20260913000000_full_migration.sql';
      case 'schema':
        return '20260913000001_initial_schema.sql';
      case 'seed':
        return '20260913000002_seed_data.sql';
      default:
        return 'migration.sql';
    }
  };

  const handleCopySql = () => {
    const textToCopy = getSqlContent();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSql = () => {
    const textToDownload = getSqlContent();
    const fileName = getFileName();
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
        const records: AttendanceRecord[] = Object.entries(student.attendanceByWorkshop).map(
          ([wsId, status]) => {
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
          }
        );

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
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold font-['Space_Grotesk'] text-slate-900">
                Integração Supabase & Migrações PostgreSQL
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                PostgreSQL 15+
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Esquemas relacionais oficiais, políticas de segurança Row Level Security (RLS) e sincronização em lote.
            </p>
          </div>
        </div>

        {/* Status Badge & Refresh Button */}
        <div className="flex items-center gap-2 shrink-0">
          {health.connected && !health.needsMigration ? (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-100/90 text-emerald-800 text-xs font-bold flex items-center gap-1.5 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Supabase Ativo & Migrado
            </span>
          ) : health.connected && health.needsMigration ? (
            <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 border border-amber-300 animate-pulse">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Conectado (Migração Pendente)
            </span>
          ) : health.configured ? (
            <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1.5 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Configurado (Não Conectado)
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200">
              <Server className="w-4 h-4 text-slate-500" />
              Modo Offline / Local Ativo
            </span>
          )}

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isChecking}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
            title="Verificar status da conexão"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Migration Pending Notification Banner with Direct Action */}
      {health.connected && health.needsMigration && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 shadow-xs space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="text-sm font-bold text-emerald-950 font-['Space_Grotesk'] flex items-center gap-2">
                Conexão Supabase Estabelecida com Sucesso!
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Seu projeto <code className="bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold text-emerald-950">{projectRef}.supabase.co</code> está respondendo. Para que a aplicação possa gravar presenças e dados dos alunos, basta executar a migração SQL gerada abaixo no seu painel Supabase.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-emerald-200/60">
            <button
              type="button"
              onClick={handleCopySql}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCheck className="w-4 h-4 text-white" />
                  <span>Copiado para Área de Transferência!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>1. Copiar Migração Completa (SQL)</span>
                </>
              )}
            </button>

            <a
              href={supabaseDashboardSqlUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <span>2. Abrir SQL Editor no Supabase</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isChecking}
              className="px-4 py-2 bg-white hover:bg-emerald-50 active:scale-95 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer ml-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>3. Verificar Novamente</span>
            </button>
          </div>
        </div>
      )}

      {/* Auto-inversion Fix Notice */}
      {health.invertedCredentialsFixed && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            <strong>Ajuste Automático:</strong> Detectamos que a URL e a chave estavam invertidas nas configurações e realizamos a correção automática sem falhas de conexão.
          </span>
        </div>
      )}

      {/* Error Banner */}
      {!health.connected && health.error && !health.needsMigration && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Status da Conexão:</span>
            <p className="text-amber-800">{health.error}</p>
          </div>
        </div>
      )}

      {/* Sync Action Strip (When fully migrated) */}
      {health.connected && !health.needsMigration && (
        <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-emerald-900">
            <span className="font-bold block">Sincronização Direta de Alunos e Presenças</span>
            <span className="text-emerald-700">
              Deseja sincronizar todos os {students.length} alunos e oficinas com as tabelas do Supabase?
            </span>
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Sub-Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('full')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'full'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Migração Completa (Recomendado)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('schema')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'schema'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Esquema DDL (Tabelas)
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
              3. Passo a Passo
            </button>
          </div>

          {/* Action Buttons */}
          {activeTab !== 'instrucoes' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySql}
                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
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
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar .sql</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Content: SQL Editor Preview */}
        {activeTab !== 'instrucoes' ? (
          <div className="relative rounded-2xl bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto max-h-96 border border-slate-800 shadow-inner">
            <div className="text-[11px] text-slate-400 pb-2 mb-3 border-b border-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-emerald-400" />
                supabase/migrations/{getFileName()}
              </span>
              <span className="text-emerald-400 font-sans font-bold">PostgreSQL DDL</span>
            </div>
            <pre className="text-slate-300 leading-relaxed select-all">
              {getSqlContent()}
            </pre>
          </div>
        ) : (
          /* Step-by-Step Instructions */
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 text-xs text-slate-700">
            <h3 className="text-sm font-bold text-slate-900 font-['Space_Grotesk'] flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Como Aplicar as Migrações no seu Supabase
            </h3>

            <ol className="space-y-3 list-decimal list-inside leading-relaxed text-slate-600 font-medium">
              <li>
                Acesse o painel do seu projeto no{' '}
                <a
                  href={supabaseDashboardSqlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 font-bold underline inline-flex items-center gap-0.5"
                >
                  Supabase Dashboard SQL Editor <ExternalLink className="w-3 h-3" />
                </a>.
              </li>
              <li>
                Clique na aba <strong>Migração Completa</strong> acima e clique no botão <strong>Copiar SQL</strong>.
              </li>
              <li>
                No editor SQL do Supabase, cole o código completo e clique no botão verde <strong>Run</strong> (ou aperte <kbd className="bg-slate-200 px-1 rounded text-[10px]">Ctrl</kbd> + <kbd className="bg-slate-200 px-1 rounded text-[10px]">Enter</kbd>).
              </li>
              <li>
                Volte nesta tela e clique no botão <strong>Verificar Conexão</strong>. As tabelas aparecerão como conectadas e prontas para uso!
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
