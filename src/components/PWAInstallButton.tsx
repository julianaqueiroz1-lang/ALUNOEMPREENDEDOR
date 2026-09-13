import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle2, Share, PlusSquare } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'header' | 'banner' | 'card';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // If user dismissed the top banner in this session
  if (variant === 'banner' && dismissedBanner) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      await install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // Fallback: prompt modal explaining how to install on desktop/mobile browsers
      setShowIOSGuide(true);
    }
  };

  // 1. Variant: Top Notification Banner for Mobile/Desktop
  if (variant === 'banner') {
    return (
      <>
        <div className={`bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-md border border-emerald-600/40 flex items-center justify-between gap-3 text-xs animate-fadeIn ${className}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 bg-white/15 rounded-xl shrink-0">
              <Smartphone className="w-4 h-4 text-emerald-200" />
            </span>
            <div className="truncate">
              <p className="font-bold text-white text-xs truncate">
                Instale o App na Tela Inicial
              </p>
              <p className="text-emerald-200 text-[11px] truncate hidden sm:block">
                Acesso rápido sem digitar o navegador, com biometria facial e frequência offline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
            <button
              type="button"
              onClick={() => setDismissedBanner(true)}
              className="p-1 text-emerald-300 hover:text-white rounded-lg transition cursor-pointer"
              title="Fechar aviso de instalação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showIOSGuide && (
          <IOSInstallModal onClose={() => setShowIOSGuide(false)} isIOS={isIOS} />
        )}
      </>
    );
  }

  // 2. Variant: Compact Header / Navigation Button
  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className={`px-3 py-1.5 bg-emerald-700/15 hover:bg-emerald-700/25 text-emerald-800 border border-emerald-600/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs ${className}`}
        title="Instalar o aplicativo Aluno Empreendedor no celular ou desktop"
      >
        <Download className="w-3.5 h-3.5 text-emerald-700" />
        <span className="hidden sm:inline">Instalar App</span>
        <span className="sm:hidden">Instalar</span>
      </button>

      {showIOSGuide && (
        <IOSInstallModal onClose={() => setShowIOSGuide(false)} isIOS={isIOS} />
      )}
    </>
  );
};

interface IOSInstallModalProps {
  onClose: () => void;
  isIOS: boolean;
}

const IOSInstallModal: React.FC<IOSInstallModalProps> = ({ onClose, isIOS }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 text-slate-900 space-y-4 animate-scaleUp">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Smartphone className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-black font-['Space_Grotesk'] text-slate-900">
                {isIOS ? 'Instalar no iPhone / iPad' : 'Instalar Aluno Empreendedor'}
              </h3>
              <p className="text-[11px] text-slate-500">Progressive Web App (PWA)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isIOS ? (
          <div className="space-y-3 text-xs text-slate-700">
            <p className="font-medium">
              Siga os passos abaixo no navegador <strong>Safari</strong> para ter o app na tela inicial:
            </p>
            <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-start gap-2.5">
                <span className="p-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px] w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  Toque no botão <strong>Compartilhar</strong> <Share className="w-3.5 h-3.5 inline mx-1 text-emerald-700" /> na barra inferior do Safari.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="p-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px] w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Role a lista e selecione <strong>Adicionar à Tela de Início</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-700" />.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="p-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px] w-5 h-5 flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Toque em <strong>Adicionar</strong> no canto superior direito. Pronto!
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 text-xs text-slate-700">
            <p className="font-medium">
              Para instalar este aplicativo no seu celular Android ou computador:
            </p>
            <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Abra o menu do navegador (três pontos ⋮ no canto superior).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Clique em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition cursor-pointer"
        >
          Entendi
        </button>
      </div>
    </div>
  );
};
