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
  Check
} from 'lucide-react';

interface AttendanceViewProps {
  records: AttendanceRecord[];
  student: StudentProfile;
  onCheckInNow: (workshopId: string) => void;
  onOpenFacialScanner: () => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  records,
  student,
  onCheckInNow,
  onOpenFacialScanner,
}) => {
  const [filter, setFilter] = useState<'todos' | 'presente' | 'ausente'>('todos');
  const [showCheckInSuccess, setShowCheckInSuccess] = useState<string | null>(null);

  const totalClasses = records.length;
  const attendedClasses = records.filter((r) => r.status === 'presente').length;
  const attendancePercentage = totalClasses > 0 ? Math.round((attendedClasses / totalClasses) * 100) : 0;
  const totalHours = records.filter((r) => r.status === 'presente').reduce((acc, curr) => acc + curr.hours, 0);

  const filteredRecords = records.filter((rec) => {
    if (filter === 'todos') return true;
    return rec.status === filter;
  });

  const handleManualCheckIn = (workshopId: string, title: string) => {
    onCheckInNow(workshopId);
    setShowCheckInSuccess(title);
    setTimeout(() => setShowCheckInSuccess(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Frequência Biometrizada
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

      {/* Check-in Notification Banner */}
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
            +4 Horas
          </span>
        </div>
      )}

      {/* Action Bar: Check-in button and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
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
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenFacialScanner}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
          >
            <Camera className="w-4 h-4" />
            Fazer Check-in Facial Agora
          </button>
        </div>
      </div>

      {/* Attendance Records List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Histórico de Presenças por Oficina</h3>
          <span className="text-xs text-slate-500">{filteredRecords.length} registros</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredRecords.map((item) => {
            const isPresent = item.status === 'presente';
            return (
              <div key={item.id} className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {item.hours} horas
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> {item.date}
                    </span>
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
                            : item.checkInMethod === 'online_ead'
                            ? 'Plataforma EAD Sebrae'
                            : 'Totem Presencial'
                        }
                        {item.checkInTime && ` às ${item.checkInTime}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
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
                      Confirmar com Rosto
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
