// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";
import { getMessaging } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCzy3Vlqe85qq1DPS4jWuvotden0uLC1lM",
  authDomain: "vanilze-do-bolo-agendamentos.firebaseapp.com",
  databaseURL: "https://vanilze-do-bolo-agendamentos-default-rtdb.firebaseio.com",
  projectId: "vanilze-do-bolo-agendamentos",
  storageBucket: "vanilze-do-bolo-agendamentos.firebasestorage.app",
  messagingSenderId: "975342027639",
  appId: "1:975342027639:web:61d5077c9e7f32d59f1772"
  };

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const messaging = getMessaging(app);

// Registro do Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => {
      console.log('✅ Service Worker registrado com escopo:', reg.scope);

      // Vincula Firebase Messaging ao Service Worker
      if (window.firebase?.messaging) {
        messaging.useServiceWorker(reg);
      }

      // Ativa botão de permissão de notificação após registro
      document.addEventListener('DOMContentLoaded', () => {
        const btn = document.getElementById('ativarNotificacoes');
        if (btn) {
          btn.addEventListener('click', () => {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                console.log('✅ Permissão de notificação concedida');
              } else {
                console.warn('⚠️ Permissão de notificação negada');
              }
            });
          });
        }
      });
    })
    .catch(err => {
      console.error('❌ Erro ao registrar Service Worker:', err);
    });
}

// Envia lembrete local via Service Worker
function enviarLembreteLocal(task) {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_REMINDER',
      task: task
    });
  } else {
    console.warn('⚠️ Nenhum Service Worker ativo para enviar lembrete');
  }
}

// Salva agendamento no Realtime Database
function salvarAgendamento(task) {
  const agendamentosRef = ref(db, 'agendamentos');
  push(agendamentosRef, task)
    .then(() => console.log('✅ Agendamento salvo com sucesso'))
    .catch(err => console.error('❌ Erro ao salvar agendamento:', err));
}
