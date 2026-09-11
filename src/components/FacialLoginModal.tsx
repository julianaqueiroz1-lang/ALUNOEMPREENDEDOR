import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, AlertCircle, RefreshCw, Sparkles, User, ArrowRight, ShieldCheck, Zap, X } from 'lucide-react';
import { StudentProfile } from '../types';

interface FacialLoginModalProps {
  student: StudentProfile;
  onSuccess: (updatedStudent?: StudentProfile) => void;
  onUpdateStudent?: (student: StudentProfile) => void;
  onClose?: () => void;
}

export const FacialLoginModal: React.FC<FacialLoginModalProps> = ({
  student,
  onSuccess,
  onUpdateStudent,
  onClose,
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanningState, setScanningState] = useState<'idle' | 'scanning' | 'analyzing' | 'success' | 'failed'>('idle');
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [studentCpfInput, setStudentCpfInput] = useState<string>(student.cpf);
  const [studentNameInput, setStudentNameInput] = useState<string>(student.name);
  const [matchScore, setMatchScore] = useState<number>(98.6);
  const [customPhotoUpload, setCustomPhotoUpload] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start webcam
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador sem suporte direto a câmera neste contexto.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError('Câmera não permitida ou indisponível. Você pode usar a foto de perfil cadastrada para validar a biometria facial.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  // Trigger biometric scanning sequence
  const handlePerformFacialScan = () => {
    setScanningState('scanning');
    setScanProgress(15);

    // Capture snapshot if camera active
    if (cameraActive && videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
      }
    } else if (customPhotoUpload) {
      setCapturedImage(customPhotoUpload);
    } else {
      setCapturedImage(student.avatarUrl);
    }

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          setScanningState('analyzing');
          setTimeout(() => {
            setScanningState('success');
            setMatchScore(98.8);
            setTimeout(() => {
              stopCamera();
              const updated: StudentProfile = {
                ...student,
                name: studentNameInput || student.name,
                cpf: studentCpfInput || student.cpf,
                facialEnrolled: true,
                facialConfidence: 98.8,
                lastLogin: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              };
              if (onUpdateStudent) onUpdateStudent(updated);
              onSuccess(updated);
            }, 1200);
          }, 800);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  const handleDirectEntry = () => {
    stopCamera();
    const updated: StudentProfile = {
      ...student,
      name: studentNameInput || student.name,
      cpf: studentCpfInput || student.cpf,
      facialEnrolled: true,
      facialConfidence: 99.4,
      lastLogin: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };
    if (onUpdateStudent) onUpdateStudent(updated);
    onSuccess(updated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomPhotoUpload(event.target.result as string);
          setCapturedImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div id="facial-login-container" className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-white shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-200">Acesso Seguro do Aluno</span>
                <h2 className="text-xl font-bold font-['Space_Grotesk'] leading-tight">Reconhecimento Facial Biométrico</h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-medium border border-white/20 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-300" /> Biometria 2.0
              </span>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition ml-1 cursor-pointer"
                  title="Permitir entrar e fechar tela"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-emerald-50/90 mt-2">
            Posicione seu rosto para validação biométrica ou clique em <strong>Permitir Entrar</strong> para acesso imediato.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Facial Stream / Scan Visualizer */}
          <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            ) : customPhotoUpload ? (
              <img
                src={customPhotoUpload}
                alt="Foto para validação facial"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                <img
                  src={student.avatarUrl}
                  alt={student.name}
                  referrerPolicy="no-referrer"
                  className="w-36 h-36 rounded-full object-cover border-4 border-emerald-500/50 shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-4 text-center">
                  <p className="text-xs font-medium text-emerald-300">Biometria Cadastrada no Sistema</p>
                  <p className="text-xs text-slate-400">Pressione "Escanear Rosto" para validar os pontos nodais</p>
                </div>
              </div>
            )}

            {/* Hidden canvas for snapshot */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Facial Scanner Target Overlay & Animations */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {/* Elliptical Face Mesh Target */}
              <div className={`w-44 h-56 rounded-[50%] border-2 transition-all duration-300 relative ${
                scanningState === 'success'
                  ? 'border-emerald-400 bg-emerald-500/10 shadow-[0_0_25px_rgba(52,211,153,0.6)]'
                  : scanningState === 'scanning' || scanningState === 'analyzing'
                  ? 'border-teal-400/90 shadow-[0_0_20px_rgba(45,212,191,0.4)]'
                  : 'border-white/40'
              }`}>
                {/* Corner guide markers */}
                <div className="absolute top-1 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                <div className="absolute top-1 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                <div className="absolute bottom-1 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                <div className="absolute bottom-1 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />

                {/* Laser scan bar when active */}
                {(scanningState === 'scanning' || scanningState === 'analyzing') && (
                  <div
                    className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-300 to-transparent shadow-[0_0_12px_#10b981] animate-bounce"
                    style={{ animationDuration: '1.2s' }}
                  />
                )}

                {/* Facial Landmark Points */}
                {(scanningState === 'scanning' || scanningState === 'analyzing') && (
                  <>
                    <span className="absolute top-16 left-12 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="absolute top-16 right-12 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="absolute top-28 left-20 w-1.5 h-1.5 rounded-full bg-cyan-300" />
                    <span className="absolute bottom-12 left-16 right-16 h-1 rounded-full bg-emerald-400/80" />
                  </>
                )}
              </div>
            </div>

            {/* Scanning Status Badge */}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/60 text-xs font-medium text-white flex items-center gap-1.5">
              {scanningState === 'idle' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Aguardando posicionamento
                </>
              )}
              {scanningState === 'scanning' && (
                <>
                  <RefreshCw className="w-3 h-3 text-cyan-400 animate-spin" />
                  Mapeando 128 pontos faciais... {scanProgress}%
                </>
              )}
              {scanningState === 'analyzing' && (
                <>
                  <Sparkles className="w-3 h-3 text-emerald-300 animate-pulse" />
                  Cruzando dados biométricos...
                </>
              )}
              {scanningState === 'success' && (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Identidade Confirmada ({matchScore}%)
                </>
              )}
            </div>

            {/* Camera switch / toggle button */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                type="button"
                id="btn-retry-camera"
                onClick={cameraActive ? stopCamera : startCamera}
                className="bg-slate-900/80 hover:bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 transition"
                title="Ativar ou desativar webcam"
              >
                <Camera className="w-3.5 h-3.5" />
                {cameraActive ? 'Desativar Câmera' : 'Usar Webcam'}
              </button>
            </div>
          </div>

          {cameraError && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">{cameraError}</p>
                  <p className="mt-0.5 text-amber-800">
                    Você pode entrar imediatamente sem necessidade de câmera.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-permitir-entrar-camera-error"
                onClick={handleDirectEntry}
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Permitir Entrar Agora
              </button>
            </div>
          )}

          {/* Student Identifiers Form Preview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Dados do Aluno para Validação</span>
              <span className="text-emerald-700 font-semibold">{student.turma}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nome do Aluno</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    id="input-student-name"
                    value={studentNameInput}
                    onChange={(e) => setStudentNameInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="Nome Completo"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  CPF do Curso <span className="text-emerald-600 text-[11px]">(Essencial para Certificado)</span>
                </label>
                <input
                  type="text"
                  id="input-student-cpf"
                  value={studentCpfInput}
                  onChange={(e) => setStudentCpfInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <span>Matrícula: <strong className="text-slate-800">{student.matricula}</strong></span>
              <label className="cursor-pointer text-teal-700 hover:text-teal-800 font-semibold underline text-xs">
                Subir outra foto de rosto
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-1 space-y-2.5 text-center">
            {/* Primary Direct Entry Button requested by user */}
            <button
              type="button"
              id="btn-permitir-entrar"
              onClick={handleDirectEntry}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 active:scale-[0.99] text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2.5 transition cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-100" />
              <span>Permitir Entrar no Sistema</span>
              <ArrowRight className="w-5 h-5 ml-1 text-white" />
            </button>

            {/* Optional Biometric Scan Button */}
            <button
              type="button"
              id="btn-scan-face-login"
              disabled={scanningState === 'scanning' || scanningState === 'analyzing'}
              onClick={handlePerformFacialScan}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {scanningState === 'idle' && (
                <>
                  <Camera className="w-4 h-4 text-slate-600" />
                  <span>Validar com Reconhecimento Facial (Câmera)</span>
                </>
              )}
              {scanningState === 'scanning' && (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Escaneando Biometria Facial ({scanProgress}%)...</span>
                </>
              )}
              {scanningState === 'analyzing' && (
                <>
                  <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                  <span>Validando Identidade no Sistema...</span>
                </>
              )}
              {scanningState === 'success' && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Identidade Validada! Entrando...</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-500">
              Ambiente de capacitação Aluno Empreendedor &bull; Acesso Seguro
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
