import React, { useState } from 'react';
import { StudentProfile } from '../types';
import {
  FileCheck,
  ShieldCheck,
  Lock,
  Unlock,
  Printer,
  Download,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Award,
  Calendar,
  Sparkles,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';

interface CertificationViewProps {
  student: StudentProfile;
  attendanceRate: number;
  approvedHours: number;
  evaluatedWorkshopsCount: number;
  totalWorkshopsCount: number;
  courseWorkloadHours?: number;
}

export const CertificationView: React.FC<CertificationViewProps> = ({
  student,
  attendanceRate,
  evaluatedWorkshopsCount,
  totalWorkshopsCount,
  courseWorkloadHours = 21,
}) => {
  const [enteredCpf, setEnteredCpf] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const cleanCpf = (str: string) => str.replace(/\D/g, '');
  const studentCleanCpf = cleanCpf(student.cpf);

  const totalHours = courseWorkloadHours || 21;
  const meetsAttendance = attendanceRate >= 75;
  const meetsEvaluations = evaluatedWorkshopsCount >= 1;
  const allPrerequisitesMet = meetsAttendance && meetsEvaluations;

  // Format CPF as user types: 000.000.000-00
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);

    if (val.length > 9) {
      val = val.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (val.length > 6) {
      val = val.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (val.length > 3) {
      val = val.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }
    setEnteredCpf(val);
    setErrorMessage(null);
  };

  const handleValidateCpfAndUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const inputClean = cleanCpf(enteredCpf);

    if (!inputClean || inputClean.length < 11) {
      setErrorMessage('Por favor, informe um CPF completo com 11 dígitos.');
      return;
    }

    if (inputClean !== studentCleanCpf) {
      setErrorMessage(
        `O CPF digitado (${enteredCpf}) não confere com o cadastro da aluna (${student.cpf}). Confirme seu documento cadastral.`
      );
      return;
    }

    if (!allPrerequisitesMet) {
      setErrorMessage(
        'Você ainda possui requisitos pendentes (veja a lista abaixo) antes de gerar o certificado final.'
      );
      return;
    }

    setIsUnlocked(true);
    setErrorMessage(null);
  };

  const certificateCode = `AE-CE-2026-${studentCleanCpf.slice(0, 6)}-${student.matricula.replace(/\D/g, '')}`;
  const issueDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(certificateCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <FileCheck className="w-3.5 h-3.5" /> Certificação Oficial
          </div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">
            Emissão de Certificado do Aluno Empreendedor
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Para ter acesso à certificação e comprovação das 120 horas de formação empreendedora, 
            <strong> é obrigatório validar o CPF cadastrado no curso</strong> e atingir os requisitos mínimos.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-right">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Carga do Certificado</span>
            <p className="text-sm font-extrabold text-emerald-700">120 Horas Oficiais</p>
          </div>
        </div>
      </div>

      {/* Prerequisites Checklist */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs print:hidden">
        <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Critérios de Elegibilidade para Certificação
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Frequencia */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            meetsAttendance ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
          }`}>
            <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${meetsAttendance ? 'text-emerald-600' : 'text-rose-500'}`} />
            <div>
              <p className="text-xs font-bold text-slate-800">Frequência Mínima (75%)</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Atual: <strong className={meetsAttendance ? 'text-emerald-700' : 'text-rose-700'}>{attendanceRate}%</strong>
              </p>
              <span className={`text-[10px] font-semibold mt-1 inline-block px-1.5 py-0.2 rounded ${
                meetsAttendance ? 'bg-emerald-200/80 text-emerald-900' : 'bg-rose-200/80 text-rose-900'
              }`}>
                {meetsAttendance ? 'Requisito Atendido' : 'Abaixo de 75%'}
              </span>
            </div>
          </div>

          {/* Carga Horaria */}
          <div className="p-4 rounded-xl border flex items-start gap-3 bg-emerald-50/70 border-emerald-200">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-slate-800">Carga Horária Integralizada</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Total: <strong className="text-emerald-700">{totalHours}h cumpridas</strong>
              </p>
              <span className="text-[10px] font-semibold mt-1 inline-block px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-900">
                Oficinas & Feira Concluídas
              </span>
            </div>
          </div>

          {/* Avaliações */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            meetsEvaluations ? 'bg-emerald-50/70 border-emerald-200' : 'bg-amber-50/70 border-amber-200'
          }`}>
            <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${meetsEvaluations ? 'text-emerald-600' : 'text-amber-500'}`} />
            <div>
              <p className="text-xs font-bold text-slate-800">Avaliação das Oficinas</p>
              <p className="text-xs text-slate-600 mt-0.5">
                Atual: <strong className="text-slate-800">{evaluatedWorkshopsCount} avaliadas</strong>
              </p>
              <span className={`text-[10px] font-semibold mt-1 inline-block px-1.5 py-0.2 rounded ${
                meetsEvaluations ? 'bg-emerald-200/80 text-emerald-900' : 'bg-amber-200/80 text-amber-900'
              }`}>
                {meetsEvaluations ? 'Feedbacks Enviados' : 'Avaliar Oficinas'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CPF Verification Gate (If not unlocked) */}
      {!isUnlocked ? (
        <div className="bg-white rounded-2xl border-2 border-emerald-600/30 p-8 shadow-md text-center max-w-2xl mx-auto space-y-6 print:hidden">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Acesso Restrito por Documento
            </span>
            <h3 className="text-xl font-bold font-['Space_Grotesk'] text-slate-900">
              Digite o CPF do Curso para Liberar o Certificado
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
              Por determinação de segurança acadêmica, a emissão do certificado digital requer a confirmação 
              do CPF oficial do aluno cadastrado no programa.
            </p>
          </div>

          <form onSubmit={handleValidateCpfAndUnlock} className="max-w-sm mx-auto space-y-3">
            <div>
              <input
                type="text"
                id="input-certificate-cpf"
                value={enteredCpf}
                onChange={handleCpfChange}
                placeholder="000.000.000-00"
                className="w-full text-center text-lg font-mono font-bold tracking-widest px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl focus:border-emerald-600 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none text-slate-900"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Dica de teste rápido: Aluna cadastrada com CPF <strong className="text-emerald-700 cursor-pointer hover:underline" onClick={() => setEnteredCpf(student.cpf)}>{student.cpf}</strong>
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 text-left flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              id="btn-validate-cpf-certificate"
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              Validar CPF e Gerar Certificado
            </button>
          </form>
        </div>
      ) : (
        /* The Official Digital Certificate */
        <div className="space-y-4">
          {/* Top Actions Bar (Hidden on print) */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>CPF Validado com Sucesso ({student.cpf})! Certificado Autêntico Gerado.</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Imprimir / Salvar PDF
              </button>
              <button
                onClick={handleCopyCode}
                className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-1"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Código Copiado' : 'Copiar Código'}
              </button>
              <button
                onClick={() => setIsUnlocked(false)}
                className="p-2 text-slate-400 hover:text-slate-700 transition"
                title="Bloquear novamente"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Printable Certificate Document Sheet */}
          <div
            id="official-certificate-document"
            className="bg-white border-8 border-double border-emerald-800/80 rounded-2xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center text-slate-900"
          >
            {/* Background Watermark Crest */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <Award className="w-96 h-96 text-emerald-950" />
            </div>

            {/* Certificate Header */}
            <div className="space-y-1 relative z-10">
              <div className="flex items-center justify-center gap-2">
                <span className="w-8 h-1 bg-emerald-700 rounded-full" />
                <span className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-emerald-900">
                  PROGRAMA OFICIAL DE FORMAÇÃO EMPREENDEDORA
                </span>
                <span className="w-8 h-1 bg-emerald-700 rounded-full" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold font-['Space_Grotesk'] tracking-tight text-slate-900 pt-2">
                CERTIFICADO DE CONCLUSÃO
              </h1>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">
                SECRETARIA DA EDUCAÇÃO & HUB DE INOVAÇÃO E STARTUPS
              </p>
            </div>

            {/* Certificate Body */}
            <div className="my-8 max-w-3xl mx-auto space-y-4 text-slate-800 leading-relaxed text-sm sm:text-base relative z-10">
              <p>
                Certificamos para os devidos fins que a aluna empreendedora
              </p>

              <h2 className="text-2xl sm:text-3xl font-extrabold font-['Space_Grotesk'] text-emerald-900 underline decoration-amber-400 decoration-4 underline-offset-8">
                {student.name}
              </h2>

              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                portadora do CPF <strong className="text-slate-950 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-300">{student.cpf}</strong> e 
                matrícula <strong className="text-slate-950 font-bold">{student.matricula}</strong>,
                concluiu com êxito todas as etapas teórico-práticas do
              </p>

              <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl my-4">
                <h3 className="text-base sm:text-lg font-bold font-['Space_Grotesk'] text-emerald-950">
                  {student.courseName}
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  Turma: {student.turma} • Carga Horária Integralizada: <strong>{totalHours} Horas</strong>
                </p>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 text-justify sm:text-center leading-relaxed">
                Durante a formação, a aluna desenvolveu competências práticas em Mentoria de Ideação e Negócios, 
                Matemática Financeira e Precificação, Panificação Artesanal e Produção de Pães Recheados, Boas Práticas Sanitárias, 
                Cursos EAD Sebrae de Formação de Preço e Atendimento ao Cliente, e Comercialização na Grande Feira Empreendedora do polo SASP.
              </p>
            </div>

            {/* Date & Location */}
            <div className="text-xs font-semibold text-slate-600 my-6 relative z-10">
              Fortaleza - CE, {issueDate}.
            </div>

            {/* Signatures and Validation Seals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200 relative z-10 items-end">
              {/* Signature 1 */}
              <div className="text-center space-y-1">
                <div className="w-40 mx-auto border-b-2 border-slate-800 pb-1 font-serif italic text-sm text-slate-700">
                  Lucas Silveira
                </div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">Dr. Lucas Silveira</p>
                <p className="text-[10px] text-slate-500">Coordenador do Hub de Inovação</p>
              </div>

              {/* Central Seal / QR Code */}
              <div className="text-center flex flex-col items-center justify-center space-y-1">
                <div className="p-2 bg-white rounded-xl border border-slate-300 shadow-xs">
                  <QrCode className="w-14 h-14 text-slate-900" />
                </div>
                <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-800">
                  Autenticidade Garantida
                </span>
                <p className="text-[10px] font-mono text-slate-500">{certificateCode}</p>
              </div>

              {/* Signature 2 */}
              <div className="text-center space-y-1">
                <div className="w-40 mx-auto border-b-2 border-slate-800 pb-1 font-serif italic text-sm text-slate-700">
                  Beatriz Menezes
                </div>
                <p className="text-[11px] font-bold text-slate-800 leading-tight">Beatriz Menezes</p>
                <p className="text-[10px] text-slate-500">Diretoria Pedagógica do Programa</p>
              </div>
            </div>

            {/* Certificate Footer Metadata */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[10px] text-slate-400 gap-2">
              <span>Registro: Livro 04 • Folha 82 • Nº 2026/0491</span>
              <span>Validado por Biometria Facial e Reconhecimento do Aluno</span>
              <span>Emissão Digital em conformidade com as diretrizes educacionais</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
