import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging.js";

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
const database = getDatabase(app);
const messaging = getMessaging(app); // ✅ Adicionado FCM

// Solicitar permissão para notificações e gerar token
Notification.requestPermission().then(permission => {
  if (permission === "granted") {
    getToken(messaging, {
      vapidKey: "BNS0MP9B27r1SwgYtTeGqqwvDqqj4KzIzbdO8ot3Fnv6d5XkjeNS-Npc8zDBcyCweNSub-DFyFvc5FgE-TuAlu8" // 🔑 Substitua pela sua chave VAPID do Firebase
    })
    .then(currentToken => {
      if (currentToken) {
        console.log("Token FCM:", currentToken);
        // Você pode salvar esse token no Firebase para enviar notificações personalizadas
      } else {
        console.warn("Token não disponível.");
      }
    })
    .catch(err => console.error("Erro ao gerar token:", err));
  }
});

// Navegação entre telas
const screens = {
  home: document.getElementById("home-screen"),
  form: document.getElementById("form-screen"),
  tasks: document.getElementById("tasks-screen")
};

function showScreen(screenName) {
  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  screens[screenName].classList.add("active");
}

// Botões de navegação
document.getElementById("goToFormBtn").addEventListener("click", () => showScreen("form"));
document.getElementById("goToTasksBtn").addEventListener("click", () => {
  showScreen("tasks");
  loadTasks();
});
document.getElementById("backToHomeFromFormBtn").addEventListener("click", () => showScreen("home"));
document.getElementById("backToHomeFromTasksBtn").addEventListener("click", () => showScreen("home"));

// Mostrar campos extras de docinhos
document.querySelectorAll('input[name="more-sweets"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    document.getElementById("extra-sweets-fields").classList.toggle("hidden", e.target.value !== "sim");
  });
});

// Enviar agendamento
document.getElementById("task-form").addEventListener("submit", function(e) {
  e.preventDefault();

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
    criadoEm: new Date().toISOString()
  };

  push(ref(database, "agendamentos"), agendamento)
    .then(() => {
      alert("Agendamento salvo com sucesso!");
      document.getElementById("task-form").reset();
      document.getElementById("extra-sweets-fields").classList.add("hidden");
      showScreen("home");

      // ✅ Notificação no navegador
      if (Notification.permission === "granted") {
        new Notification("Pedido agendado com sucesso!", {
          body: "Você receberá um lembrete no horário escolhido.",
          icon: "logo.png"
        });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification("Pedido agendado com sucesso!", {
              body: "Você receberá um lembrete no horário escolhido.",
              icon: "logo.png"
            });
          }
        });
      }
    })
    .catch((error) => {
      console.error("Erro ao salvar agendamento:", error);
      alert("Erro ao salvar. Tente novamente.");
    });
});

// Carregar agendamentos
function loadTasks() {
  const taskList = document.getElementById("task-list");
  taskList.innerHTML = "<p>Carregando...</p>";

  onValue(ref(database, "agendamentos"), snapshot => {
    taskList.innerHTML = "";
    if (!snapshot.exists()) {
      taskList.innerHTML = "<p>Nenhum agendamento encontrado.</p>";
      return;
    }

    const tasks = snapshot.val();
    Object.entries(tasks).forEach(([id, task]) => {
      const div = document.createElement("div");
      div.className = "task-item";
      div.innerHTML = `
        <h3>${task.encomenda}</h3>
        <p><strong>Cliente:</strong> ${task.cliente}</p>
        <p><strong>WhatsApp:</strong> ${task.whatsapp}</p>
        <p><strong>Recheios:</strong> ${task.recheios}</p>
        <p><strong>Docinho:</strong> ${task.docinho}</p>
        ${task.maisDocinhos === "sim" ? `
          <p><strong>Extras:</strong> ${task.quaisDocinhos} (${task.qtdDocinhos})</p>
        ` : ""}
        <p><strong>Data:</strong> ${task.data}</p>
        <p><strong>Lembrete:</strong> ${task.lembrete}</p>
        <p><strong>Entrega:</strong> ${task.entrega}</p>
      `;
      taskList.appendChild(div);
    });
  });
}
