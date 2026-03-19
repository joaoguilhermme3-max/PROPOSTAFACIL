const STORAGE_KEY = "budgets";
const SESSION_KEY = "proposta_session";

// ---------- Seletores ----------
const form = document.getElementById("form");
const inputId = document.getElementById("id");
const titleEl = document.getElementById("title");
const supplierEl = document.getElementById("supplier");
const categoryEl = document.getElementById("category");
const quantityEl = document.getElementById("quantity");
const unitPriceEl = document.getElementById("unitPrice");
const dateEl = document.getElementById("date");
const notesEl = document.getElementById("notes");

const tbody = document.getElementById("tbody");
const q = document.getElementById("q");

const btnImport = document.getElementById("btnImport");
const btnExport = document.getElementById("btnExport");
const btnClear = document.getElementById("btnClear");
const fileInput = document.getElementById("fileInput");
const logoutBtn = document.getElementById("logout");

// ---------- Estado ----------
let budgets = [];

// ---------- Utilitários ----------
function generateId() {
  return "b_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
}

function formatCurrency(value) {
  return "R$ " + Number(value).toFixed(2).replace(".", ",");
}

function saveBudgets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(budgets));
}

function loadBudgets() {
  const raw = localStorage.getItem(STORAGE_KEY);
  budgets = raw ? JSON.parse(raw) : [];
}

// ---------- Sessão ----------
function ensureAuthenticated() {
  if (!localStorage.getItem(SESSION_KEY)) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

// ---------- Segurança ----------
function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- Render ----------
function renderTable(list = budgets) {
  tbody.innerHTML = "";

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8">Nenhum orçamento cadastrado.</td></tr>`;
    return;
  }

  list.forEach(item => {
    const total = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.supplier)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.unitPrice)}</td>
      <td>${formatCurrency(total)}</td>
      <td>${escapeHtml(item.date)}</td>
      <td>
        <button data-action="edit" data-id="${item.id}">Editar</button>
        <button data-action="delete" data-id="${item.id}">Excluir</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

// ---------- CRUD ----------
function addBudget(data) {
  budgets.push({
    id: generateId(),
    ...data
  });
  saveBudgets();
  renderTable();
}

function updateBudget(id, data) {
  const index = budgets.findIndex(b => b.id === id);
  if (index === -1) return;

  budgets[index] = { ...budgets[index], ...data };
  saveBudgets();
  renderTable();
}

function removeBudget(id) {
  budgets = budgets.filter(b => b.id !== id);
  saveBudgets();
  renderTable();
}

// ---------- Form ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = {
    title: titleEl.value.trim(),
    supplier: supplierEl.value.trim(),
    category: categoryEl.value,
    quantity: Number(quantityEl.value),
    unitPrice: Number(unitPriceEl.value),
    date: dateEl.value,
    notes: notesEl.value.trim()
  };

  if (!data.title || !data.supplier || !data.category) {
    alert("Preencha os campos obrigatórios.");
    return;
  }

  if (inputId.value) {
    updateBudget(inputId.value, data);
  } else {
    addBudget(data);
  }

  form.reset();
  inputId.value = "";
});

// ---------- Ações da tabela ----------
tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === "delete") {
    if (confirm("Deseja excluir?")) {
      removeBudget(id);
    }
  }

  if (action === "edit") {
    const item = budgets.find(b => b.id === id);
    if (!item) return;

    inputId.value = item.id;
    titleEl.value = item.title;
    supplierEl.value = item.supplier;
    categoryEl.value = item.category;
    quantityEl.value = item.quantity;
    unitPriceEl.value = item.unitPrice;
    dateEl.value = item.date;
    notesEl.value = item.notes;
  }
});

// ---------- Busca ----------
if (q) {
  q.addEventListener("input", () => {
    const term = q.value.toLowerCase();

    const filtered = budgets.filter(b =>
      (b.title || "").toLowerCase().includes(term) ||
      (b.supplier || "").toLowerCase().includes(term) ||
      (b.category || "").toLowerCase().includes(term)
    );

    renderTable(filtered);
  });
}

// ---------- Export ----------
btnExport && btnExport.addEventListener("click", () => {
  const data = JSON.stringify(budgets, null, 2);
  const blob = new Blob([data], { type: "application/json" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "orcamentos.json";
  a.click();
});

// ---------- Import ----------
btnImport && btnImport.addEventListener("click", () => fileInput.click());

fileInput && fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!Array.isArray(data)) throw new Error("Formato inválido");

      budgets = data;
      saveBudgets();
      renderTable();
      alert("Importado com sucesso!");
    } catch {
      alert("Erro ao importar JSON");
    }
  };

  reader.readAsText(file);
});

// ---------- Limpar ----------
btnClear && btnClear.addEventListener("click", () => {
  if (confirm("Deseja apagar tudo?")) {
    budgets = [];
    saveBudgets();
    renderTable();
  }
});

// ---------- Logout ----------
logoutBtn && logoutBtn.addEventListener("click", logout);

// ---------- Init ----------
(function init() {
  ensureAuthenticated();
  loadBudgets();
  renderTable();
})();
