// Estado de la aplicación
const state = {
  messages: [],
  activeCategory: "all",
  searchQuery: "",
};

// Elementos del DOM
const messageList = document.getElementById("messageList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const categoryFilters = document.getElementById("categoryFilters");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const messageForm = document.getElementById("messageForm");
const editIdInput = document.getElementById("editId");
const inputTitle = document.getElementById("inputTitle");
const inputCategory = document.getElementById("inputCategory");
const inputBody = document.getElementById("inputBody");
const inputProfileName = document.getElementById("inputProfileName");
const inputProfileEmail = document.getElementById("inputProfileEmail");

// ===========================
//  API
// ===========================

async function fetchMessages() {
  const res = await fetch("/messages");
  if (!res.ok) throw new Error("Error al cargar mensajes");
  return res.json();
}

async function createMessage(data) {
  const res = await fetch("/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al crear mensaje");
  }
  return res.json();
}

async function updateMessage(id, data) {
  const res = await fetch(`/messages/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al actualizar mensaje");
  }
  return res.json();
}

async function deleteMessage(id) {
  const res = await fetch(`/messages/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Error al eliminar mensaje");
}

// ===========================
//  Renderizado
// ===========================

function getFilteredMessages() {
  return state.messages.filter((msg) => {
    const matchCategory =
      state.activeCategory === "all" || msg.category === state.activeCategory;
    const q = state.searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      msg.title.toLowerCase().includes(q) ||
      msg.body.toLowerCase().includes(q) ||
      msg.category.toLowerCase().includes(q) ||
      (msg.profile?.name || "").toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });
}

function getCategories() {
  const cats = [...new Set(state.messages.map((m) => m.category))];
  return cats.sort();
}

function renderCategoryFilters() {
  const categories = getCategories();
  // Limpiar botones dinámicos (conservar el de "Todas")
  const existing = categoryFilters.querySelectorAll(
    '[data-category]:not([data-category="all"])',
  );
  existing.forEach((el) => el.remove());

  categories.forEach((cat) => {
    const btn = document.createElement("button");
    btn.className =
      "filter-btn" + (state.activeCategory === cat ? " active" : "");
    btn.dataset.category = cat;
    btn.textContent = cat;
    btn.addEventListener("click", () => setCategory(cat));
    categoryFilters.appendChild(btn);
  });

  // Actualizar estado del botón "Todas"
  const allBtn = categoryFilters.querySelector('[data-category="all"]');
  allBtn.className =
    "filter-btn" + (state.activeCategory === "all" ? " active" : "");
}

function renderMessages() {
  const filtered = getFilteredMessages();

  // Eliminar tarjetas existentes
  messageList.querySelectorAll(".message-card").forEach((el) => el.remove());

  if (filtered.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";

  filtered.forEach((msg) => {
    const card = document.createElement("div");
    card.className = "message-card";
    card.dataset.id = msg.id;

    card.innerHTML = `
      <div class="card-header">
        <span class="card-title">${escapeHtml(msg.title)}</span>
        <span class="card-category">${escapeHtml(msg.category)}</span>
      </div>
      <p class="card-body">${escapeHtml(msg.body)}</p>
      <p class="card-profile">
        Perfil: <strong>${escapeHtml(msg.profile?.name || "Sin perfil")}</strong>${msg.profile?.email ? ` · ${escapeHtml(msg.profile.email)}` : ""}
      </p>
      <div class="card-actions">
        <button class="btn btn-copy" data-action="copy">📋 Copiar</button>
        <button class="btn btn-edit" data-action="edit">✏️ Editar</button>
        <button class="btn btn-danger" data-action="delete">🗑️ Eliminar</button>
      </div>
    `;

    // Eventos de la tarjeta
    card
      .querySelector('[data-action="copy"]')
      .addEventListener("click", () => copyBody(msg.body, card));
    card
      .querySelector('[data-action="edit"]')
      .addEventListener("click", () => openEditModal(msg));
    card
      .querySelector('[data-action="delete"]')
      .addEventListener("click", () => handleDelete(msg.id));

    messageList.appendChild(card);
  });
}

function render() {
  renderCategoryFilters();
  renderMessages();
}

// ===========================
//  Acciones
// ===========================

function setCategory(cat) {
  state.activeCategory = cat;
  render();
}

async function handleDelete(id) {
  if (!confirm("¿Seguro que deseas eliminar este mensaje?")) return;
  try {
    await deleteMessage(id);
    state.messages = state.messages.filter((m) => m.id !== id);
    render();
  } catch (e) {
    alert(e.message);
  }
}

function copyBody(text, card) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      const btn = card.querySelector('[data-action="copy"]');
      btn.textContent = "✅ Copiado";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = "📋 Copiar";
        btn.classList.remove("copied");
      }, 2000);
    })
    .catch(() => {
      alert("No se pudo copiar al portapapeles.");
    });
}

// ===========================
//  Modal
// ===========================

function openNewModal() {
  modalTitle.textContent = "Nuevo mensaje";
  messageForm.reset();
  editIdInput.value = "";
  modal.classList.remove("hidden");
  inputTitle.focus();
}

function openEditModal(msg) {
  modalTitle.textContent = "Editar mensaje";
  editIdInput.value = msg.id;
  inputTitle.value = msg.title;
  inputCategory.value = msg.category;
  inputBody.value = msg.body;
  inputProfileName.value = msg.profile?.name || "";
  inputProfileEmail.value = msg.profile?.email || "";
  modal.classList.remove("hidden");
  inputTitle.focus();
}

function closeModal() {
  modal.classList.add("hidden");
  messageForm.reset();
}

// ===========================
//  Formulario
// ===========================

messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    title: inputTitle.value.trim(),
    category: inputCategory.value.trim(),
    body: inputBody.value.trim(),
    profileName: inputProfileName.value.trim(),
    profileEmail: inputProfileEmail.value.trim(),
  };

  const id = editIdInput.value;

  try {
    if (id) {
      const updated = await updateMessage(id, data);
      const idx = state.messages.findIndex((m) => m.id === id);
      if (idx !== -1) state.messages[idx] = updated;
    } else {
      const created = await createMessage(data);
      state.messages.push(created);
    }

    closeModal();
    render();
  } catch (err) {
    alert(err.message);
  }
});

// ===========================
//  Eventos globales
// ===========================

document
  .getElementById("btnNewMessage")
  .addEventListener("click", openNewModal);
document.getElementById("closeModal").addEventListener("click", closeModal);
document.getElementById("cancelBtn").addEventListener("click", closeModal);
document
  .querySelector('[data-category="all"]')
  .addEventListener("click", () => setCategory("all"));

modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

searchInput.addEventListener("input", (e) => {
  state.searchQuery = e.target.value;
  render();
});

// ===========================
//  Utilidades
// ===========================

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ===========================
//  Inicio
// ===========================

(async () => {
  try {
    state.messages = await fetchMessages();
    render();
  } catch (e) {
    messageList.innerHTML =
      '<p class="empty-state">Error al conectar con el servidor.</p>';
  }
})();
