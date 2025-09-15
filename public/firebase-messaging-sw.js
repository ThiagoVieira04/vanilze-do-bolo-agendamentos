// Firebase Messaging (compat)
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js');

// Inicializa Firebase
firebase.initializeApp({
  apiKey: "AIzaSyCzy3Vlqe85qq1DPS4jWuvotden0uLC1lM",
  projectId: "vanilze-do-bolo-agendamentos",
  messagingSenderId: "975342027639",
  appId: "1:975342027639:web:61d5077c9e7f32d59f1772"
});

const messaging = firebase.messaging();

// Cache básico
const CACHE_NAME = 'vanilze-cache-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/logo.png',
  '/beep.mp3',
  '/manifest.json'
];

// Instalação e cache inicial
self.addEventListener('install', event => {
  console.log('✅ Service Worker instalado');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', event => {
  console.log('✅ Service Worker ativado');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }))
    )
  );
  return self.clients.claim();
});

// Intercepta requisições para servir do cache
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

// Mensagem local do script principal
self.addEventListener('message', event => {
  if (event.data?.type === 'SHOW_REMINDER') {
    const task = event.data.task;
    self.registration.showNotification('Lembrete de Encomenda!', {
      body: `Pedido: ${task.orderName}\nCliente: ${task.clientName}\nEntrega hoje às ${task.deliveryTime}.`,
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      data: { dateOfArrival: Date.now(), primaryKey: task.id }
    });
  }
});

// Notificação push via Firebase (fallback)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const title = data.notification?.title || 'Nova notificação';
    const options = {
      body: data.notification?.body || '',
      icon: data.notification?.icon || '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200],
      data: data.data || {}
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

// Notificação em segundo plano via Firebase Messaging
messaging.onBackgroundMessage(payload => {
  if (payload.notification) {
    const { title, body } = payload.notification;
    self.registration.showNotification(title || 'Nova mensagem', {
      body: body || 'Você recebeu uma nova notificação.',
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [200, 100, 200]
    });
  } else {
    console.warn('⚠️ Payload sem campo notification:', payload);
  }
});

// Clique na notificação
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
