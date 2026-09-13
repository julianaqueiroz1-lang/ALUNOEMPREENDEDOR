import React, { useState, useRef } from 'react';
import { Workshop, AttendanceRecord } from '../types';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Star,
  Download,
  CheckCircle,
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
  BookOpen,
  Plus,
  UploadCloud,
  Trash2,
  X,
  Upload,
  FolderOpen,
  Columns,
  List,
  Zap,
  CheckSquare,
  Building2,
  ShieldCheck
} from 'lucide-react';

interface ScheduleAndWorkshopsViewProps {
  workshops: Workshop[];
  onOpenEvaluation: (workshop: Workshop) => void;
  onGoToSpeakers: () => void;
  onUpdateWorkshop?: (workshop: Workshop) => void;
  attendanceRecords?: AttendanceRecord[];
  onBatchCheckIn?: (workshopIds: string[]) => void;
  onCheckInNow?: (workshopId: string) => void;
}

export const ScheduleAndWorkshopsView: React.FC<ScheduleAndWorkshopsViewProps> = ({
  workshops,
  onOpenEvaluation,
  onGoToSpeakers,
  onUpdateWorkshop,
  attendanceRecords = [],
  onBatchCheckIn,
  onCheckInNow,
}) => {
  const [activeFilter, setActiveFilter] = useState<'todos' | 'hoje' | 'concluida' | 'proxima'>('todos');
  const [viewLayout, setViewLayout] = useState<'lista' | 'salas_concorrentes'>('lista');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [batchActionNotice, setBatchActionNotice] = useState<string | null>(null);

  // Modal for teacher to feed/upload material
  const [uploadModalWorkshop, setUploadModalWorkshop] = useState<Workshop | null>(null);
  const [materialName, setMaterialName] = useState('');
  const [materialType, setMaterialType] = useState('PDF');
  const [materialSize, setMaterialSize] = useState('2.4 MB');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const simultaneousWorkshops = workshops.filter((w) => w.isSimultaneous);
  const simultaneousIds = simultaneousWorkshops.map((w) => w.id);
  const attendedSimultaneousCount = attendanceRecords.filter(
    (r) => simultaneousIds.includes(r.workshopId) && r.status === 'presente'
  ).length;
  const isAllSimultaneousAttended =
    simultaneousWorkshops.length > 0 && attendedSimultaneousCount === simultaneousWorkshops.length;

  const handleRunBatchCheckIn = () => {
    if (onBatchCheckIn && simultaneousIds.length > 0) {
      onBatchCheckIn(simultaneousIds);
      setBatchActionNotice(`Check-in em lote confirmado para as ${simultaneousIds.length} oficinas simultâneas!`);
      setTimeout(() => setBatchActionNotice(null), 4500);
    }
  };

  const filteredWorkshops = workshops.filter((w) => {
    if (activeFilter === 'todos') return true;
    return w.status === activeFilter;
  });

  const handleDownloadMaterial = (fileName: string) => {
    setDownloadNotice(`Download iniciado: ${fileName}`);
    setTimeout(() => setDownloadNotice(null), 3500);
  };

  const handleFileSelect = (file: File) => {
    setMaterialName(file.name);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setMaterialSize(`${sizeInMb} MB`);
    const ext = file.name.split('.').pop()?.toUpperCase() || 'PDF';
    if (['PDF', 'PPTX', 'PPT', 'XLSX', 'XLS', 'DOCX', 'DOC', 'ZIP'].includes(ext)) {
      setMaterialType(ext);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadModalWorkshop || !materialName.trim()) return;

    const newMaterial = {
      name: materialName.trim(),
      type: materialType,
      size: materialSize || '1.5 MB',
    };

    const updatedWorkshop: Workshop = {
      ...uploadModalWorkshop,
      materials: [...uploadModalWorkshop.materials, newMaterial],
    };

    if (onUpdateWorkshop) {
      onUpdateWorkshop(updatedWorkshop);
    }

    setDownloadNotice(`Material "${newMaterial.name}" disponibilizado com sucesso!`);
    setTimeout(() => setDownloadNotice(null), 4000);
    setUploadModalWorkshop(null);
    setMaterialName('');
  };

  const handleRemoveMaterial = (workshop: Workshop, materialNameToRemove: string) => {
    const updatedWorkshop: Workshop = {
      ...workshop,
      materials: workshop.materials.filter((m) => m.name !== materialNameToRemove),
    };
    if (onUpdateWorkshop) {
      onUpdateWorkshop(updatedWorkshop);
    }
    setDownloadNotice(`Material removido da oficina.`);
    setTimeout(() => setDownloadNotice(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5" /> Cronograma Oficial do Programa
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-700" /> Horário das Oficinas: 18h - 21h
            </span>
          </div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">
            Oficinas Práticas & Treinamentos
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Acompanhe o cronograma com encontros quinzenais das <strong>18h às 21h</strong>, materiais para download e avaliações de cada módulo.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onGoToSpeakers}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            Conhecer Palestrantes
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {downloadNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-semibold text-emerald-900 flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            {downloadNotice}
          </span>
          <span className="text-[11px] text-emerald-700">Material salvo com sucesso</span>
        </div>
      )}

      {batchActionNotice && (
        <div className="p-3.5 bg-teal-50 border border-teal-300 rounded-xl text-xs font-semibold text-teal-900 flex items-center justify-between animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-teal-600" />
            {batchActionNotice}
          </span>
          <span className="text-[11px] text-teal-700">Sincronizado</span>
        </div>
      )}

      {/* Concurrent Workshops Banner & 1-Click Batch Check-in */}
      {simultaneousWorkshops.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl p-5 border border-emerald-800/60 shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-emerald-300" />
                  Sessões Simultâneas no Polo SASP
                </span>
                <span className="text-xs text-slate-300 font-medium">Hoje • 18h às 21h</span>
              </div>
              <h3 className="text-base font-bold font-['Space_Grotesk'] text-white">
                {simultaneousWorkshops.length} Oficinas Concorrentes em Andamento
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl">
                As turmas acontecem simultaneamente nas salas e laboratórios do polo. Você pode comparar os temas lado a lado ou confirmar a presença de uma só vez.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setViewLayout(viewLayout === 'salas_concorrentes' ? 'lista' : 'salas_concorrentes')}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  viewLayout === 'salas_concorrentes'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>{viewLayout === 'salas_concorrentes' ? 'Ver em Lista Padrão' : 'Ver Salas Lado a Lado'}</span>
              </button>

              {!isAllSimultaneousAttended ? (
                <button
                  type="button"
                  onClick={handleRunBatchCheckIn}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs font-black rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Check-in em Lote ({simultaneousWorkshops.length} Salas)</span>
                </button>
              ) : (
                <span className="px-3.5 py-2 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Presenças Confirmadas ({attendedSimultaneousCount}/{simultaneousWorkshops.length})
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison Layout for Concurrent Workshops */}
      {viewLayout === 'salas_concorrentes' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-700" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Comparador de Salas & Oficinas Concorrentes (Polo SASP)
                </h4>
                <p className="text-xs text-slate-500">
                  Visualização simultânea de temas, salas físicas e professores das 18h às 21h
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setViewLayout('lista')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Voltar à Lista Geral
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {simultaneousWorkshops.map((workshop, idx) => {
              const attendance = attendanceRecords.find((r) => r.workshopId === workshop.id);
              const isPresent = attendance?.status === 'presente';

              // Assign visual palette per room
              const roomTheme =
                idx === 0
                  ? { border: 'border-emerald-300', badge: 'bg-emerald-100 text-emerald-900', light: 'bg-emerald-50/50' }
                  : idx === 1
                  ? { border: 'border-teal-300', badge: 'bg-teal-100 text-teal-900', light: 'bg-teal-50/50' }
                  : { border: 'border-indigo-300', badge: 'bg-indigo-100 text-indigo-900', light: 'bg-indigo-50/50' };

              return (
                <div
                  key={workshop.id}
                  className={`bg-white rounded-2xl border-2 ${roomTheme.border} shadow-sm overflow-hidden flex flex-col justify-between`}
                >
                  <div className="p-5 space-y-4">
                    {/* Header room tag */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold ${roomTheme.badge} flex items-center gap-1`}>
                        <Building2 className="w-3.5 h-3.5" />
                        Sala 0{idx + 1}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900">
                        18h às 21h (3h)
                      </span>
                    </div>

                    {/* Location and Title */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold mb-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{workshop.location}</span>
                      </div>
                      <h3 className="text-base font-bold font-['Space_Grotesk'] text-slate-900 leading-snug">
                        {workshop.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {workshop.description}
                    </p>

                    {/* Speaker Info */}
                    <div className={`p-3 rounded-xl ${roomTheme.light} border border-slate-200/80 flex items-center gap-3`}>
                      <img
                        src={workshop.speakerPhoto}
                        alt={workshop.speaker}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                      />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900 block">{workshop.speaker}</span>
                        <span className="text-[11px] text-slate-600 block">{workshop.speakerRole}</span>
                      </div>
                    </div>

                    {/* Materials pill */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Material de Apoio ({workshop.materials.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {workshop.materials.slice(0, 2).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleDownloadMaterial(m.title)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg flex items-center gap-1 transition"
                          >
                            <Download className="w-3 h-3 text-slate-500" />
                            <span className="truncate max-w-[120px]">{m.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Attendance Card Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
                    {isPresent ? (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Presença Confirmada (3h)</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onCheckInNow && onCheckInNow(workshop.id)}
                        className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Registrar Presença nesta Sala</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {[
            { id: 'todos', label: 'Todas as Oficinas' },
            { id: 'hoje', label: 'Acontecendo Hoje' },
            { id: 'concluida', label: 'Já Concluídas' },
            { id: 'proxima', label: 'Próximas Sessões' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveFilter(item.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeFilter === item.id
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Layout Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setViewLayout('lista')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
              viewLayout === 'lista'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Lista</span>
          </button>
          <button
            type="button"
            onClick={() => setViewLayout('salas_concorrentes')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
              viewLayout === 'salas_concorrentes'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Salas Lado a Lado ({simultaneousWorkshops.length})</span>
          </button>
        </div>
      </div>

      {/* Workshop Cards Grid */}
      <div className="grid grid-cols-1 gap-5">
        {filteredWorkshops.map((workshop) => {
          const isEvaluated = Boolean(workshop.evaluation);
          const isToday = workshop.status === 'hoje';

          return (
            <div
              key={workshop.id}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
                isToday
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-slate-200/90'
              }`}
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Info main column */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {workshop.category}
                      </span>
                      {isToday && (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-600 text-white animate-pulse">
                          Sessão Hoje!
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-medium">
                        Carga: {workshop.durationHours} horas
                      </span>
                    </div>

                    <h3 className="text-lg font-bold font-['Space_Grotesk'] text-slate-900 leading-snug">
                      {workshop.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {workshop.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" /> {workshop.date}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" /> {workshop.time}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {workshop.location}
                      </span>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-700">
                      <span className="font-semibold text-slate-600">Palestrante Responsável:</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 font-bold border border-emerald-200/80">
                        {workshop.speakerName}
                        {workshop.speakerRole && (
                          <span className="text-[11px] font-medium text-emerald-700">({workshop.speakerRole})</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Right Action column: Evaluation & Status */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Evaluation status */}
                    {isEvaluated ? (
                      <div className="bg-amber-50 border border-amber-200/80 p-3 rounded-xl text-left lg:text-right">
                        <div className="flex items-center lg:justify-end gap-1 text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < (workshop.evaluation?.rating || 0)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                          <span className="text-xs font-bold text-amber-900 ml-1">
                            {workshop.evaluation?.rating}/5
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900 font-medium mt-1">
                          Avaliação enviada pelo aluno
                        </p>
                        <button
                          onClick={() => onOpenEvaluation(workshop)}
                          className="text-[11px] text-teal-700 font-semibold underline mt-0.5"
                        >
                          Editar avaliação
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onOpenEvaluation(workshop)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition"
                      >
                        <Star className="w-3.5 h-3.5 fill-slate-950" />
                        Avaliar Esta Oficina
                      </button>
                    )}
                  </div>
                </div>

                {/* Materials & Downloads Section */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
                    <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      Materiais de Apoio & Slides:
                    </p>
                    <button
                      onClick={() => {
                        setUploadModalWorkshop(workshop);
                        setMaterialName('');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 transition"
                      title="Alimentar arquivos desta oficina"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Alimentar Material (Professor)
                    </button>
                  </div>

                  {workshop.materials.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <FolderOpen className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700">
                            Nenhum material anexado ainda
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Espaço reservado para o professor responsável ({workshop.speakerName}) alimentar apostilas e slides.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setUploadModalWorkshop(workshop);
                          setMaterialName('');
                        }}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-medium transition shrink-0 shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5 text-emerald-600" />
                        Anexar Arquivo
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {workshop.materials.map((mat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-lg pr-1 transition"
                        >
                          <button
                            onClick={() => handleDownloadMaterial(mat.name)}
                            className="flex items-center gap-2 px-3 py-1.5 text-slate-700 text-xs font-medium"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>{mat.name}</span>
                            <span className="text-[10px] text-slate-400">({mat.size})</span>
                            <Download className="w-3 h-3 text-emerald-600 ml-1" />
                          </button>
                          <button
                            onClick={() => handleRemoveMaterial(workshop, mat.name)}
                            title="Remover material"
                            className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Teacher Material Feeding Modal */}
      {uploadModalWorkshop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-['Space_Grotesk']">
                    Alimentar Material da Oficina
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {uploadModalWorkshop.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUploadModalWorkshop(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMaterial} className="space-y-4 pt-4">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs text-emerald-900">
                <span className="font-bold">Professor(a) Responsável:</span> {uploadModalWorkshop.speakerName}
                {uploadModalWorkshop.speakerRole && ` (${uploadModalWorkshop.speakerRole})`}
              </div>

              {/* Drag & Drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/60'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <UploadCloud className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  Clique para selecionar ou arraste o arquivo aqui
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Formatos aceitos: PDF, PPTX, XLSX, DOCX ou ZIP
                </p>
              </div>

              {/* Material Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome do Material / Título do Arquivo:
                </label>
                <input
                  type="text"
                  required
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  placeholder="Ex: Apostila_Oficina_Quimica.pdf"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo do Arquivo:
                  </label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="PDF">PDF (Apostila / Cartilha)</option>
                    <option value="PPTX">Slides (PowerPoint)</option>
                    <option value="XLSX">Planilha Excel</option>
                    <option value="DOCX">Documento Word</option>
                    <option value="ZIP">Arquivo Compactado (ZIP)</option>
                    <option value="LINK">Link / Conteúdo Externo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tamanho Estimado:
                  </label>
                  <input
                    type="text"
                    value={materialSize}
                    onChange={(e) => setMaterialSize(e.target.value)}
                    placeholder="Ex: 2.4 MB"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalWorkshop(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!materialName.trim()}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Publicar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
