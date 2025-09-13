// Registro do Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => {
      console.log('✅ Service Worker registrado com escopo:', reg.scope);
    })
    .catch(err => {
      console.error('❌ Erro ao registrar Service Worker:', err);
    });
}

// Solicita permissão para notificações
if ('Notification' in window && Notification.permission !== 'granted') {
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      console.log('✅ Permissão de notificação concedida');
    } else {
      console.warn('⚠️ Permissão de notificação negada');
    }
  });
}

// Exemplo de envio de lembrete local (simulação)
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
