import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (isOnline) {
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (isOnline && !showReconnected) return null;

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-2xl bg-slate-900/90 backdrop-blur-xs border border-slate-700 px-3.5 py-2 text-xs font-bold text-amber-300 shadow-2xl animate-fadeIn">
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
        <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>Modo Offline Ativo — Cache do PWA em uso</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-2xl bg-emerald-900/90 backdrop-blur-xs border border-emerald-700 px-3.5 py-2 text-xs font-bold text-emerald-200 shadow-2xl animate-fadeIn">
      <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
      <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span>Conexão restabelecida</span>
    </div>
  );
};
