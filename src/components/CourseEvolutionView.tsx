import React from 'react';
import { CourseModule, Badge, StudentProfile } from '../types';
import {
  TrendingUp,
  CheckCircle2,
  Lock,
  Clock,
  Award,
  Sparkles,
  Layers,
  Star,
  Mic,
  ShieldCheck,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface CourseEvolutionViewProps {
  modules: CourseModule[];
  badges: Badge[];
  student: StudentProfile;
  attendanceRate: number;
  approvedHours: number;
  courseWorkloadHours?: number;
  onGoToCertificate: () => void;
}

export const CourseEvolutionView: React.FC<CourseEvolutionViewProps> = ({
  modules,
  badges,
  student,
  attendanceRate,
  courseWorkloadHours,
  onGoToCertificate,
}) => {
  const calculatedTotalHours = modules.reduce((acc, m) => acc + m.totalHours, 0);
  const totalCourseHours = courseWorkloadHours || calculatedTotalHours || 21;
  const completedCourseHours = totalCourseHours;
  const coursePercentage = 100;

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'ScanFace':
        return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-teal-600" />;
      case 'Star':
        return <Star className="w-5 h-5 text-amber-500" />;
      case 'Award':
        return <Award className="w-5 h-5 text-cyan-600" />;
      case 'Mic':
        return <Mic className="w-5 h-5 text-purple-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Main Progression */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
              <TrendingUp className="w-3.5 h-3.5" /> Trilha Pedagógica de Aprendizagem
            </div>
            <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">
              Evolução e Progresso no Curso
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Acompanhe seu avanço pelas 7 oficinas de aceleração de negócios, horas teóricas e práticas, 
              produção gastronômica e feira empreendedora do polo SASP.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0 text-center sm:text-right">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Carga Horária Total</span>
            <p className="text-2xl font-extrabold text-slate-900 font-['Space_Grotesk']">
              {completedCourseHours}h <span className="text-sm font-normal text-slate-500">/ {totalCourseHours}h</span>
            </p>
            <p className="text-xs text-emerald-700 font-bold mt-0.5">
              {coursePercentage}% do curso integralizado
            </p>
          </div>
        </div>

        {/* Global Progress Line */}
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Progresso Geral da Formação</span>
            <span className="text-emerald-700">{coursePercentage}% Concluído</span>
          </div>
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 rounded-full transition-all duration-700"
              style={{ width: `${coursePercentage}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-emerald-800 font-medium">Frequência das Oficinas</p>
                <p className="text-base font-extrabold text-emerald-900">{attendanceRate}%</p>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="bg-teal-50/70 p-3 rounded-xl border border-teal-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-teal-800 font-medium">Carga Horária Integralizada</p>
                <p className="text-base font-extrabold text-teal-900">{totalCourseHours}h de {totalCourseHours}h</p>
              </div>
              <Award className="w-5 h-5 text-teal-600" />
            </div>

            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-amber-800 font-medium">Insígnias Conquistadas</p>
                <p className="text-base font-extrabold text-amber-900">{badges.filter((b) => b.unlocked).length} de {badges.length}</p>
              </div>
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Course Modules Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-lg font-bold font-['Space_Grotesk'] text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          Estrutura Modular do Curso
        </h3>

        <div className="space-y-4">
          {modules.map((mod, index) => {
            const isCompleted = mod.status === 'concluido';
            return (
              <div
                key={mod.id}
                className={`p-5 rounded-2xl border transition ${
                  isCompleted
                    ? 'bg-white border-slate-200 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      0{index + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                          {mod.code}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          • {mod.totalHours} horas
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{mod.title}</h4>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold self-start sm:self-auto flex items-center gap-1 ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Concluído ({mod.completedHours}h)
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {mod.description}
                </p>

                {/* Competencies */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Competências:</span>
                  {mod.competencies.map((comp, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gamification / Badges Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold font-['Space_Grotesk'] text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Conquistas e Insígnias Empreendedoras
          </h3>
          <span className="text-xs font-semibold text-slate-500">
            {badges.filter((b) => b.unlocked).length} de {badges.length} desbloqueadas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-xl border flex items-start gap-3 transition ${
                b.unlocked
                  ? 'bg-slate-50/70 border-slate-200 shadow-xs'
                  : 'bg-slate-100/50 border-slate-200 opacity-60'
              }`}
            >
              <div className="p-2.5 bg-white rounded-xl shadow-xs border border-slate-100 shrink-0">
                {getBadgeIcon(b.icon)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{b.title}</h4>
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.2 rounded">
                    {b.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-snug">{b.description}</p>
                {b.unlockedDate && (
                  <p className="text-[10px] text-slate-400">Desbloqueado em: {b.unlockedDate}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Certificate */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-300">Pronto para a Certificação</span>
          <h3 className="text-xl font-bold font-['Space_Grotesk'] mt-0.5">
            Solicite o seu Certificado Oficial de Conclusão
          </h3>
          <p className="text-xs text-emerald-100/90 mt-1 max-w-xl">
            Valide com o seu CPF cadastrado para autenticar sua carga horária total de 120 horas e emitir seu documento digital.
          </p>
        </div>

        <button
          onClick={onGoToCertificate}
          className="px-6 py-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 shrink-0"
        >
          Acessar Certificação
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
