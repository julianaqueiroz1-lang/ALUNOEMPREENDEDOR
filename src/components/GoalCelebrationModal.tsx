import React, { useEffect, useRef } from 'react';
import { Award, CheckCircle2, FileCheck, Sparkles, X, ArrowRight } from 'lucide-react';

interface GoalCelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToCertificate: () => void;
  studentName: string;
  attendanceRate: number;
  attendedHours: number;
}

export const GoalCelebrationModal: React.FC<GoalCelebrationModalProps> = ({
  isOpen,
  onClose,
  onGoToCertificate,
  studentName,
  attendanceRate,
  attendedHours,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    // Confetti particles
    const colors = ['#10b981', '#059669', '#f59e0b', '#fbbf24', '#3b82f6', '#ec4899'];
    const particles = Array.from({ length: 90 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height - height,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 3 + 2,
      speedX: (Math.random() - 0.5) * 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 4,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.rotationSpeed;

        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      {/* Canvas Confetti Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />

      <div className="relative z-10 bg-white w-full max-w-lg rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden text-center p-6 sm:p-8 animate-scaleUp">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/30 mb-5 relative">
          <Award className="w-10 h-10" />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center ring-2 ring-white">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Meta Obrigatória de Frequência Conquistada!
        </div>

        <h2 className="text-2xl sm:text-3xl font-black font-['Space_Grotesk'] text-slate-950 mb-2">
          Parabéns, {studentName.split(' ')[0]}!
        </h2>

        <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-md mx-auto">
          Você atingiu <strong>{attendanceRate}% de presença</strong> ({attendedHours} horas computadas) e superou o critério mínimo de 75% exigido pelo Programa Aluno Empreendedor.
        </p>

        {/* Status Callout */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 mb-6 text-left flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-400/30 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
            <FileCheck className="w-5 h-5 text-amber-700" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-900 block">
              Certificado Oficial Desbloqueado
            </span>
            <p className="text-slate-600 mt-0.5">
              O módulo de certificação está liberado para validação com seu CPF e emissão imediata com assinatura digital da SEDUC/CE.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onGoToCertificate}
            className="w-full sm:flex-1 py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-700/20 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Emitir Certificado Oficial</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Continuar no Painel
          </button>
        </div>
      </div>
    </div>
  );
};
