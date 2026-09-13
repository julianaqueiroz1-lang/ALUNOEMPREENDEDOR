import React, { useEffect } from 'react';
import { BellRing, Calendar, Clock, X, ChevronRight } from 'lucide-react';
import { PushNotificationItem, NavigationTab } from '../types';

interface IncomingPushToastProps {
  notification: PushNotificationItem | null;
  onClose: () => void;
  onNavigateTab: (tab: NavigationTab) => void;
}

export function IncomingPushToast({
  notification,
  onClose,
  onNavigateTab,
}: IncomingPushToastProps) {
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      onClose();
    }, 7000);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const isWorkshop = notification.type === 'workshop';
  const isDeadline = notification.type === 'deadline';

  const handleClick = () => {
    if (notification.targetTab) {
      onNavigateTab(notification.targetTab);
    }
    onClose();
  };

  return (
    <div className="fixed top-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-top-4 duration-300">
      <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-2xl flex items-start gap-3 relative overflow-hidden">
        {/* Accent Bar */}
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500" />

        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isWorkshop
              ? 'bg-blue-100 text-blue-700'
              : isDeadline
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'
          }`}
        >
          {isWorkshop ? (
            <Calendar className="w-5 h-5" />
          ) : isDeadline ? (
            <Clock className="w-5 h-5" />
          ) : (
            <BellRing className="w-5 h-5" />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-2 cursor-pointer" onClick={handleClick}>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Notificação Push FCM
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
            {notification.title}
          </h4>
          <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-snug">
            {notification.body}
          </p>

          {notification.targetTab && (
            <div className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
              <span>{notification.targetTab === 'cronograma' ? 'Acessar Oficina' : 'Ver Prazos de Atividades'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition"
          aria-label="Fechar notificação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
