import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { firebaseApp, firestoreDb } from './firestorePersistenceService';
import firebaseConfig from '../../firebase-applet-config.json';
import { PushNotificationItem, FCMTokenRecord, NavigationTab, NotificationType } from '../types';

let messagingInstance: Messaging | null = null;
let messagingChecked = false;

/**
 * Initializes and retrieves the Firebase Cloud Messaging instance if supported by the browser.
 */
export async function getFCMInstance(): Promise<Messaging | null> {
  if (messagingChecked) {
    return messagingInstance;
  }

  try {
    const supported = await isSupported();
    if (supported && typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator) {
      messagingInstance = getMessaging(firebaseApp);
    }
  } catch (err) {
    console.warn('[FCM Service] Firebase Cloud Messaging não suportado neste ambiente:', err);
    messagingInstance = null;
  } finally {
    messagingChecked = true;
  }

  return messagingInstance;
}

/**
 * Gets current browser notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Requests Notification permission and registers the student's FCM token in Firestore.
 */
export async function requestFCMNotificationPermission(
  studentId: string
): Promise<{ granted: boolean; token?: string; error?: string }> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return {
      granted: false,
      error: 'Notificações push não são suportadas por este navegador.',
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return {
        granted: false,
        error: 'Permissão para envio de notificações foi recusada no navegador.',
      };
    }

    // Register the service worker
    let swRegistration: ServiceWorkerRegistration | undefined;
    if ('serviceWorker' in navigator) {
      try {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('[FCM Service] Service Worker registrado com sucesso para push notifications.');
      } catch (swErr) {
        console.warn('[FCM Service] Registro de Service Worker encontrou aviso:', swErr);
      }
    }

    const messaging = await getFCMInstance();
    let token = '';

    if (messaging) {
      try {
        // Obter token FCM do dispositivo
        token = await getToken(messaging, {
          serviceWorkerRegistration: swRegistration,
        });
      } catch (tokenErr: any) {
        console.warn('[FCM Service] Não foi possível gerar token remoto FCM (VAPID key necessária para push externo), gerando token de sessão local:', tokenErr);
        // Fallback token identifier for Firestore registration
        token = `fcm_${studentId}_${navigator.userAgent.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;
      }
    } else {
      token = `fcm_${studentId}_fallback_${Date.now()}`;
    }

    if (token) {
      await saveFCMTokenToFirestore(studentId, token);
    }

    return {
      granted: true,
      token,
    };
  } catch (error: any) {
    console.error('[FCM Service] Erro ao solicitar permissão de notificações:', error);
    return {
      granted: false,
      error: error?.message || 'Falha ao ativar notificações push.',
    };
  }
}

/**
 * Saves FCM Token to Firestore under 'fcm_tokens' collection.
 */
export async function saveFCMTokenToFirestore(
  studentId: string,
  token: string
): Promise<boolean> {
  try {
    const tokenId = `${studentId}_${token.slice(-16).replace(/[^a-zA-Z0-9]/g, '')}`;
    const tokenDocRef = doc(firestoreDb, 'fcm_tokens', tokenId);

    const tokenRecord: FCMTokenRecord = {
      token,
      studentId,
      device: typeof navigator !== 'undefined' ? navigator.userAgent : 'web-client',
      updatedAt: new Date().toISOString(),
      active: true,
    };

    await setDoc(tokenDocRef, tokenRecord, { merge: true });
    console.log('[FCM Service] Token do dispositivo registrado no Firestore.');
    return true;
  } catch (error) {
    console.error('[FCM Service] Erro ao salvar token no Firestore:', error);
    return false;
  }
}

/**
 * Listens for foreground FCM messages and executes callback.
 */
export function setupFCMForegroundListener(
  onNotificationReceived: (notification: PushNotificationItem) => void
): () => void {
  let unsubscribe: (() => void) | undefined;

  getFCMInstance().then((messaging) => {
    if (messaging) {
      unsubscribe = onMessage(messaging, (payload) => {
        console.log('[FCM Service] Mensagem FCM recebida em primeiro plano:', payload);

        const item: PushNotificationItem = {
          id: payload.messageId || `fcm_${Date.now()}`,
          title: payload.notification?.title || payload.data?.title || 'Novo Alerta - Aluno Empreendedor',
          body: payload.notification?.body || payload.data?.body || 'Atualização importante no seu programa.',
          type: (payload.data?.type as NotificationType) || 'announcement',
          targetTab: (payload.data?.targetTab as NavigationTab) || 'cronograma',
          date: new Date().toISOString(),
          read: false,
          priority: (payload.data?.priority as 'high' | 'normal') || 'high',
        };

        // Trigger local visual browser notification if permission granted
        triggerLocalPushDisplay(item.title, item.body, item.targetTab, item.type);

        onNotificationReceived(item);
      });
    }
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}

/**
 * Triggers a native browser notification if granted
 */
export function triggerLocalPushDisplay(
  title: string,
  body: string,
  targetTab?: NavigationTab,
  type?: string
) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon: '/assets/icon.png',
        badge: '/assets/icon.png',
        tag: type || 'aluno-empreendedor-alert',
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (targetTab) {
          window.dispatchEvent(new CustomEvent('NAVIGATE_TAB', { detail: targetTab }));
        }
      };
    } catch (err) {
      console.warn('[FCM Service] Notificação nativa não pôde ser instanciada diretamente:', err);
    }
  }
}

/* =========================================================================
 * FIRESTORE NOTIFICATIONS PERSISTENCE & REAL-TIME SYNC
 * ========================================================================= */

const NOTIFICATIONS_COLLECTION = 'notifications';

// Initial baseline notifications for students (Workshops & Deadlines)
export const DEFAULT_NOTIFICATIONS: PushNotificationItem[] = [
  {
    id: 'notif_workshop_1',
    title: '📅 Nova Oficina Agendada: Pitch de Vendas & Storytelling',
    body: 'Uma nova oficina prática foi confirmada para o dia 20/09 às 14:00 no Polo SASP. A participação vale 2 horas complementares.',
    type: 'workshop',
    targetTab: 'cronograma',
    date: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 min ago
    read: false,
    priority: 'high',
    metadata: {
      workshopId: 'ws_pitch_05',
      workshopDate: '2026-09-20',
    },
  },
  {
    id: 'notif_deadline_1',
    title: '⏳ Prazo Próximo: Envio do Relatório de MVP (Atividade)',
    body: 'Atenção: O prazo de validação do protótipo com clientes encerra em 48 horas. Submeta o comprovante na aba Atividades Complementares.',
    type: 'deadline',
    targetTab: 'atividades',
    date: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2h ago
    read: false,
    priority: 'high',
    metadata: {
      activityId: 'act_mvp_report',
      deadlineDate: '2026-09-14',
    },
  },
  {
    id: 'notif_workshop_2',
    title: '🎤 Palestra Especial: Formalização MEI & Linhas de Crédito',
    body: 'Palestra presencial confirmada com a Agência de Desenvolvimento. Traga suas dúvidas sobre abertura de CNPJ.',
    type: 'workshop',
    targetTab: 'cronograma',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    read: true,
    priority: 'normal',
    metadata: {
      workshopId: 'ws_mei_06',
    },
  },
];

/**
 * Subscribes to real-time notifications for a student.
 */
export function subscribeToNotifications(
  studentId: string,
  onUpdate: (notifications: PushNotificationItem[]) => void
): Unsubscribe {
  const collRef = collection(firestoreDb, NOTIFICATIONS_COLLECTION);
  
  // Listen to notifications targeted at 'all' or specifically to this student
  return onSnapshot(
    collRef,
    (snapshot) => {
      if (snapshot.empty) {
        onUpdate(DEFAULT_NOTIFICATIONS);
        return;
      }

      const list: PushNotificationItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!data.targetStudentId || data.targetStudentId === 'all' || data.targetStudentId === studentId) {
          list.push({
            id: docSnap.id,
            title: data.title || '',
            body: data.body || '',
            type: data.type || 'announcement',
            targetStudentId: data.targetStudentId,
            targetTab: data.targetTab,
            date: data.date || new Date().toISOString(),
            read: Boolean(data.read),
            priority: data.priority || 'normal',
            metadata: data.metadata,
          });
        }
      });

      // Sort newest first
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(list.length > 0 ? list : DEFAULT_NOTIFICATIONS);
    },
    (err) => {
      console.warn('[FCM Service] Listener de notificações encontrou aviso:', err);
      onUpdate(DEFAULT_NOTIFICATIONS);
    }
  );
}

/**
 * Dispatches a new notification to Firestore and triggers local browser alert
 */
export async function dispatchNotification(
  notification: Omit<PushNotificationItem, 'id' | 'date' | 'read'>
): Promise<PushNotificationItem> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const fullItem: PushNotificationItem = {
    ...notification,
    id,
    date: new Date().toISOString(),
    read: false,
  };

  try {
    const docRef = doc(firestoreDb, NOTIFICATIONS_COLLECTION, id);
    await setDoc(docRef, fullItem);
    console.log('[FCM Service] Nova notificação persistida no Firestore:', fullItem.title);
  } catch (err) {
    console.warn('[FCM Service] Aviso ao salvar notificação remota:', err);
  }

  // Trigger local OS / browser push notification
  triggerLocalPushDisplay(fullItem.title, fullItem.body, fullItem.targetTab, fullItem.type);

  return fullItem;
}

/**
 * Marks a notification as read in Firestore
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const docRef = doc(firestoreDb, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, { read: true });
  } catch (err) {
    console.warn('[FCM Service] Não foi possível atualizar status da notificação no Firestore:', err);
  }
}

/**
 * Marks all notifications as read
 */
export async function markAllNotificationsAsRead(notifications: PushNotificationItem[]): Promise<void> {
  try {
    const batch = writeBatch(firestoreDb);
    for (const notif of notifications) {
      if (!notif.read) {
        const docRef = doc(firestoreDb, NOTIFICATIONS_COLLECTION, notif.id);
        batch.update(docRef, { read: true });
      }
    }
    await batch.commit();
  } catch (err) {
    console.warn('[FCM Service] Erro ao marcar todas como lidas:', err);
  }
}

/**
 * Simulates a realistic trigger for new workshop or activity deadline
 */
export async function simulateNotificationTrigger(
  type: 'workshop' | 'deadline'
): Promise<PushNotificationItem> {
  if (type === 'workshop') {
    return dispatchNotification({
      title: '🚀 Nova Oficina Aberta: Estratégias de Tráfego Pago & Redes Sociais',
      body: 'Uma nova oficina com vagas limitadas foi agendada para 25/09 às 15h. Confirme sua presença pelo cronograma!',
      type: 'workshop',
      targetTab: 'cronograma',
      priority: 'high',
      metadata: {
        workshopId: `ws_trafego_${Date.now()}`,
        workshopDate: '2026-09-25',
      },
    });
  } else {
    return dispatchNotification({
      title: '⚠️ Lembrete de Prazo: Comprovante de Visita Técnica',
      body: 'O prazo final para envio da foto e relatório da visita técnica a um empreendimento parceiro expira em 24h.',
      type: 'deadline',
      targetTab: 'atividades',
      priority: 'high',
      metadata: {
        activityId: `act_visita_${Date.now()}`,
        deadlineDate: '2026-09-13',
      },
    });
  }
}
