// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyCzy3Vlqe85qq1DPS4jWuvotden0uLC1lM",
  projectId: "vanilze-do-bolo-agendamentos",
  messagingSenderId: "975342027639",
  appId: "1:975342027639:web:61d5077c9e7f32d59f1772"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(payload => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: 'logo.png'
  });
});
