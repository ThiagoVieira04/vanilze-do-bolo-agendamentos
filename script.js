document.addEventListener('DOMContentLoaded', () => {
    const screens = {
        home: document.getElementById('home-screen'),
        form: document.getElementById('form-screen'),
        tasks: document.getElementById('tasks-screen'),
    };

    const buttons = {
        goToForm: document.getElementById('goToFormBtn'),
        goToTasks: document.getElementById('goToTasksBtn'),
        backToHomeFromForm: document.getElementById('backToHomeFromFormBtn'),
        backToHomeFromTasks: document.getElementById('backToHomeFromTasksBtn'),
    };

    const taskForm = document.getElementById('task-form');
    const taskListDiv = document.getElementById('task-list');
    const moreSweetsRadios = document.querySelectorAll('input[name="more-sweets"]');
    const extraSweetsFields = document.getElementById('extra-sweets-fields');

    let tasks = [];
    let audioContext;
    let audioBuffer;

    // ===== Registrar Service Worker =====
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker registrado', reg))
            .catch(err => console.error('Erro ao registrar SW', err));
    }

    // ===== Áudio =====
    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            fetch('/beep.mp3')
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
                .then(decodedData => { audioBuffer = decodedData; })
                .catch(error => console.error('Erro ao carregar o som:', error));
        }
    }
    
    function playSound() {
        if (!audioContext || !audioBuffer) return;
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start(0);
    }

    // ===== Navegação =====
    function showScreen(screenName) {
        initAudio(); 
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
    }

    buttons.goToForm.addEventListener('click', () => showScreen('form'));
    buttons.goToTasks.addEventListener('click', async () => {
        await loadTasksFromServer();
        renderTasks();
        showScreen('tasks');
    });
    buttons.backToHomeFromForm.addEventListener('click', () => showScreen('home'));
    buttons.backToHomeFromTasks.addEventListener('click', () => showScreen('home'));

    // ===== Formulário =====
    moreSweetsRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            extraSweetsFields.classList.toggle('hidden', e.target.value !== 'sim');
        });
    });

    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const moreSweetsValue = document.querySelector('input[name="more-sweets"]:checked').value;
        const task = {
            id: Date.now(),
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

        await saveTaskToServer(task);
        taskForm.reset();
        extraSweetsFields.classList.add('hidden');
        alert('Tarefa agendada com sucesso!');
        showScreen('home');
    });

    // ===== Integração com o servidor =====
    async function loadTasksFromServer() {
        try {
            const res = await fetch('/tasks');
            tasks = await res.json();
        } catch (err) {
            console.error('Erro ao carregar tarefas:', err);
        }
    }

    async function saveTaskToServer(task) {
        try {
            const res = await fetch('/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task)
            });
            if (!res.ok) throw new Error('Erro ao salvar tarefa');
        } catch (err) {
            console.error(err);
        }
    }

    async function deleteTaskFromServer(id) {
        try {
            const res = await fetch(`/tasks/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Erro ao excluir tarefa');
        } catch (err) {
            console.error(err);
        }
    }

    // ===== Renderização =====
    function renderTasks() {
        taskListDiv.innerHTML = '';
        if (tasks.length === 0) {
            taskListDiv.innerHTML = '<p>Nenhuma tarefa agendada.</p>';
            return;
        }
        
        const sortedTasks = tasks.sort((a, b) => new Date(`${a.orderDate}T${a.deliveryTime}`) - new Date(`${b.orderDate}T${b.deliveryTime}`));

        sortedTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.classList.add('task-item');
            taskEl.innerHTML = `
                <h3>${task.orderName}</h3>
                <p><strong>Cliente:</strong> ${task.clientName} (${task.clientWhatsapp})</p>
                <p><strong>Data Entrega:</strong> ${new Date(task.orderDate + 'T00:00:00').toLocaleDateString()} às ${task.deliveryTime}</p>
                <p><strong>Lembrete:</strong> ${new Date(task.orderDate + 'T00:00:00').toLocaleDateString()} às ${task.reminderTime}</p>
                <p><strong>Recheios:</strong> ${task.cakeFillings || 'N/A'}</p>
                <p><strong>Docinho:</strong> ${task.sweets || 'N/A'}</p>
                ${task.moreSweets === 'sim' ? `<p><strong>Docinhos Extra:</strong> ${task.whichSweets} (Qtd: ${task.sweetsQuantity})</p>` : ''}
                <button data-id="${task.id}" class="delete-btn">Excluir</button>
            `;
            taskListDiv.appendChild(taskEl);
        });

        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const id = parseInt(e.target.dataset.id, 10);
                await deleteTaskFromServer(id);
                await loadTasksFromServer();
                renderTasks();
            });
        });
    }

    // ===== Notificações =====
    function requestNotificationPermission() {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }

    // ===== Lógica de lembrete com SW =====
    function checkReminders() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        tasks.forEach(task => {
            const [h, m] = task.reminderTime.split(':').map(Number);
            const taskMinutes = h * 60 + m;

            if (task.orderDate === today && currentMinutes >= taskMinutes && !task.reminded) {
                playSound(); // toca se a aba estiver ativa
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({
                        type: 'SHOW_REMINDER',
                        task
                    });
                }
                task.reminded = true;
                saveTaskToServer(task);
            }
        });
    }
    
    // ===== Inicialização =====
    requestNotificationPermission();
    setInterval(checkReminders, 5000); // verifica a cada 5 segundos
});
