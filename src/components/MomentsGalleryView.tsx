import React, { useState, useRef } from 'react';
import { MomentPost, StudentProfile } from '../types';
import {
  Image,
  Camera,
  Heart,
  Plus,
  X,
  Upload,
  Sparkles,
  Calendar,
  Share2,
  Tag,
  Check
} from 'lucide-react';

interface MomentsGalleryViewProps {
  moments: MomentPost[];
  student: StudentProfile;
  onAddMoment: (newMoment: MomentPost) => void;
  onToggleLike: (momentId: string) => void;
}

export const MomentsGalleryView: React.FC<MomentsGalleryViewProps> = ({
  moments,
  student,
  onAddMoment,
  onToggleLike,
}) => {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('#AlunoEmpreendedor, #Inovação');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [useLiveCamera, setUseLiveCamera] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<string>('todos');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setUseLiveCamera(true);
    } catch (err) {
      console.warn('Camera error for moments:', err);
      // default sample photo if camera blocked
      setPreviewImage('https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setUseLiveCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/jpeg');
        setPreviewImage(data);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPreviewImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateMoment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith('#') ? t : `#${t}`));

    const newMoment: MomentPost = {
      id: `mom-${Date.now()}`,
      title: title.trim(),
      caption: caption.trim() || 'Mais um passo memorável em nossa jornada de ideação e negócio!',
      imageUrl:
        previewImage ||
        'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&auto=format&fit=crop&q=80',
      date: 'Hoje, ' + new Date().toLocaleDateString('pt-BR'),
      authorName: student.name,
      authorAvatar: student.avatarUrl,
      tags: parsedTags.length > 0 ? parsedTags : ['#AlunoEmpreendedor'],
      likes: 1,
      isLiked: true,
    };

    onAddMoment(newMoment);
    setShowModal(false);
    setTitle('');
    setCaption('');
    setPreviewImage(null);
    stopCamera();
  };

  // Collect unique tags
  const allTags = Array.from(new Set(moments.flatMap((m) => m.tags)));

  const filteredMoments = moments.filter((m) => {
    if (selectedTag === 'todos') return true;
    return m.tags.includes(selectedTag);
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
            <Image className="w-3.5 h-3.5" /> Diário de Bordo & Conquistas
          </div>
          <h2 className="text-2xl font-bold font-['Space_Grotesk'] text-slate-900">
            Mural de Momentos do Empreendedor
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Registre fotos das suas reuniões de equipe, protótipos de produtos, validações com clientes, 
            pitch na banca e celebrações ao longo do curso.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition shrink-0"
        >
          <Camera className="w-4 h-4" />
          Registrar Novo Momento
        </button>
      </div>

      {/* Filter by Tag */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Tag className="w-3 h-3" /> Tags:
        </span>
        <button
          onClick={() => setSelectedTag('todos')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
            selectedTag === 'todos'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todos os Momentos ({moments.length})
        </button>
        {allTags.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTag(t)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedTag === t
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Moments Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMoments.map((moment) => (
          <div
            key={moment.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition"
          >
            <div>
              {/* Image with overlay */}
              <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
                <img
                  src={moment.imageUrl}
                  alt={moment.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                />
                <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  {moment.date}
                </span>
              </div>

              {/* Body */}
              <div className="p-5 space-y-2.5">
                <h3 className="font-bold text-slate-900 text-base font-['Space_Grotesk'] leading-snug">
                  {moment.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {moment.caption}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {moment.tags.map((tg, i) => (
                    <span
                      key={i}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                    >
                      {tg}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Author & Like bar */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={moment.authorAvatar}
                  alt={moment.authorName}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover ring-1 ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-700 truncate max-w-[130px]">
                  {moment.authorName}
                </span>
              </div>

              <button
                onClick={() => onToggleLike(moment.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                  moment.isLiked
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-white text-slate-500 border border-slate-200 hover:text-rose-500'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${moment.isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{moment.likes}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: New Moment */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold font-['Space_Grotesk']">
                  Registrar Momento Empreendedor
                </h3>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setShowModal(false);
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMoment} className="p-6 space-y-4">
              {/* Photo Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Foto do Momento
                </label>

                {useLiveCamera ? (
                  <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="absolute bottom-3 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
                    >
                      <Camera className="w-4 h-4" /> Capturar Foto Agora
                    </button>
                  </div>
                ) : previewImage ? (
                  <div className="relative aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPreviewImage(null)}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900/80 text-white rounded-lg text-xs"
                    >
                      Trocar foto
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-emerald-50/50 transition"
                    >
                      <Camera className="w-6 h-6 text-emerald-600" />
                      Tirar Foto com Câmera
                    </button>

                    <label className="p-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-emerald-50/50 transition cursor-pointer">
                      <Upload className="w-6 h-6 text-teal-600" />
                      Upload de Imagem
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título do Momento
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Entrevistando primeiros clientes na praça..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Legenda & Aprendizado
                </label>
                <textarea
                  rows={2}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Conte o que estava acontecendo, quem estava junto e o principal insight..."
                  className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="#Canvas, #PitchDay, #Networking"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setShowModal(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Publicar Momento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
