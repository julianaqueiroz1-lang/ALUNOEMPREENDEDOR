// Firebase Cloud Messaging Service Worker for Aluno Empreendedor
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: "gen-lang-client-0033587547",
  appId: "1:536668855844:web:6f2cf82e9d73c873d042b1",
  apiKey: "AIzaSyAcsmpdNcvJzyAw3fE6mRLU_NhjcAq5Yqs",
  authDomain: "gen-lang-client-0033587547.firebaseapp.com",
  messagingSenderId: "536668855844"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Background message handler
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensagem recebida em segundo plano:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'Aluno Empreendedor - Notificação';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || 'Você possui um novo alerta no programa Aluno Empreendedor.',
      icon: '/assets/icon.png',
      badge: '/assets/icon.png',
      tag: payload.data?.type || 'aluno-empreendedor-alert',
      data: payload.data || {},
      requireInteraction: payload.data?.priority === 'high',
      vibrate: [200, 100, 200],
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (err) {
  console.warn('[firebase-messaging-sw.js] Falha ao inicializar FCM no SW:', err);
}

// Notification click handler to open or focus the web app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetTab = event.notification.data?.targetTab || 'cronograma';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({ type: 'NAVIGATE_TAB', tab: targetTab });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(`/?tab=${targetTab}`);
      }
    })
  );
});
