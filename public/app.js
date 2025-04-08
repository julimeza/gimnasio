const API_URL = "http://localhost:3000/api/routines";
const exerciseForm = document.getElementById("exerciseForm");
const exerciseNameInput = document.getElementById("exerciseName");
const exerciseList = document.getElementById("exerciseList");
document.querySelectorAll('.btn-day').forEach(btn => {
  btn.addEventListener('click', () => {
    // Eliminar clases activas de todos los botones
    document.querySelectorAll('.btn-day').forEach(b => b.classList.remove('active', 'vibrate'));

    // Activar el clickeado
    btn.classList.add('active', 'vibrate');
    setTimeout(() => btn.classList.remove('vibrate'), 300);

    // Renderizar los ejercicios del nuevo día seleccionado
    renderExercises();
  });
});
const defaultDayBtn = document.querySelector('.btn-day[data-day="Lunes"]');
if (defaultDayBtn) {
  defaultDayBtn.classList.add('active');
}
window.addEventListener("DOMContentLoaded", renderExercises);
function getSelectedDay() {
  const activeBtn = document.querySelector('.btn-day.active');
  return activeBtn ? activeBtn.dataset.day : "Lunes"; // Fallback por si no hay ninguno seleccionado
}
const decorativeColors = [
  "#FF6B6B", "#4ECDC4", "#FFD93D", "#A29BFE",
  "#FF9F1C", "#6A4C93", "#00A896", "#F67280"
];
function renderExercises() {
  const day = getSelectedDay();
  const title = document.getElementById("routineTitle");
  if (title) {
    title.classList.remove("show"); // Oculta
    title.innerText = `📋 Rutina del ${day}`;
    void title.offsetWidth; // Truco para reiniciar animación
    title.classList.add("show"); // Muestra con fade
  }
  
  fetch(`${API_URL}/${day}`)
    .then(res => res.json())
    .then(exercises => {
      exerciseList.innerHTML = "";

      exercises.forEach((ex, index) => {
        const color = decorativeColors[index % decorativeColors.length];

        const div = document.createElement("div");
        div.className = "exercise-item d-flex align-items-start gap-3 mb-4";

        div.innerHTML = `
          <div class="circle-icon mt-1" style="background-color: ${color};"></div>
          <div class="flex-grow-1">
            <strong><i class="fas fa-dumbbell me-2 text-primary"></i>${ex.name}</strong>
            <button class="btn btn-sm btn-outline-secondary me-2" onclick="toggleLogs(${ex.id})">
              <i class="fas fa-clock me-1"></i> Ver historial
            </button>
            <div id="logs-${ex.id}" style="display:none;"></div>
            <form onsubmit="addLog(event, ${ex.id})" class="row g-2 mt-2">
              <div class="col-md-3"><input type="date" name="date" class="form-control" required /></div>
              <div class="col-md-2"><input type="number" name="sets" placeholder="Series" class="form-control" required /></div>
              <div class="col-md-2"><input type="number" name="reps" placeholder="Reps" class="form-control" required /></div>
              <div class="col-md-3"><input type="number" name="weight" placeholder="Peso (kg)" step="0.5" class="form-control" required /></div>
              <div class="col-md-2"><button type="submit" class="btn btn-success w-100"><i class="fas fa-plus"></i></button></div>
            </form>
          <div class="d-flex align-items-center gap-2 mt-2">
  <button class="btn btn-sm btn-outline-warning" onclick="editExercise(${ex.id}, '${ex.name}')">
    <i class="fas fa-pen"></i>
  </button>
  <button class="btn btn-sm btn-outline-danger" onclick="deleteExercise(${ex.id})">
    <i class="fas fa-trash-alt"></i>
  </button>
</div>
            <div id="chart-container-${ex.id}" style="display:none; margin-top:1rem;"></div>
          </div>
        `;
        exerciseList.appendChild(div);
      });
    })
    .catch(err => console.error("Error al obtener ejercicios:", err));
}
exerciseForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = exerciseNameInput.value.trim();
  const day = getSelectedDay();

  if (!name) return;

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, day }),
  })
    .then(() => {
      exerciseForm.reset();
      renderExercises();
    })
    .catch(err => console.error("Error al agregar ejercicio:", err));
});
function deleteExercise(id) {
  if (!confirm("¿Seguro que querés eliminar este ejercicio y su historial?")) return;

  fetch(`${API_URL}/${id}`, { method: "DELETE" })
    .then(() => renderExercises())
    .catch(err => console.error("Error al eliminar ejercicio:", err));
}
let exerciseCharts = {};
function toggleLogs(exerciseId) {
  const currentLogs = document.getElementById(`logs-${exerciseId}`);
  const currentChart = document.getElementById(`chart-container-${exerciseId}`);
  document.querySelectorAll('[id^="logs-"]').forEach(div => {
    if (div.id !== `logs-${exerciseId}`) div.style.display = 'none';
  });
  document.querySelectorAll('[id^="chart-container-"]').forEach(div => {
    if (div.id !== `chart-container-${exerciseId}`) div.style.display = 'none';
  });
  if (currentLogs.style.display === 'block') {
    currentLogs.style.display = 'none';
    if (currentChart) currentChart.style.display = 'none';
    return;
  }
  fetch(`${API_URL}/logs/${exerciseId}`)
    .then(res => res.json())
    .then(logs => {
      currentLogs.style.display = 'block';
      if (currentChart) currentChart.style.display = 'block';

      const sortedLogs = logs.sort((a, b) => new Date(a.date) - new Date(b.date));
      currentLogs.innerHTML = sortedLogs.length
        ? sortedLogs.map(log => `
          <div id="log-${log.id}" class="d-flex justify-content-between align-items-center mb-2">
            <div>
              <span id="log-text-${log.id}">
                📅 ${formatDate(log.date)} - 🔁 ${log.sets} x ${log.reps} con ${log.weight} kg
              </span>
              <form id="log-form-${log.id}" class="row g-2 d-none" onsubmit="saveLogEdit(event, ${log.id})">
                <div class="col-3"><input type="date" name="date" class="form-control" value="${log.date.split('T')[0]}" required /></div>
                <div class="col-2"><input type="number" name="sets" class="form-control" value="${log.sets}" required /></div>
                <div class="col-2"><input type="number" name="reps" class="form-control" value="${log.reps}" required /></div>
                <div class="col-3"><input type="number" name="weight" step="0.5" class="form-control" value="${log.weight}" required /></div>
                <div class="col-2 d-flex gap-1">
                  <button type="submit" class="btn btn-success btn-sm"><i class="fas fa-check"></i></button>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="cancelLogEdit(${log.id})"><i class="fas fa-times"></i></button>
                </div>
              </form>
            </div>
            <div class="d-flex align-items-center">
              <button class="btn btn-sm btn-outline-warning me-2" onclick="enableLogEdit(${log.id})"><i class="fas fa-pen"></i></button>
              <button class="btn btn-sm btn-outline-danger" onclick="deleteLog(${log.id}, ${exerciseId})"><i class="fas fa-trash-alt"></i></button>
            </div>
          </div>
        `).join('')
        : 'Sin registros aún.';

      renderChartDropdown(exerciseId, sortedLogs);
      renderChart(exerciseId, sortedLogs, 'weight');
    });
}
function renderChartDropdown(exerciseId, logs) {
  const chartContainer = document.getElementById(`chart-container-${exerciseId}`);
  chartContainer.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-2">
      <label for="metric-${exerciseId}" class="form-label me-2">Ver evolución de:</label>
      <select id="metric-${exerciseId}" class="form-select form-select-sm w-auto" onchange="updateChartMetric(${exerciseId}, ${JSON.stringify(logs).replace(/"/g, '&quot;')})">
        <option value="weight">Peso (kg)</option>
        <option value="reps">Repeticiones</option>
        <option value="sets">Series</option>
      </select>
    </div>
    <canvas id="chart-${exerciseId}" height="100"></canvas>
  `;
}
function updateChartMetric(exerciseId, logs) {
  const metric = document.getElementById(`metric-${exerciseId}`).value;
  renderChart(exerciseId, logs, metric);
}
function renderChart(exerciseId, logs, metric = 'weight') {
  const ctx = document.getElementById(`chart-${exerciseId}`).getContext('2d');
  const sorted = logs.sort((a, b) => new Date(a.date) - new Date(b.date));

  const labels = sorted.map(log => formatDate(log.date));
  const data = sorted.map(log => log[metric]);

  const colors = {
    weight: 'rgb(75, 192, 192)',
    reps: 'rgb(255, 159, 64)',
    sets: 'rgb(153, 102, 255)'
  };

  // Destruir el gráfico anterior si existe
  if (exerciseCharts[exerciseId]) {
    exerciseCharts[exerciseId].destroy();
  }

  exerciseCharts[exerciseId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: metric.charAt(0).toUpperCase() + metric.slice(1),
        data,
        fill: false,
        borderColor: colors[metric],
        tension: 0.3,
        pointBackgroundColor: colors[metric]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: `Evolución de ${metric}`
        },
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Fecha' }
        },
        y: {
          title: { display: true, text: metric === 'weight' ? 'Peso (kg)' : metric === 'reps' ? 'Repeticiones' : 'Series' }
        }
      }
    }
  });
}
function formatDate(isoDate) {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Mes empieza en 0
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
function addLog(event, exerciseId) {
  event.preventDefault();
  const form = event.target;
  const date = form.date.value;
  const sets = form.sets.value;
  const reps = form.reps.value;
  const weight = form.weight.value;

  fetch(`${API_URL}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ exercise_id: exerciseId, date, sets, reps, weight })
  })
    .then(() => {
      form.reset();
      toggleLogs(exerciseId); // Oculta
      toggleLogs(exerciseId); // Vuelve a mostrar actualizado
    })
    .catch(err => console.error("Error al agregar registro:", err));
}
function editExercise(id, currentName) {
  const newName = prompt("Editar nombre del ejercicio:", currentName);
  if (!newName || newName.trim() === '') return;

  fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName.trim() })
  })
    .then(() => renderExercises())
    .catch(err => console.error("Error al editar ejercicio:", err));
}
function editLog(id, date, sets, reps, weight) {
  const newDate = prompt("Fecha:", date);
  const newSets = prompt("Series:", sets);
  const newReps = prompt("Reps:", reps);
  const newWeight = prompt("Peso (kg):", weight);

  if (!newDate || !newSets || !newReps || !newWeight) return;

  fetch(`${API_URL}/logs/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: newDate,
      sets: newSets,
      reps: newReps,
      weight: newWeight
    })
  })
    .then(() => {
      // Refrescar historial
      toggleLogs(id); toggleLogs(id);
    })
    .catch(err => console.error("Error al editar log:", err));
}
function enableLogEdit(logId) {
  document.getElementById(`log-text-${logId}`).classList.add("d-none");
  document.getElementById(`log-form-${logId}`).classList.remove("d-none");
}
function cancelLogEdit(logId) {
  document.getElementById(`log-text-${logId}`).classList.remove("d-none");
  document.getElementById(`log-form-${logId}`).classList.add("d-none");
}
function saveLogEdit(event, logId) {
  event.preventDefault();
  const form = document.getElementById(`log-form-${logId}`);
  const formData = new FormData(form);
  const updated = {
    date: formData.get("date"),
    sets: formData.get("sets"),
    reps: formData.get("reps"),
    weight: formData.get("weight")
  };

  fetch(`${API_URL}/logs/${logId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updated)
  })
    .then(() => {
      toggleLogs(logId); toggleLogs(logId); // Recargar historial
    })
    .catch(err => console.error("Error al editar log:", err));
}
function deleteLog(logId, exerciseId) {
  if (!confirm("¿Estás seguro de que querés eliminar este registro?")) return;

  fetch(`${API_URL}/logs/${logId}`, { method: "DELETE" })
    .then(() => {
      toggleLogs(exerciseId); toggleLogs(exerciseId); // Refrescar
    })
    .catch(err => console.error("Error al eliminar log:", err));
}
if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('✅ Service Worker registrado', reg))
    .catch(err => console.error('❌ Error registrando SW', err));
}