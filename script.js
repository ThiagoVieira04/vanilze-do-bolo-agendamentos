// Registro do Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => {
      console.log('✅ Service Worker registrado com escopo:', reg.scope);

      // Se estiver usando Firebase Messaging, vincule aqui:
      if (window.firebase?.messaging) {
        const messaging = firebase.messaging();
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
