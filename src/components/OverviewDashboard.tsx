import React from 'react';
import {
  StudentProfile,
  Workshop,
  AttendanceRecord,
  ComplementaryActivity,
  MomentPost,
  NavigationTab,
} from '../types';
import {
  Sparkles,
  ShieldCheck,
  Calendar,
  CheckSquare,
  Award,
  MessageSquare,
  Image,
  TrendingUp,
  FileCheck,
  ArrowRight,
  Clock,
  MapPin,
  ChevronRight,
  Star
} from 'lucide-react';

interface OverviewDashboardProps {
  student: StudentProfile;
  workshops: Workshop[];
  attendanceRecords: AttendanceRecord[];
  activities: ComplementaryActivity[];
  moments: MomentPost[];
  courseWorkloadHours?: number;
  onUpdateCourseWorkloadHours?: (hours: number) => void;
  onNavigate: (tab: NavigationTab) => void;
  onOpenEvaluation: (workshop: Workshop) => void;
  onCheckInNow: (workshopId: string) => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  student,
  workshops,
  attendanceRecords,
  activities,
  moments,
  courseWorkloadHours = 21,
  onUpdateCourseWorkloadHours,
  onNavigate,
  onOpenEvaluation,
  onCheckInNow,
}) => {
  const [isWorkloadModalOpen, setIsWorkloadModalOpen] = React.useState(false);
  const [tempHours, setTempHours] = React.useState(courseWorkloadHours);

  React.useEffect(() => {
    setTempHours(courseWorkloadHours);
  }, [courseWorkloadHours]);

  const attendedCount = attendanceRecords.filter((r) => r.status === 'presente').length;
  const attendanceRate = attendanceRecords.length > 0 ? Math.round((attendedCount / attendanceRecords.length) * 100) : 0;
  const currentCourseHours = courseWorkloadHours || 21;

  // Workshop today or upcoming
  const todayWorkshop = workshops.find((w) => w.status === 'hoje') || workshops[3];
  const pendingEvaluationWorkshop = workshops.find((w) => w.status === 'concluida' && !w.evaluation);

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-5 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 pointer-events-none" />
        <div className="absolute bottom-0 right-32 -mb-16 w-48 h-48 rounded-full bg-amber-400/10 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className="relative shrink-0">
              <img
                src={student.avatarUrl}
                alt={student.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-emerald-400/50 shadow-md cursor-pointer hover:opacity-90 transition"
                onClick={() => onNavigate('frequencia')}
                title="Clique para ver seu histórico de frequência e biometria"
              />
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full ring-2 ring-emerald-900" title="Biometria Ativa">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full font-bold border border-emerald-400/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Aluno Empreendedor Ativo
                </span>
                <span className="text-xs bg-white/15 text-white px-2 py-0.5 rounded-full font-medium">
                  {student.turma || 'Turma 2026.1'}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-['Space_Grotesk'] tracking-tight truncate">
                Olá, {student.name}!
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/80">
                Matrícula: <strong className="text-white">{student.matricula}</strong> • CPF:{' '}
                <strong className="text-white">{student.cpf}</strong>
              </p>

              {/* Quick Navigation Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => onNavigate('cronograma')}
                  className="text-[11px] bg-white/10 hover:bg-white/20 active:scale-95 text-emerald-100 px-2.5 py-1 rounded-lg border border-white/15 transition flex items-center gap-1 cursor-pointer"
                >
                  <Calendar className="w-3 h-3 text-emerald-300" />
                  Oficinas
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('frequencia')}
                  className="text-[11px] bg-white/10 hover:bg-white/20 active:scale-95 text-emerald-100 px-2.5 py-1 rounded-lg border border-white/15 transition flex items-center gap-1 cursor-pointer"
                >
                  <CheckSquare className="w-3 h-3 text-emerald-300" />
                  Presenças
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('palestrantes')}
                  className="text-[11px] bg-white/10 hover:bg-white/20 active:scale-95 text-emerald-100 px-2.5 py-1 rounded-lg border border-white/15 transition flex items-center gap-1 cursor-pointer"
                >
                  <Star className="w-3 h-3 text-amber-300" />
                  Professores
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 pt-2 sm:pt-0">
            <button
              id="btn-banner-chat"
              onClick={() => onNavigate('chat_duvidas')}
              className="px-4 py-3 bg-white/20 hover:bg-white/30 active:scale-95 backdrop-blur-md text-white text-xs font-bold rounded-xl border border-white/25 transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <MessageSquare className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Tirar Dúvida no Chat</span>
            </button>
            <button
              id="btn-banner-certificate"
              onClick={() => onNavigate('certificacao')}
              className="px-4 py-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4 shrink-0" />
              <span>Acessar Certificado</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Frequencia */}
        <div
          id="stat-card-frequencia"
          onClick={() => onNavigate('frequencia')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-400 active:scale-[0.98] transition cursor-pointer group"
          title="Clique para ver o histórico detalhado de presenças"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-100 transition">
              <CheckSquare className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              Mínimo 75%
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-3">Frequência Geral</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">
              {attendanceRate}%
            </span>
            <span className="text-xs text-slate-500">{attendedCount} de {attendanceRecords.length} presenças</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${attendanceRate}%` }} />
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-700 font-semibold group-hover:translate-x-0.5 transition">
            <span>Ver Registro Completo</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: Carga Horária Total (Ajustável) */}
        <div
          id="stat-card-horas"
          onClick={() => setIsWorkloadModalOpen(true)}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-teal-400 active:scale-[0.98] transition cursor-pointer group relative"
          title="Clique para ajustar a carga horária do curso"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center group-hover:bg-teal-100 transition">
              <Clock className="w-5 h-5" />
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsWorkloadModalOpen(true);
              }}
              className="text-[11px] font-bold text-teal-800 bg-teal-100 hover:bg-teal-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 transition cursor-pointer"
            >
              <span>Ajustar Horas</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-3">Carga Horária do Programa</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">
              {currentCourseHours}h
            </span>
            <span className="text-xs text-emerald-600 font-semibold">100% integralizada</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-teal-500 rounded-full" style={{ width: '100%' }} />
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-teal-700 font-semibold group-hover:translate-x-0.5 transition">
            <span>Clique para Ajustar</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: Oficinas & Treinamentos */}
        <div
          id="stat-card-oficinas"
          onClick={() => onNavigate('cronograma')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-purple-400 active:scale-[0.98] transition cursor-pointer group"
          title="Clique para ver todas as oficinas e cronograma"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-100 transition">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
              Polo SASP & EAD
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-3">Oficinas do Programa</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">
              {workshops.length} Encontros
            </span>
            <span className="text-xs text-slate-500">18h às 21h (3h/cada)</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full" style={{ width: '100%' }} />
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-purple-700 font-semibold group-hover:translate-x-0.5 transition">
            <span>Ver Cronograma</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 4: Momentos */}
        <div
          id="stat-card-momentos"
          onClick={() => onNavigate('momentos')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-400 active:scale-[0.98] transition cursor-pointer group"
          title="Clique para abrir a galeria e mural de momentos"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-100 transition">
              <Image className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
              Mural Ativo
            </span>
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-3">Momentos Registrados</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">
              {moments.length}
            </span>
            <span className="text-xs text-slate-500">Fotos & Diário</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '80%' }} />
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-700 font-semibold group-hover:translate-x-0.5 transition">
            <span>Ver Mural de Fotos</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Highlight: Workshop happening today or next */}
      {todayWorkshop && (
        <div className="bg-white rounded-2xl p-6 border-2 border-emerald-500/40 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-600 text-white animate-pulse">
                  Em Destaque no Cronograma
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {todayWorkshop.category}
                </span>
              </div>

              <h3 className="text-lg font-bold font-['Space_Grotesk'] text-slate-900">
                {todayWorkshop.title}
              </h3>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> {todayWorkshop.date}
                </span>
                <span className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-emerald-600" /> {todayWorkshop.time}
                </span>
                <span className="flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {todayWorkshop.location && todayWorkshop.location !== 'Auditório Principal & Sala Maker' ? todayWorkshop.location : 'SASP'}
                </span>
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-500">Palestrante Responsável:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80">
                  {todayWorkshop.speakerName}
                  {todayWorkshop.speakerRole && (
                    <span className="text-[11px] font-medium text-emerald-700">({todayWorkshop.speakerRole})</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 pt-2 md:pt-0">
              <button
                type="button"
                onClick={() => onOpenEvaluation(todayWorkshop)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Star className="w-4 h-4 fill-slate-950" />
                Avaliar Oficina
              </button>
              <button
                type="button"
                onClick={() => onNavigate('cronograma')}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Ver Cronograma Completo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Recent Moments + Quick Mentor Query */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Moments Gallery Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold font-['Space_Grotesk'] text-base text-slate-900 flex items-center gap-2">
              <Image className="w-4 h-4 text-emerald-600" />
              Últimos Momentos Registrados
            </h3>
            <button
              onClick={() => onNavigate('momentos')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              Ver todos ({moments.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {moments.slice(0, 3).map((m) => (
              <div
                key={m.id}
                onClick={() => onNavigate('momentos')}
                className="group cursor-pointer rounded-xl overflow-hidden border border-slate-200 bg-slate-50 transition hover:shadow-md"
              >
                <div className="aspect-4/3 overflow-hidden">
                  <img
                    src={m.imageUrl}
                    alt={m.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs font-bold text-slate-900 truncate">{m.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{m.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Mentor Box */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Tira-Dúvidas 24/7</span>
            </div>
            <h3 className="text-lg font-bold font-['Space_Grotesk'] leading-snug">
              Precisa de ajuda com seu pitch, custos ou modelo de negócio?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              O Mentor Virtual do Aluno Empreendedor responde com dicas práticas de Canvas, validação e precificação.
            </p>
          </div>

          <button
            onClick={() => onNavigate('chat_duvidas')}
            className="mt-6 w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Abrir Chat do Mentor
          </button>
        </div>
      </div>

      {/* Modal de Ajuste de Carga Horária */}
      {isWorkloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Ajustar Carga Horária</h3>
                  <p className="text-xs text-slate-500">Defina o total de horas do programa</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkloadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Carga Horária Total (Horas):
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={tempHours}
                  onChange={(e) => setTempHours(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 font-bold text-lg focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none"
                />
              </div>

              <div>
                <span className="text-[11px] font-semibold text-slate-500">Atalhos rápidos:</span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {[20, 21, 24, 30, 40, 60].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setTempHours(h)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                        tempHours === h
                          ? 'bg-teal-600 text-white border-teal-600'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                      }`}
                    >
                      {h}h {h === 21 && '(7 oficinas × 3h)'}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                💡 Esta carga horária será refletida automaticamente no <strong>Dashboard</strong>, na <strong>Evolução do Curso</strong> e na emissão do <strong>Certificado Oficial</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsWorkloadModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onUpdateCourseWorkloadHours && tempHours > 0) {
                    onUpdateCourseWorkloadHours(tempHours);
                  }
                  setIsWorkloadModalOpen(false);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition"
              >
                Salvar Carga Horária
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
