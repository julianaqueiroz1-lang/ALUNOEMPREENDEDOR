import React, { useState } from 'react';
import { AttendanceRecord, StudentProfile } from '../types';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar,
  Camera,
  QrCode,
  AlertTriangle,
  Info,
  MapPin,
  Check,
  Database,
  Zap,
  Layers,
  Sparkles,
  CheckSquare,
  Square,
  X,
  FileText,
  Printer
} from 'lucide-react';
import { SimultaneousBatchCheckInCard } from './SimultaneousBatchCheckInCard';
import { AttendanceReportModal } from './AttendanceReportModal';

interface AttendanceViewProps {
  records: AttendanceRecord[];
  student: StudentProfile;
  onCheckInNow: (workshopId: string) => void;
  onBatchCheckIn: (workshopIds: string[]) => void;
  onResetSimultaneousRecords?: (workshopIds: string[]) => void;
  onOpenFacialScanner: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  records,
  student,
  onCheckInNow,
  onBatchCheckIn,
  onResetSimultaneousRecords,
  onOpenFacialScanner,
}) => {
  const [filter, setFilter] = useState<'todos' | 'presente' | 'ausente'>('todos');
  const [showCheckInSuccess, setShowCheckInSuccess] = useState<string | null>(null);
  const [batchSuccessAlert, setBatchSuccessAlert] = useState<{
    count: number;
    hours: number;
    titles: string[];
  } | null>(null);

  // Multi-selection state for general list
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const totalClasses = records.length;
  const attendedClasses = records.filter((r) => r.status === 'presente').length;
  const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
  const totalHours = records.filter((r) => r.status === 'presente').reduce((acc, curr) => acc + curr.hours, 0);

  const filteredRecords = records.filter((rec) => {
    if (filter === 'todos') return true;
    return rec.status === filter;
  });

  const pendingRecords = records.filter((r) => r.status !== 'presente');

  const handleManualCheckIn = (workshopId: string, title: string) => {
    onCheckInNow(workshopId);
    setShowCheckInSuccess(title);
    setTimeout(() => setShowCheckInSuccess(null), 4000);
  };

  const handleBatchConfirm = (workshopIds: string[]) => {
    if (!workshopIds.length) return;

    const matchedRecords = records.filter((r) => workshopIds.includes(r.workshopId));
    const addedHours = matchedRecords.reduce((acc, curr) => acc + curr.hours, 0);
    const titles = matchedRecords.map((r) => r.workshopTitle);

    onBatchCheckIn(workshopIds);
    setSelectedListIds([]);

    setBatchSuccessAlert({
      count: workshopIds.length,
      hours: addedHours,
      titles,
    });

    setTimeout(() => {
      setBatchSuccessAlert(null);
    }, 6000);
  };

  const toggleSelectListItem = (workshopId: string) => {
    setSelectedListIds((prev) =>
      prev.includes(workshopId)
        ? prev.filter((id) => id !== workshopId)
        : [...prev, workshopId]
    );
  };

  const handleSelectAllPendingInList = () => {
    const allPendingIds = filteredRecords
      .filter((r) => r.status !== 'presente')
      .map((r) => r.workshopId);
    setSelectedListIds(allPendingIds);
  };

  const handleClearListSelection = () => {
    setSelectedListIds([]);
  };

  const selectedListHours = records
    .filter((r) => selectedListIds.includes(r.workshopId))
    .reduce((acc, curr) => acc + curr.hours, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Frequência Biometrizada
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium" title="Presenças persistidas e sincronizadas no Google Cloud Firestore">
                <Database className="w-3 h-3 text-teal-600" />
                Firestore Sincronizado
              </span>
            </div>
            <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">
              Controle de Frequência & Presença
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Sua presença nas oficinas do Programa Aluno Empreendedor é registrada via reconhecimento facial. 
              Para obter o <strong>Certificado Oficial</strong>, é necessário atingir o mínimo de <strong>75% de frequência</strong>.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/90 shrink-0">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={attendancePercentage >= 75 ? 'text-emerald-500' : 'text-amber-500'}
                  strokeDasharray={`${attendancePercentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-sm font-bold text-slate-900">{attendancePercentage}%</span>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Status de Certificação</p>
              <p className={`text-sm font-bold ${attendancePercentage >= 75 ? 'text-emerald-700' : 'text-amber-700'}`}>
                {attendancePercentage >= 75 ? 'Apto para Certificado' : 'Abaixo do Limite (75%)'}
              </p>
              <p className="text-[11px] text-slate-500">{attendedClasses} de {totalClasses} oficinas validadas</p>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60">
            <span className="text-xs text-slate-500 font-medium">Oficinas Realizadas</span>
            <p className="text-xl font-extrabold text-slate-800 mt-1">{totalClasses}</p>
          </div>
          <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/60">
            <span className="text-xs text-emerald-800 font-medium">Presenças Confirmadas</span>
            <p className="text-xl font-extrabold text-emerald-700 mt-1">{attendedClasses}</p>
          </div>
          <div className="bg-teal-50/70 p-3.5 rounded-xl border border-teal-200/60">
            <span className="text-xs text-teal-800 font-medium">Carga Horária Presencial</span>
            <p className="text-xl font-extrabold text-teal-700 mt-1">{totalHours} horas</p>
          </div>
          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/60">
            <span className="text-xs text-slate-500 font-medium">Método Principal</span>
            <p className="text-xs font-bold text-slate-800 mt-2 flex items-center gap-1">
              <Camera className="w-3.5 h-3.5 text-emerald-600" /> Reconhecimento Facial
            </p>
          </div>
        </div>
      </div>

      {/* Simultaneous Workshops Batch Check-In Card (Highlight Module) */}
      <SimultaneousBatchCheckInCard
        records={records}
        onBatchCheckIn={handleBatchConfirm}
        onResetSimultaneousRecords={onResetSimultaneousRecords}
      />

      {/* Batch Check-in Notification Banner */}
      {batchSuccessAlert && (
        <div className="p-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl text-white shadow-lg flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 font-bold">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-sm font-extrabold flex items-center gap-1.5">
                Check-in em Lote Confirmado com 1 Clique!
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold">
                  Firestore Sincronizado
                </span>
              </p>
              <p className="text-xs text-emerald-100 mt-0.5">
                Presença validada com sucesso em {batchSuccessAlert.count} oficinas simultâneas (+{batchSuccessAlert.hours} horas creditadas ao seu histórico).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setBatchSuccessAlert(null)}
            className="text-white/80 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Single Check-in Notification Banner */}
      {showCheckInSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold">Check-in Facial Registrado com Sucesso!</p>
              <p className="text-xs text-emerald-800">Presença confirmada para "{showCheckInSuccess}".</p>
            </div>
          </div>
          <span className="text-xs bg-emerald-200/70 text-emerald-900 px-2.5 py-1 rounded-full font-semibold">
            +3 Horas
          </span>
        </div>
      )}

      {/* Action Bar: Check-in button and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Filtrar:</span>
          {(['todos', 'presente', 'ausente'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                filter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}

          {pendingRecords.length > 0 && (
            <button
              type="button"
              onClick={handleSelectAllPendingInList}
              className="ml-2 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5 text-teal-600" />
              Selecionar Todas Pendentes ({pendingRecords.length})
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsReportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200/90 shadow-2xs transition active:scale-95 cursor-pointer"
            title="Exportar Folha Oficial de Frequência em formato A4/PDF"
          >
            <FileText className="w-4 h-4 text-emerald-700" />
            <span>Exportar Folha Oficial (PDF)</span>
          </button>

          <button
            onClick={onOpenFacialScanner}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            Fazer Check-in Facial Individual
          </button>
        </div>
      </div>

      {/* Attendance Records List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs relative">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800 text-sm">Histórico de Presenças por Oficina</h3>
            {selectedListIds.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                {selectedListIds.length} selecionadas
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500">{filteredRecords.length} registros</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredRecords.map((item) => {
            const isPresent = item.status === 'presente';
            const isSelected = selectedListIds.includes(item.workshopId);

            return (
              <div
                key={item.id}
                className={`p-5 transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-teal-50/60'
                    : isPresent
                    ? 'hover:bg-slate-50/70'
                    : 'hover:bg-amber-50/30'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  {/* List item checkbox if pending */}
                  {!isPresent ? (
                    <button
                      type="button"
                      onClick={() => toggleSelectListItem(item.workshopId)}
                      className="mt-1 text-slate-400 hover:text-teal-600 transition"
                      title={isSelected ? 'Desmarcar oficina' : 'Marcar para check-in em lote'}
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-teal-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                      )}
                    </button>
                  ) : (
                    <div className="mt-1 w-5 h-5 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {item.hours} horas
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {item.date}
                      </span>
                      {(item.isSimultaneous || item.simultaneousGroupId) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold border border-teal-200">
                          <Zap className="w-3 h-3 text-teal-600" /> Sessão Simultânea
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{item.workshopTitle}</h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> Horário: {item.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {item.location}
                      </span>
                      {item.checkInMethod && (
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <ShieldCheck className="w-3 h-3" />
                          Validado por: {
                            item.checkInMethod === 'biometria_facial'
                              ? 'Biometria Facial'
                              : item.checkInMethod === 'batch_simultaneo'
                              ? 'Check-in em Lote Simultâneo'
                              : item.checkInMethod === 'online_ead'
                              ? 'Plataforma EAD Sebrae'
                              : 'Totem Presencial'
                          }
                          {item.checkInTime && ` às ${item.checkInTime}`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-8 md:ml-0">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    isPresent
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {isPresent ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Presente
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Ausente
                      </>
                    )}
                  </div>

                  {!isPresent && (
                    <button
                      onClick={() => handleManualCheckIn(item.workshopId, item.workshopTitle)}
                      className="text-xs px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium"
                    >
                      Confirmar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Batch Action Bar (if items selected in list) */}
      {selectedListIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 w-11/12 max-w-2xl bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-teal-500/40 flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-teal-500 text-slate-950 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                {selectedListIds.length} {selectedListIds.length === 1 ? 'oficina selecionada' : 'oficinas selecionadas'}
              </p>
              <p className="text-[11px] text-slate-400">
                +{selectedListHours} horas serão adicionadas à sua frequência
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClearListSelection}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => handleBatchConfirm(selectedListIds)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Confirmar ({selectedListIds.length}) em Lote
            </button>
          </div>
        </div>
      )}

      {/* Official Attendance Sheet Report Modal */}
      <AttendanceReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        student={student}
        attendanceRecords={records}
        totalWorkloadHours={21}
      />
    </div>
  );
};
