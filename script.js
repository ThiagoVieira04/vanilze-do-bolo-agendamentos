document.getElementById("task-form").addEventListener("submit", function(e) {
  e.preventDefault();

  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      getToken(messaging, {
        vapidKey: "BNS0MP9B27r1SwgYtTeGqqwvDqqj4KzIzbdO8ot3Fnv6d5XkjeNS-Npc8zDBcyCweNSub-DFyFvc5FgE-TuAlu8"
      })
      .then(currentToken => {
        if (!currentToken) {
          console.warn("Token FCM não disponível.");
          return;
        }

        const maisDocinhos = document.querySelector('input[name="more-sweets"]:checked').value;
        const agendamento = {
          encomenda: document.getElementById("order-name").value,
          cliente: document.getElementById("client-name").value,
          whatsapp: document.getElementById("client-whatsapp").value,
          recheios: document.getElementById("cake-fillings").value,
          docinho: document.getElementById("sweets").value,
          maisDocinhos: maisDocinhos,
          quaisDocinhos: maisDocinhos === "sim" ? document.getElementById("which-sweets").value : "",
          qtdDocinhos: maisDocinhos === "sim" ? document.getElementById("sweets-quantity").value : "",
          data: document.getElementById("order-date").value,
          lembrete: document.getElementById("reminder-time").value,
          entrega: document.getElementById("delivery-time").value,
          criadoEm: new Date().toISOString(),
          tokenFCM: currentToken // ✅ Token salvo junto com o agendamento
        };

        push(ref(database, "agendamentos"), agendamento)
          .then(() => {
            alert("Agendamento salvo com sucesso!");
            document.getElementById("task-form").reset();
            document.getElementById("extra-sweets-fields").classList.add("hidden");
            showScreen("home");

            new Notification("Pedido agendado com sucesso!", {
              body: "Você receberá um lembrete no horário escolhido.",
              icon: "logo.png"
            });
          })
          .catch((error) => {
            console.error("Erro ao salvar agendamento:", error);
            alert("Erro ao salvar. Tente novamente.");
          });
      })
      .catch(err => console.error("Erro ao gerar token FCM:", err));
    } else {
      console.warn("Permissão de notificação negada.");
    }
  });
});
