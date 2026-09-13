import React, { useRef } from 'react';
import { StudentProfile, AttendanceRecord } from '../types';
import {
  Printer,
  Download,
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  FileCheck,
  Building2,
  Copy,
  Check
} from 'lucide-react';

interface AttendanceReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  attendanceRecords: AttendanceRecord[];
  totalWorkloadHours: number;
}

export const AttendanceReportModal: React.FC<AttendanceReportModalProps> = ({
  isOpen,
  onClose,
  student,
  attendanceRecords,
  totalWorkloadHours = 21,
}) => {
  const [copiedHash, setCopiedHash] = React.useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const attendedRecords = attendanceRecords.filter((r) => r.status === 'presente');
  const totalAttendedHours = attendedRecords.reduce((acc, curr) => acc + (curr.hours || 0), 0);
  const attendancePercentage = Math.round((attendedRecords.length / Math.max(attendanceRecords.length, 1)) * 100);
  const isApproved = attendancePercentage >= 75;

  const documentHash = `CE-AE2026-${student.id.toUpperCase()}-${attendancePercentage}P-${totalAttendedHours}H-${Date.now().toString(36).toUpperCase()}`;
  const issuanceDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(documentHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header Actions Bar (Hidden on Print) */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between gap-3 border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <FileCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-['Space_Grotesk'] text-white">
                Folha Oficial de Frequência & Comprovação de Horas
              </h3>
              <p className="text-[11px] text-slate-400">
                Documento emitido com carimbo digital para comprovação curricular e estágio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition hover:bg-slate-800"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print:p-0 print:space-y-4 text-slate-900" ref={printAreaRef}>
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-emerald-800 text-white text-[10px] font-black tracking-wider uppercase">
                  Governo do Estado do Ceará
                </span>
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Secretaria da Educação (SEDUC)
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black font-['Space_Grotesk'] text-slate-950 tracking-tight">
                PROGRAMA ALUNO EMPREENDEDOR
              </h1>
              <p className="text-xs font-semibold text-slate-600">
                Polo de Inovação e Empreendedorismo Social SASP • Edição 2026.1
              </p>
            </div>

            <div className="text-left sm:text-right border-l-2 sm:border-l-0 pl-3 sm:pl-0 border-emerald-600">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Comprovante de Frequência
              </span>
              <span className="text-xs font-extrabold text-emerald-800 block">
                Folha Oficial nº {student.matricula.replace(/\D/g, '')}
              </span>
              <span className="text-[11px] text-slate-500 block">
                Emitido em: {issuanceDate}
              </span>
            </div>
          </div>

          {/* Student & Course Summary Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Nome da Aluna</span>
              <span className="font-bold text-slate-900 text-sm">{student.name}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Documento CPF / Matrícula</span>
              <span className="font-semibold text-slate-800">
                {student.cpf} • {student.matricula}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Escola / Polo de Apoio</span>
              <span className="font-semibold text-slate-800">{student.school}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Situação no Programa</span>
              <span className={`font-bold inline-flex items-center gap-1 ${isApproved ? 'text-emerald-700' : 'text-amber-700'}`}>
                {isApproved ? '✓ Meta Atingida (≥75%)' : 'Em Curso (Abaixo de 75%)'}
              </span>
            </div>
          </div>

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Total de Oficinas</span>
              <span className="text-xl font-black font-['Space_Grotesk'] text-slate-900">
                {attendanceRecords.length}
              </span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Presenças Validadas</span>
              <span className="text-xl font-black font-['Space_Grotesk'] text-emerald-700">
                {attendedRecords.length} ({totalAttendedHours}h)
              </span>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase block">Frequência Apurada</span>
              <span className={`text-xl font-black font-['Space_Grotesk'] ${isApproved ? 'text-emerald-700' : 'text-amber-600'}`}>
                {attendancePercentage}%
              </span>
            </div>
          </div>

          {/* Table of Records */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Detalhamento dos Registros e Métodos de Validação
              </h2>
              <span className="text-[11px] text-slate-500 font-medium">
                Horário regular das oficinas: 18h às 21h
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 border-b border-slate-200">
                    <th className="py-2.5 px-3 font-bold">Data</th>
                    <th className="py-2.5 px-3 font-bold">Oficina / Tema</th>
                    <th className="py-2.5 px-3 font-bold">Carga</th>
                    <th className="py-2.5 px-3 font-bold">Local / Sala</th>
                    <th className="py-2.5 px-3 font-bold">Método de Validação</th>
                    <th className="py-2.5 px-3 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {attendanceRecords.map((r, index) => {
                    const isPresent = r.status === 'presente';
                    return (
                      <tr key={r.id || index} className={isPresent ? 'bg-white' : 'bg-slate-50/50 text-slate-500'}>
                        <td className="py-2 px-3 font-semibold whitespace-nowrap text-slate-800">
                          {r.date}
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900 block">{r.workshopTitle}</span>
                          {r.isSimultaneous && (
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 inline-block mt-0.5">
                              Sessão Concorrente (Polo SASP)
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-medium whitespace-nowrap">
                          {r.hours}h
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {r.location || 'Auditório SASP'}
                        </td>
                        <td className="py-2 px-3">
                          {isPresent ? (
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-800">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              {r.checkInMethod === 'facial' && 'Biometria Facial'}
                              {r.checkInMethod === 'batch_simultaneo' && 'Check-in em Lote Simultâneo'}
                              {r.checkInMethod === 'manual' && 'Totem / Validação SASP'}
                              {!r.checkInMethod && 'Validação Presencial'}
                              {r.checkInTime && ` (${r.checkInTime})`}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Pendente / Não registrado</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          {isPresent ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Presente
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                              Ausente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Digital Signature & Security Seal */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Assinatura Digital & Carimbo Institucional ICP-Brasil</span>
              </div>
              <p className="text-[11px] text-slate-500 max-w-xl">
                Documento emitido eletronicamente pela Plataforma do Aluno Empreendedor em conformidade com o Decreto Estadual nº 33.789 e padrões de auditoria da Secretaria da Educação do Ceará.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <code className="text-[10px] font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-700">
                  HASH: {documentHash}
                </code>
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="p-1 hover:bg-slate-200 rounded text-slate-500 transition"
                  title="Copiar código de autenticidade"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="text-center shrink-0 w-full sm:w-auto p-2 bg-white rounded-lg border border-slate-200">
              <div className="w-16 h-16 mx-auto bg-slate-900 text-white rounded flex items-center justify-center text-[9px] font-mono leading-tight p-1">
                SEDUC<br />VERIFIED<br />2026
              </div>
              <span className="text-[9px] text-slate-500 uppercase font-semibold block mt-1">
                Validação QR
              </span>
            </div>
          </div>
        </div>

        {/* Footer info (Modal bottom) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 print:hidden text-xs text-slate-500">
          <span>Dica: Para gerar o arquivo em PDF, clique em <strong>Imprimir / Salvar PDF</strong> e selecione a impressora <em>"Salvar como PDF"</em>.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition"
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
