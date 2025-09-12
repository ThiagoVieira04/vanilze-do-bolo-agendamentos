const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Ler tarefas
app.get('/tasks', (req, res) => {
  const data = fs.readFileSync(path.join(__dirname, 'banco.json'));
  res.json(JSON.parse(data));
});

// Salvar nova tarefa
app.post('/tasks', (req, res) => {
  const tasks = JSON.parse(fs.readFileSync('banco.json'));
  tasks.push(req.body);
  fs.writeFileSync('banco.json', JSON.stringify(tasks, null, 2));
  res.json({ status: 'ok' });
});

// Excluir tarefa
app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  let tasks = JSON.parse(fs.readFileSync('banco.json'));
  tasks = tasks.filter(task => task.id !== id);
  fs.writeFileSync('banco.json', JSON.stringify(tasks, null, 2));
  res.json({ status: 'deleted' });
});

app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));
