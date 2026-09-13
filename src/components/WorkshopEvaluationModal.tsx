import React, { useState } from 'react';
import { Workshop, WorkshopEvaluation } from '../types';
import { Star, X, CheckCircle, MessageSquare, Award, Sparkles, Database } from 'lucide-react';

interface WorkshopEvaluationModalProps {
  workshop: Workshop;
  onClose: () => void;
  onSubmitEvaluation: (workshopId: string, evaluation: WorkshopEvaluation) => void;
}

export const WorkshopEvaluationModal: React.FC<WorkshopEvaluationModalProps> = ({
  workshop,
  onClose,
  onSubmitEvaluation,
}) => {
  const [rating, setRating] = useState<number>(workshop.evaluation?.rating || 5);
  const [speakerRating, setSpeakerRating] = useState<number>(workshop.evaluation?.speakerRating || 5);
  const [contentApplicability, setContentApplicability] = useState<number>(workshop.evaluation?.contentApplicability || 5);
  const [feedback, setFeedback] = useState<string>(workshop.evaluation?.feedback || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const evaluation: WorkshopEvaluation = {
      rating,
      speakerRating,
      contentApplicability,
      feedback: feedback.trim() || 'Oficina excelente e muito prática para o nosso projeto empreendedor!',
      submittedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setTimeout(() => {
      onSubmitEvaluation(workshop.id, evaluation);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  const renderStars = (currentValue: number, onChange: (val: number) => void) => {
    return (
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition text-amber-400 focus:outline-none"
          >
            <Star
              className={`w-6 h-6 ${
                star <= currentValue
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-xs font-bold text-slate-700">{currentValue} de 5</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-bold text-amber-400 tracking-wider">Avaliação de Oficina</span>
              <h3 className="text-base font-bold font-['Space_Grotesk'] leading-tight">
                Feedback do Aluno
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 font-semibold">Oficina a avaliar:</p>
            <h4 className="text-sm font-bold text-slate-900">{workshop.title}</h4>
            <p className="text-xs text-slate-600 mt-0.5">Ministrada por: <strong>{workshop.speakerName}</strong></p>
          </div>

          {/* Criteria 1: Overall Rating */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Qualidade Geral da Oficina
            </label>
            {renderStars(rating, setRating)}
          </div>

          {/* Criteria 2: Speaker Rating */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              2. Clareza e Didática do Palestrante ({workshop.speakerName})
            </label>
            {renderStars(speakerRating, setSpeakerRating)}
          </div>

          {/* Criteria 3: Content Applicability */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              3. Aplicabilidade prática para sua ideia/startup
            </label>
            {renderStars(contentApplicability, setContentApplicability)}
          </div>

          {/* Qualitative Feedback */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>O que mais gostou e sugestões de melhoria</span>
              <span className="text-[11px] text-slate-400 font-normal">Opcional</span>
            </label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Compartilhe seus aprendizados, insights ou sugestões para a coordenação..."
              className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-slate-800"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-700">
              <Database className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Sincronização direta na nuvem Firestore</span>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {isSubmitting ? 'Gravando no Firestore...' : 'Enviar Avaliação'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
