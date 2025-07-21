// === Variabel ===
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let historyLog = JSON.parse(localStorage.getItem("historyLog")) || [];
let currentFilter = "all";

// === Fungsi Tambah Tugas ===
function addTask(text, deadline) {
  const task = {
    id: Date.now(),
    text,
    deadline,
    completed: false,
  };
  tasks.push(task);
  saveTasks();
  addHistory(`Menambahkan tugas: ${text}`);
  scheduleNotification(task);
  renderTasks();
}

// === Fungsi Edit Tugas ===
function editTask(id, newText) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    addHistory(`Mengedit tugas: ${task.text} → ${newText}`);
    task.text = newText;
    saveTasks();
    renderTasks();
  }
}

// === Fungsi Hapus Tugas ===
function deleteTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    addHistory(`Menghapus tugas: ${task.text}`);
  }
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  renderTasks();
}

// === Tandai Selesai ===
function toggleComplete(id) {
  const task = tasks.find((t) => t.id === id);
  if (task) {
    task.completed = !task.completed;
    addHistory(
      `${task.completed ? "Menyelesaikan" : "Membatalkan"} tugas: ${task.text}`
    );
    saveTasks();
    renderTasks();
  }
}

// === Simpan & Ambil ===
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// === Render Semua Tugas ===
function renderTasks() {
  const list = document.getElementById("task-list");
  list.innerHTML = "";

  const filtered = tasks.filter((t) => {
    if (currentFilter === "active") return !t.completed;
    if (currentFilter === "completed") return t.completed;
    return true;
  });

  filtered.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item";

    const taskLeft = document.createElement("div");
    taskLeft.className = "task-left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleComplete(task.id));

    const textWrap = document.createElement("div");
    textWrap.className = "task-text" + (task.completed ? " completed" : "");

    const strong = document.createElement("strong");
    strong.textContent = task.text;

    const small = document.createElement("small");
    small.textContent = task.deadline
      ? "Deadline: " + new Date(task.deadline).toLocaleString()
      : "";

    textWrap.appendChild(strong);
    textWrap.appendChild(small);

    taskLeft.appendChild(checkbox);
    taskLeft.appendChild(textWrap);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.innerHTML = "✏️";
    editBtn.className = "icon-btn";
    editBtn.onclick = () => {
      const newText = prompt("Edit tugas:", task.text);
      if (newText) editTask(task.id, newText);
    };

    const delBtn = document.createElement("button");
    delBtn.innerHTML = "❌";
    delBtn.className = "icon-btn";
    delBtn.onclick = () => deleteTask(task.id);

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(taskLeft);
    li.appendChild(actions);

    list.appendChild(li);
  });
}

// === Tombol Filter ===
document.querySelectorAll(".filters button").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".filters button")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

// === Tombol Add ===
document.getElementById("task-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const text = document.getElementById("task-input").value.trim();
  const deadline = document.getElementById("task-date").value;
  if (text) {
    addTask(text, deadline);
    document.getElementById("task-form").reset();
  }
});

// === Clear All ===
document.getElementById("clear-all").addEventListener("click", () => {
  if (confirm("Hapus semua tugas?")) {
    addHistory("Menghapus semua tugas");
    tasks = [];
    saveTasks();
    renderTasks();
  }
});

// === Dark Mode ===
const toggleBtn = document.getElementById("toggle-dark");
const icon = document.getElementById("dark-icon");

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  icon.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

// === History: Tambah + Render + Cleanup > 30 hari ===
function addHistory(action) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString();

  historyLog.unshift({
    time: now.toISOString(),
    text: `[${timeStr}] ${action}`,
  });

  historyLog = historyLog.slice(0, 50);
  localStorage.setItem("historyLog", JSON.stringify(historyLog));
  renderHistory();
}

function renderHistory() {
  const historyList = document.getElementById("history-list");
  if (!historyList) return;

  const now = new Date();
  const oneMonthMs = 30 * 24 * 60 * 60 * 1000;

  historyLog = historyLog.filter((entry) => {
    const logTime = new Date(entry.time).getTime();
    return now.getTime() - logTime < oneMonthMs;
  });

  localStorage.setItem("historyLog", JSON.stringify(historyLog));

  historyList.innerHTML = "";
  historyLog.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = entry.text;
    historyList.appendChild(li);
  });
}

// === Notifikasi Reminder ===
function scheduleNotification(task) {
  if (!("Notification" in window)) return;

  const deadline = new Date(task.deadline).getTime();
  const now = Date.now();
  const reminderTime = deadline - now - 10 * 60 * 1000; // 5 menit sebelum

  if (reminderTime > 0) {
    setTimeout(() => {
      if (Notification.permission === "granted" && !task.completed) {
        new Notification("⏰ Pengingat Tugas", {
          body: `Segera selesaikan: ${task.text}`,
        });
      }
    }, reminderTime);
  }
}

// === Tombol Tes Notifikasi ===
const testNotifBtn = document.getElementById("test-notif");
if (testNotifBtn) {
  testNotifBtn.addEventListener("click", () => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification("🔔 Tes Notifikasi", {
          body: "Ini adalah contoh notifikasi berhasil!",
        });
      } else {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("🔔 Tes Notifikasi", {
              body: "Izin diberikan dan notifikasi berhasil!",
            });
          } else {
            alert("Kamu harus mengizinkan notifikasi dulu.");
          }
        });
      }
    } else {
      alert("Browser kamu tidak mendukung notifikasi.");
    }
  });
}

// === Saat Halaman Dimuat ===
document.addEventListener("DOMContentLoaded", () => {
  renderTasks();
  renderHistory();

  // Ajukan izin notifikasi jika belum
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
});
