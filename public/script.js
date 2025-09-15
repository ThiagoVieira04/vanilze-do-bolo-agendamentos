import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove, set } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCzy3Vlqe85qq1DPS4jWuvotden0uLC1lM",
  authDomain: "vanilze-do-bolo-agendamentos.firebaseapp.com",
  databaseURL: "https://vanilze-do-bolo-agendamentos-default-rtdb.firebaseio.com",
  projectId: "vanilze-do-bolo-agendamentos",
  storageBucket: "vanilze-do-bolo-agendamentos.appspot.com",
  messagingSenderId: "975342027639",
  appId: "1:975342027639:web:148f836f0dc66e7f9f1772"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

document.addEventListener('DOMContentLoaded', () => {
  // ✅ Registra o Service Worker
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('✅ Service Worker registrado:', reg.scope))
    .catch(err => console.error('❌ Falha ao registrar Service Worker:', err));

  // ✅ Solicita permissão de notificação automaticamente
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('✅ Notificações ativadas automaticamente');
      } else {
        console.warn('⚠️ Notificações não permitidas');
      }
    });
  }

  const screens = {
    home: document.getElementById('home-screen'),
    form: document.getElementById('form-screen'),
    tasks: document.getElementById('tasks-screen'),
  };

  const buttons = {
    goToForm: document.getElementById('goToFormBtn'),
    goToTasks: document.getElementById('goToTasksBtn'),
    backToHomeFromForm: document.getElementById('backToHomeFromFormBtn'),
    backToHomeFromTasks: document.getElementById('backToHomeFromTasksBtn')
  };

  const taskForm = document.getElementById('task-form');
  const taskListDiv = document.getElementById('task-list');
  const moreSweetsRadios = document.querySelectorAll('input[name="more-sweets"]');
  const extraSweetsFields = document.getElementById('extra-sweets-fields');

  function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
  }

  buttons.goToForm.addEventListener('click', () => showScreen('form'));
  buttons.goToTasks.addEventListener('click', () => {
    renderTasks();
    showScreen('tasks');
  });
  buttons.backToHomeFromForm.addEventListener('click', () => showScreen('home'));
  buttons.backToHomeFromTasks.addEventListener('click', () => showScreen('home'));

  moreSweetsRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      extraSweetsFields.classList.toggle('hidden', e.target.value === 'nao');
    });
  });

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const moreSweetsValue = document.querySelector('input[name="more-sweets"]:checked').value;
    const task = {
      orderName: document.getElementById('order-name').value,
      clientName: document.getElementById('client-name').value,
      clientWhatsapp: document.getElementById('client-whatsapp').value,
      cakeFillings: document.getElementById('cake-fillings').value,
      sweets: document.getElementById('sweets').value,
      moreSweets: moreSweetsValue,
      whichSweets: moreSweetsValue === 'sim' ? document.getElementById('which-sweets').value : '',
      sweetsQuantity: moreSweetsValue === 'sim' ? document.getElementById('sweets-quantity').value : '',
      orderDate: document.getElementById('order-date').value,
      reminderTime: document.getElementById('reminder-time').value,
      deliveryTime: document.getElementById('delivery-time').value,
      reminded: false
    };
    push(ref(db, 'agendamentos'), task)
      .then(() => {
        alert('✅ Tarefa agendada com sucesso!');
        taskForm.reset();
        extraSweetsFields.classList.add('hidden');
        showScreen('home');
      })
      .catch(err => console.error('❌ Erro ao salvar:', err));
  });

  function renderTasks() {
    const agendamentosRef = ref(db, 'agendamentos');
    onValue(agendamentosRef, snapshot => {
      taskListDiv.innerHTML = '';
      if (!snapshot.exists()) {
        taskListDiv.innerHTML = '<p>Nenhuma tarefa agendada.</p>';
        return;
      }

      const tasks = [];
      snapshot.forEach(child => {
        tasks.push({ id: child.key, ...child.val() });
      });

      const sortedTasks = tasks.sort((a, b) => new Date(`${a.orderDate}T${a.deliveryTime}`) - new Date(`${b.orderDate}T${b.deliveryTime}`));

      sortedTasks.forEach(task => {
        const taskEl = document.createElement('div');
        taskEl.classList.add('task-item');
        taskEl.innerHTML = `
          <h3>${task.orderName}</h3>
          <p><strong>Cliente:</strong> ${task.clientName} (${task.clientWhatsapp})</p>
          <p><strong>Entrega:</strong> ${task.orderDate} às ${task.deliveryTime}</p>
          <p><strong>Lembrete:</strong> ${task.reminderTime}</p>
          <p><strong>Recheios:</strong> ${task.cakeFillings || 'N/A'}</p>
          <p><strong>Docinho:</strong> ${task.sweets || 'N/A'}</p>
          ${task.moreSweets === 'sim' ? `<p><strong>Extras:</strong> ${task.whichSweets} (Qtd: ${task.sweetsQuantity})</p>` : ''}
          <button data-id="${task.id}" class="delete-btn">Excluir</button>
        `;
        taskListDiv.appendChild(taskEl);
      });

      document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', (e) => {
          const id = e.target.dataset.id;
          remove(ref(db, `agendamentos/${id}`));
        });
      });
    });
  }

  function showNotification(task) {
    if (Notification.permission === 'granted') {
      new Notification('Lembrete de Encomenda!', {
        body: `Pedido: ${task.orderName}\nCliente: ${task.clientName}\nEntrega hoje às ${task.deliveryTime}.`,
        icon: 'logo.png'
      });
    }
  }

  function checkReminders() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const agendamentosRef = ref(db, 'agendamentos');
    onValue(agendamentosRef, snapshot => {
      snapshot.forEach(child => {
        const task = child.val();
        const taskId = child.key;

        const [reminderHour, reminderMinute] = task.reminderTime.split(':').map(Number);
        const reminderMinutes = reminderHour * 60 + reminderMinute;
        const diff = Math.abs(currentMinutes - reminderMinutes);

        if (
          task.orderDate === today &&
          diff <= 1 &&
          !task.reminded
        ) {
          showNotification(task);
          const taskRef = ref(db, `agendamentos/${taskId}`);
          set(taskRef, { ...task, reminded: true });
        }
      });
    });
  }

  setInterval(checkReminders, 1000); // verifica a cada 1 segundo
});
