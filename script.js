import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

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

document.addEventListener("DOMContentLoaded", () => {
  // ✅ Registrar Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log("Service Worker registrado"))
      .catch(err => console.error("Erro ao registrar SW:", err));
  }

  // ✅ Teste de conexão com Firebase
  window.testFirebase = () => {
    const teste = { mensagem: "Conexão funcionando!", hora: new Date().toISOString() };
    push(ref(database, "agendamentos"), teste)
      .then(() => alert("Teste salvo com sucesso!"))
      .catch(err => console.error("Erro no teste:", err));
  };

  // ✅ Mostrar campos extras de docinhos
  document.querySelectorAll('input[name="more-sweets"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      document.getElementById("extra-sweets-fields").classList.toggle("hidden", e.target.value !== "sim");
    });
  });

  // ✅ Envio do formulário
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
      entrega: document.getElementById("delivery-time").value
    };

    console.log("Enviando agendamento:", agendamento);

    push(ref(database, "agendamentos"), agendamento)
      .then(() => {
        alert("Agendamento salvo com sucesso!");
        document.getElementById("task-form").reset();
        document.getElementById("extra-sweets-fields").classList.add("hidden");
      })
      .catch((error) => {
        console.error("Erro ao salvar agendamento:", error);
        alert("Erro ao salvar. Tente novamente.");
      });
  });
});
