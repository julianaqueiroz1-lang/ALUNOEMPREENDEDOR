import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Calendar,
  Clock,
  CheckCheck,
  AlertTriangle,
  Sparkles,
  X,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Info
} from 'lucide-react';
import { PushNotificationItem, NavigationTab, StudentProfile } from '../types';
import {
  getNotificationPermissionStatus,
  requestFCMNotificationPermission,
  simulateNotificationTrigger,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../services/fcmNotificationService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: PushNotificationItem[];
  student: StudentProfile;
  onNavigateTab: (tab: NavigationTab) => void;
  onRefreshNotifications?: () => void;
}

export function NotificationCenterModal({
  isOpen,
  onClose,
  notifications,
  student,
  onNavigateTab,
}: NotificationCenterModalProps) {
  const [filter, setFilter] = useState<'all' | 'workshop' | 'deadline'>('all');
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>(
    getNotificationPermissionStatus()
  );
  const [isActivatingPush, setIsActivatingPush] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'workshop') return item.type === 'workshop';
    if (filter === 'deadline') return item.type === 'deadline';
    return true;
  });

  const handleRequestPermission = async () => {
    setIsActivatingPush(true);
    setFeedbackMsg(null);
    try {
      const res = await requestFCMNotificationPermission(student.id);
      setPermissionStatus(getNotificationPermissionStatus());
      if (res.granted) {
        setFeedbackMsg('✅ Notificações Push FCM ativadas com sucesso! Você receberá alertas em tempo real.');
      } else {
        setFeedbackMsg(`ℹ️ ${res.error || 'Permissão não concedida.'}`);
      }
    } catch (err: any) {
      setFeedbackMsg('Erro ao registrar permissão.');
    } finally {
      setIsActivatingPush(false);
    }
  };

  const handleSimulate = async (type: 'workshop' | 'deadline') => {
    setIsSimulating(true);
    try {
      await simulateNotificationTrigger(type);
      setFeedbackMsg(
        type === 'workshop'
          ? '🔔 Nova oficina simulada e sincronizada via FCM!'
          : '⏳ Alerta de prazo de atividade disparado!'
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleNotificationClick = (item: PushNotificationItem) => {
    markNotificationAsRead(item.id);
    if (item.targetTab) {
      onNavigateTab(item.targetTab);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold font-['Space_Grotesk'] text-slate-900">
                  Notificações Push
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wide">
                  FCM Ativo
                </span>
              </div>
              <p className="text-xs text-slate-700">
                Alertas instantâneos de novas oficinas e prazos de atividades
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FCM Status Banner */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-emerald-950">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {permissionStatus === 'granted' ? (
                <span className="font-semibold text-emerald-900">
                  Status: Push ativo no seu dispositivo via Firebase Cloud Messaging.
                </span>
              ) : permissionStatus === 'denied' ? (
                <span className="text-amber-800 font-medium">
                  Notificações bloqueadas nas configurações do navegador.
                </span>
              ) : (
                <span>Ative as notificações para receber avisos de oficinas e prazos mesmo fora da tela.</span>
              )}
            </span>
          </div>

          {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
            <button
              onClick={handleRequestPermission}
              disabled={isActivatingPush}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 shrink-0"
            >
              <Smartphone className="w-3.5 h-3.5" />
              {isActivatingPush ? 'Ativando...' : 'Ativar Push FCM'}
            </button>
          )}
        </div>

        {/* Feedback message banner if present */}
        {feedbackMsg && (
          <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 text-xs text-slate-700 flex items-center justify-between">
            <span>{feedbackMsg}</span>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-slate-600 hover:text-slate-900 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter Bar & Simulation Tools */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('workshop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                filter === 'workshop'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Oficinas
            </button>
            <button
              onClick={() => setFilter('deadline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                filter === 'deadline'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Prazos
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsAsRead(notifications)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="w-3.5 h-3.5 text-slate-500" />
                Lidas
              </button>
            )}

            {/* Test Simulation Dropdown/Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSimulate('workshop')}
                disabled={isSimulating}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-medium transition flex items-center gap-1 active:scale-95"
                title="Simula alerta push de nova oficina agendada"
              >
                <Sparkles className="w-3 h-3 text-blue-600" />
                + Testar Oficina
              </button>
              <button
                onClick={() => handleSimulate('deadline')}
                disabled={isSimulating}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium transition flex items-center gap-1 active:scale-95"
                title="Simula alerta push de prazo de atividade"
              >
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                + Testar Prazo
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Scroll List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 divide-y divide-slate-100">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-700 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-600">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Nenhuma notificação encontrada</p>
              <p className="text-xs text-slate-700 mt-1">
                Você receberá alertas aqui assim que novas oficinas forem agendadas ou prazos se aproximarem.
              </p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const isWorkshop = item.type === 'workshop';
              const isDeadline = item.type === 'deadline';

              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`pt-3 first:pt-0 p-3.5 rounded-xl border transition cursor-pointer ${
                    !item.read
                      ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/70'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isWorkshop
                          ? 'bg-blue-100 text-blue-700'
                          : isDeadline
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isWorkshop ? (
                        <Calendar className="w-4 h-4" />
                      ) : isDeadline ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4
                          className={`text-xs sm:text-sm font-semibold truncate ${
                            !item.read ? 'text-slate-900 font-bold' : 'text-slate-700'
                          }`}
                        >
                          {item.title}
                        </h4>
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed mb-2.5">
                        {item.body}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-600" />
                          {new Date(item.date).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              isWorkshop
                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                : isDeadline
                                ? 'bg-amber-50 text-amber-800 border border-amber-100'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {isWorkshop ? 'Oficina' : isDeadline ? 'Prazo de Atividade' : 'Aviso'}
                          </span>

                          {item.targetTab && (
                            <span className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-0.5">
                              {item.targetTab === 'cronograma' ? 'Ver no Cronograma' : 'Ver Atividades'}
                              <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-700">
          <span className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-600" />
            Sincronizado via Firestore & Firebase Cloud Messaging
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
