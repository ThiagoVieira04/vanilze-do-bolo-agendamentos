const {onSchedule} = require("firebase-functions/v2/scheduler");
const {getDatabase} = require("firebase-admin/database");
const {initializeApp} = require("firebase-admin/app");
const {getMessaging} = require("firebase-admin/messaging");

initializeApp();

exports.enviarLembretes = onSchedule("every 1 minutes", async (event) => {
  const agora = new Date();
  const horaAtual = agora.toTimeString().slice(0, 5); // "HH:MM"
  const dataHoje = agora.toISOString().slice(0, 10); // "YYYY-MM-DD"

  const db = getDatabase();
  const snapshot = await db.ref("agendamentos").once("value");

  snapshot.forEach(child => {
    const pedido = child.val();

    if (
      pedido.data === dataHoje &&
      pedido.lembrete === horaAtual &&
      pedido.tokenFCM
    ) {
      const payload = {
        notification: {
          title: "Lembrete de pedido 🍰",
          body: `Pedido de ${pedido.cliente} para entrega às ${pedido.entrega}`,
          icon: "logo.png"
        }
      };

      getMessaging().sendToDevice(pedido.tokenFCM, payload)
        .then(() => {
          console.log(`✅ Notificação enviada para ${pedido.cliente}`);
        })
        .catch(err => {
          console.error("❌ Erro ao enviar notificação:", err);
        });
    }
  });
});
