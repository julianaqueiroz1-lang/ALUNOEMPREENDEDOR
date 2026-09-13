import React, { useState, useMemo } from 'react';
import { AttendanceRecord } from '../types';
import {
  Layers,
  Zap,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Check,
  Sparkles,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

interface SimultaneousBatchCheckInCardProps {
  records: AttendanceRecord[];
  onBatchCheckIn: (workshopIds: string[]) => void;
  onResetSimultaneousRecords?: (workshopIds: string[]) => void;
}

interface SimultaneousGroup {
  id: string;
  label: string;
  date: string;
  time: string;
  records: AttendanceRecord[];
  pendingRecords: AttendanceRecord[];
  attendedRecords: AttendanceRecord[];
}

export const SimultaneousBatchCheckInCard: React.FC<SimultaneousBatchCheckInCardProps> = ({
  records,
  onBatchCheckIn,
  onResetSimultaneousRecords,
}) => {
  // 1. Discover simultaneous workshop groups
  const simultaneousGroups = useMemo<SimultaneousGroup[]>(() => {
    const groupMap = new Map<string, AttendanceRecord[]>();

    records.forEach((rec) => {
      // Key can be explicit simultaneousGroupId or date + time
      const key = rec.simultaneousGroupId
        ? `group_${rec.simultaneousGroupId}`
        : `dt_${rec.date}_${rec.time}`;
      
      const existing = groupMap.get(key) || [];
      existing.push(rec);
      groupMap.set(key, existing);
    });

    const groups: SimultaneousGroup[] = [];

    groupMap.forEach((groupRecords, key) => {
      // A simultaneous group must have 2 or more sessions
      if (groupRecords.length >= 2) {
        const first = groupRecords[0];
        const pending = groupRecords.filter((r) => r.status !== 'presente');
        const attended = groupRecords.filter((r) => r.status === 'presente');

        let label = `${first.date} • ${first.time}`;
        if (first.date.toLowerCase().includes('hoje')) {
          label = `Sessões Simultâneas de Hoje (${first.time})`;
        }

        groups.push({
          id: key,
          label,
          date: first.date,
          time: first.time,
          records: groupRecords,
          pendingRecords: pending,
          attendedRecords: attended,
        });
      }
    });

    // Sort so groups with pending records appear first
    return groups.sort((a, b) => b.pendingRecords.length - a.pendingRecords.length);
  }, [records]);

  // Selected group tab (defaults to the first group with pending records)
  const [activeGroupId, setActiveGroupId] = useState<string>(() => {
    return simultaneousGroups[0]?.id || '';
  });

  const currentGroup = useMemo(() => {
    if (!simultaneousGroups.length) return null;
    return (
      simultaneousGroups.find((g) => g.id === activeGroupId) || simultaneousGroups[0]
    );
  }, [simultaneousGroups, activeGroupId]);

  // Track checked workshop IDs for the active group
  // By default, select all pending workshops in this group for true 1-click batch check-in
  const [selectedWorkshopIds, setSelectedWorkshopIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [justCompletedIds, setJustCompletedIds] = useState<string[]>([]);

  // Keep selection synced when current group changes or when pending records change
  React.useEffect(() => {
    if (currentGroup) {
      const pendingIds = currentGroup.pendingRecords.map((r) => r.workshopId);
      setSelectedWorkshopIds(pendingIds);
    }
  }, [currentGroup?.id, currentGroup?.pendingRecords.length]);

  if (!currentGroup) {
    return null;
  }

  const toggleSelectWorkshop = (workshopId: string) => {
    setSelectedWorkshopIds((prev) =>
      prev.includes(workshopId)
        ? prev.filter((id) => id !== workshopId)
        : [...prev, workshopId]
    );
  };

  const handleSelectAll = () => {
    if (!currentGroup) return;
    const pendingIds = currentGroup.pendingRecords.map((r) => r.workshopId);
    setSelectedWorkshopIds(pendingIds);
  };

  const handleDeselectAll = () => {
    setSelectedWorkshopIds([]);
  };

  const selectedCount = selectedWorkshopIds.length;
  const selectedHours = currentGroup.records
    .filter((r) => selectedWorkshopIds.includes(r.workshopId))
    .reduce((acc, curr) => acc + curr.hours, 0);

  const handleExecuteBatchCheckIn = () => {
    if (selectedCount === 0) return;
    setIsProcessing(true);

    const idsToConfirm = [...selectedWorkshopIds];

    // Trigger instant batch check in
    setTimeout(() => {
      onBatchCheckIn(idsToConfirm);
      setJustCompletedIds(idsToConfirm);
      setIsProcessing(false);
      setSelectedWorkshopIds([]);

      setTimeout(() => {
        setJustCompletedIds([]);
      }, 5000);
    }, 450);
  };

  const allInGroupArePresent = currentGroup.pendingRecords.length === 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white rounded-2xl p-5 sm:p-6 border border-teal-500/30 shadow-lg relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
            <Layers className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-400/20 text-teal-300 text-[11px] font-bold tracking-wide uppercase border border-teal-400/30 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" />
                Check-in em Lote Simultâneo
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {currentGroup.date} • {currentGroup.time}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight mt-0.5">
              Oficinas Simultâneas / Salas Paralelas
            </h3>
            <p className="text-xs text-slate-300">
              Confirme presença em múltiplas sessões concorrentes do mesmo horário com um único clique.
            </p>
          </div>
        </div>

        {/* Group Tabs (if more than 1 simultaneous block exists) */}
        {simultaneousGroups.length > 1 && (
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-white/10 shrink-0">
            {simultaneousGroups.map((g) => {
              const isActive = g.id === currentGroup.id;
              const hasPending = g.pendingRecords.length > 0;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setActiveGroupId(g.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{g.time}</span>
                  {hasPending && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Group Content */}
      <div className="relative z-10 pt-4 space-y-4">
        {/* Selection Bar / Quick controls if pending exist */}
        {!allInGroupArePresent && (
          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">
                {currentGroup.pendingRecords.length} de {currentGroup.records.length} pendentes
              </span>
              <span className="text-slate-500">•</span>
              <span>Selecione as sessões para confirmação em lote:</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs text-teal-300 hover:text-teal-200 underline font-medium"
              >
                Marcar Todas
              </button>
              <span className="text-slate-600">|</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-xs text-slate-400 hover:text-slate-300 underline"
              >
                Desmarcar
              </button>
            </div>
          </div>
        )}

        {/* Workshop Cards in the Simultaneous Group */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {currentGroup.records.map((rec) => {
            const isAttended = rec.status === 'presente';
            const isSelected = selectedWorkshopIds.includes(rec.workshopId);
            const wasJustConfirmed = justCompletedIds.includes(rec.workshopId);

            return (
              <div
                key={rec.id}
                onClick={() => {
                  if (!isAttended) {
                    toggleSelectWorkshop(rec.workshopId);
                  }
                }}
                className={`rounded-xl p-3.5 border transition relative cursor-pointer select-none flex flex-col justify-between ${
                  isAttended
                    ? 'bg-white/5 border-emerald-500/40 text-slate-200 cursor-default'
                    : isSelected
                    ? 'bg-teal-500/15 border-teal-400 shadow-sm shadow-teal-500/10'
                    : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                }`}
              >
                <div>
                  {/* Top status & checkbox */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white">
                      +{rec.hours}h Presenciais
                    </span>

                    {isAttended ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Presente
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectWorkshop(rec.workshopId)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded text-teal-500 focus:ring-teal-400 focus:ring-offset-slate-900 cursor-pointer accent-teal-500"
                        />
                        <span className="text-[11px] font-semibold text-amber-300">
                          Pendente
                        </span>
                      </div>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-white line-clamp-2 leading-snug">
                    {rec.workshopTitle}
                  </h4>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col gap-1 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3 h-3 text-teal-400 shrink-0" />
                    <span className="truncate">{rec.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{rec.time}</span>
                  </div>

                  {isAttended && rec.checkInTime && (
                    <div className="flex items-center gap-1 text-[11px] text-emerald-300 mt-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Validado às {rec.checkInTime}</span>
                    </div>
                  )}

                  {wasJustConfirmed && (
                    <span className="text-[11px] text-emerald-300 font-bold animate-bounce mt-0.5">
                      ✓ Confirmado no lote!
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Bottom Bar */}
        {!allInGroupArePresent ? (
          <div className="bg-slate-950/60 rounded-xl p-3.5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white">
                  {selectedCount > 0
                    ? `${selectedCount} ${selectedCount === 1 ? 'sessão selecionada' : 'sessões selecionadas'} (+${selectedHours}h computadas)`
                    : 'Nenhuma sessão selecionada'}
                </p>
                <p className="text-slate-400">
                  O check-in em lote valida todas as salas simultâneas de uma só vez no Firestore.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={selectedCount === 0 || isProcessing}
              onClick={handleExecuteBatchCheckIn}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md active:scale-95 ${
                selectedCount > 0 && !isProcessing
                  ? 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-teal-500/20 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Validando Biometria em Lote...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>
                    Confirmar Presença em Lote ({selectedCount}) com 1 Clique
                  </span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="bg-emerald-950/40 rounded-xl p-4 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-bold">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-300">
                  Todas as Oficinas Simultâneas Deste Horário Já Foram Validadas!
                </p>
                <p className="text-[11px] text-slate-300">
                  Presença confirmada em todas as salas concorrentes ({currentGroup.records.length} oficinas •{' '}
                  {currentGroup.records.reduce((a, b) => a + b.hours, 0)} horas registradas com sucesso).
                </p>
              </div>
            </div>

            {onResetSimultaneousRecords && (
              <button
                type="button"
                onClick={() => {
                  const allGroupIds = currentGroup.records.map((r) => r.workshopId);
                  onResetSimultaneousRecords(allGroupIds);
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 self-end sm:self-center active:scale-95"
                title="Redefine as oficinas simultâneas para o estado pendente para demonstrar o check-in em lote novamente"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Testar Check-in em Lote Novamente</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
