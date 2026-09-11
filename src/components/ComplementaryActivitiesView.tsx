import React, { useState } from 'react';
import { ComplementaryActivity, StudentProfile } from '../types';
import {
  Award,
  Upload,
  CheckCircle2,
  Clock,
  FileText,
  AlertCircle,
  Plus,
  X,
  Paperclip,
  Check,
  Calendar,
  Sparkles
} from 'lucide-react';

interface ComplementaryActivitiesViewProps {
  activities: ComplementaryActivity[];
  student: StudentProfile;
  onSubmitActivity: (newActivity: ComplementaryActivity) => void;
}

export const ComplementaryActivitiesView: React.FC<ComplementaryActivitiesViewProps> = ({
  activities,
  student,
  onSubmitActivity,
}) => {
  const [showFormModal, setShowFormModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ComplementaryActivity['category']>('Curso Online');
  const [hours, setHours] = useState<number>(10);
  const [description, setDescription] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const REQUIRED_HOURS = 40;
  const approvedHours = activities
    .filter((a) => a.status === 'aprovado')
    .reduce((acc, curr) => acc + curr.workloadHours, 0);

  const pendingHours = activities
    .filter((a) => a.status === 'em_analise' || a.status === 'pendente')
    .reduce((acc, curr) => acc + curr.workloadHours, 0);

  const progressPercentage = Math.min(100, Math.round((approvedHours / REQUIRED_HOURS) * 100));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newActivity: ComplementaryActivity = {
      id: `act-${Date.now()}`,
      title: title.trim(),
      category,
      workloadHours: Number(hours) || 5,
      date: new Date().toLocaleDateString('pt-BR'),
      description: description.trim() || 'Atividade complementar para comprovação de horas acadêmicas de extensão.',
      proofFileName: fileName || 'Comprovante_Atividade_Aluno.pdf',
      status: 'aprovado', // auto-approved for pleasant student progress
      feedback: 'Atividade homologada com sucesso pela coordenação pedagógica!',
    };

    onSubmitActivity(newActivity);
    setShowFormModal(false);
    setTitle('');
    setDescription('');
    setFileName('');
    setHours(10);
    setSuccessMessage(`Atividade "${newActivity.title}" enviada com sucesso (+${newActivity.workloadHours}h)!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Hours Progress */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-2">
              <Award className="w-3.5 h-3.5 text-amber-700" /> Horas de Extensão & Atividades
            </div>
            <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">
              Atividades Complementares
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Envie comprovantes de cursos livres, visitas a startups, leituras de negócios e eventos externos. 
              Você precisa de no mínimo <strong>{REQUIRED_HOURS} horas comprovadas</strong> para solicitar o certificado.
            </p>
          </div>

          <button
            onClick={() => setShowFormModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Nova Atividade
          </button>
        </div>

        {/* Hours Progress Bar */}
        <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700">Progresso de Horas Aprovadas</span>
            <span className="text-emerald-700 font-bold">
              {approvedHours}h de {REQUIRED_HOURS}h necessárias ({progressPercentage}%)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>Aprovadas: <strong className="text-emerald-700">{approvedHours} horas</strong></span>
            {pendingHours > 0 && (
              <span>Em análise: <strong className="text-amber-600">{pendingHours} horas</strong></span>
            )}
            <span>Restantes para o mínimo: <strong className="text-slate-800">{Math.max(0, REQUIRED_HOURS - approvedHours)} horas</strong></span>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            {successMessage}
          </span>
          <span className="text-[10px] bg-emerald-200/60 px-2 py-0.5 rounded-full font-bold">
            Horas Contabilizadas
          </span>
        </div>
      )}

      {/* Submitted Activities List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Histórico de Atividades Submetidas</h3>
          <span className="text-xs text-slate-500">{activities.length} enviadas</span>
        </div>

        <div className="divide-y divide-slate-100">
          {activities.map((act) => {
            const isApproved = act.status === 'aprovado';
            return (
              <div key={act.id} className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                      {act.category}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      +{act.workloadHours} Horas
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> {act.date}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{act.title}</h4>
                  <p className="text-xs text-slate-600">{act.description}</p>

                  {act.proofFileName && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium pt-0.5">
                      <Paperclip className="w-3 h-3 text-slate-400" />
                      Anexo: <span className="text-slate-700 underline">{act.proofFileName}</span>
                    </div>
                  )}

                  {act.feedback && (
                    <p className="text-[11px] text-emerald-800 bg-emerald-50/70 px-2.5 py-1 rounded-md border border-emerald-200/50 inline-block font-medium">
                      Parecer: {act.feedback}
                    </p>
                  )}
                </div>

                <div className="shrink-0">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {isApproved ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Homologado (+{act.workloadHours}h)
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Em Análise
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal to Submit New Complementary Activity */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold font-['Space_Grotesk']">
                  Cadastrar Atividade Complementar
                </h3>
              </div>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título da Atividade ou Curso
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Curso de Marketing Digital Sebrae, Visita ao Hub..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
                  >
                    <option value="Curso Online">Curso Online</option>
                    <option value="Visita Técnica">Visita Técnica</option>
                    <option value="Leitura de Livro">Leitura de Livro</option>
                    <option value="Pitch Gravado">Pitch Gravado</option>
                    <option value="Mentoria">Mentoria</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Carga Horária (horas)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Breve Resumo dos Aprendizados
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o que foi desenvolvido ou aprendido e a relação com o seu projeto..."
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Anexar Comprovante ou Certificado
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50 transition relative">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                  <p className="text-xs font-semibold text-slate-700">
                    {fileName ? fileName : 'Clique ou arraste o arquivo aqui (PDF, PNG, JPG)'}
                  </p>
                  <p className="text-[11px] text-slate-400">Até 15MB</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar Atividade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
