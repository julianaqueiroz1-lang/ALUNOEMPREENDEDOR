import React, { useState } from 'react';
import { Speaker, Workshop } from '../types';
import {
  Users,
  MessageSquare,
  Award,
  BookOpen,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface SpeakersViewProps {
  speakers: Speaker[];
  workshops: Workshop[];
  onAskDoubtAboutSpeaker: (speakerName: string, topic: string) => void;
}

export const SpeakersView: React.FC<SpeakersViewProps> = ({
  speakers,
  workshops,
  onAskDoubtAboutSpeaker,
}) => {
  const [selectedExpertise, setSelectedExpertise] = useState<string>('todos');

  // Extract all unique expertise tags
  const allExpertise = Array.from(
    new Set(speakers.flatMap((s) => s.expertise))
  );

  const filteredSpeakers = speakers.filter((s) => {
    if (selectedExpertise === 'todos') return true;
    return s.expertise.includes(selectedExpertise);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
          <Users className="w-3.5 h-3.5" /> Corpo Docente & Especialistas
        </div>
        <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">
          Professores e Palestrantes
        </h2>
        <p className="text-sm text-slate-600 mt-1 max-w-2xl">
          Conheça o corpo docente e os especialistas responsáveis pela formação técnica, matemática financeira, boas práticas e mentorias do Programa Aluno Empreendedor no polo SASP.
        </p>

        {/* Filter tags */}
        <div className="flex items-center gap-2 overflow-x-auto pt-5 mt-4 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1">Área:</span>
          <button
            onClick={() => setSelectedExpertise('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              selectedExpertise === 'todos'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({speakers.length})
          </button>
          {allExpertise.map((exp) => (
            <button
              key={exp}
              onClick={() => setSelectedExpertise(exp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedExpertise === exp
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {exp}
            </button>
          ))}
        </div>
      </div>

      {/* Speakers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredSpeakers.map((speaker) => {
          const speakerWorkshops = workshops.filter((w) =>
            speaker.workshopIds.includes(w.id)
          );

          return (
            <div
              key={speaker.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={speaker.avatar}
                    alt={speaker.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/30 shrink-0 shadow-sm"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold font-['Space_Grotesk'] text-slate-900">
                      {speaker.name}
                    </h3>
                    <p className="text-xs font-semibold text-emerald-700">
                      {speaker.role}
                    </p>
                    <p className="text-xs text-slate-500 font-medium">
                      {speaker.company}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mt-4">
                  {speaker.bio}
                </p>

                {/* Expertise tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {speaker.expertise.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Workshops conducted by this speaker */}
                {speakerWorkshops.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-emerald-600" /> Oficina Ministrada:
                    </p>
                    {speakerWorkshops.map((ws) => (
                      <div key={ws.id} className="text-xs font-semibold text-slate-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100 flex items-center justify-between">
                        <span>{ws.title}</span>
                        <span className="text-[10px] text-emerald-800 font-bold ml-2 shrink-0">{ws.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-6 py-3.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() =>
                    onAskDoubtAboutSpeaker(
                      speaker.name,
                      speaker.expertise[0] || 'Empreendedorismo'
                    )
                  }
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Tirar Dúvida no Chat
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
