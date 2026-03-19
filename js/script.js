// ---------- Configurações ----------
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
  return "b_" + Date.now();
}

function formatCurrency(value) {
  return "R$ " + value.toFixed(2).replace(".", ",");
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

// ---------- Logout (CORRETO) ----------
if (logoutBtn) {
  logoutBtn.addEventListener("click", function () {
    localStorage.removeItem(SESSION_KEY);
    window.location.href = "login.html";
  });
}

// ---------- Render ----------
function renderTable(list = budgets) {
  tbody.innerHTML = "";

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8">Nenhum orçamento cadastrado.</td></tr>`;
    return;
  }

  list.forEach(item => {
    const tr = document.createElement("tr");
    const total = item.quantity * item.unitPrice;

    tr.innerHTML = `
      <td>${item.title}</td>
      <td>${item.supplier}</td>
      <td>${item.category}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(item.unitPrice)}</td>
      <td>${formatCurrency(total)}</td>
      <td>${item.date}</td>
      <td>
        <button onclick="edit('${item.id}')">Editar</button>
        <button onclick="removeItem('${item.id}')">Excluir</button>
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

function removeItem(id) {
  budgets = budgets.filter(b => b.id !== id);
  saveBudgets();
  renderTable();
}

function edit(id) {
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

// ---------- Form ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = {
    title: titleEl.value,
    supplier: supplierEl.value,
    category: categoryEl.value,
    quantity: Number(quantityEl.value),
    unitPrice: Number(unitPriceEl.value),
    date: dateEl.value,
    notes: notesEl.value
  };

  if (inputId.value) {
    budgets = budgets.map(b => b.id === inputId.value ? { ...b, ...data } : b);
  } else {
    addBudget(data);
  }

  form.reset();
  inputId.value = "";
  saveBudgets();
  renderTable();
});

// ---------- Busca ----------
if (q) {
  q.addEventListener("input", () => {
    const term = q.value.toLowerCase();
    const filtered = budgets.filter(b =>
      b.title.toLowerCase().includes(term) ||
      b.supplier.toLowerCase().includes(term)
    );
    renderTable(filtered);
  });
}

// ---------- Export ----------
btnExport && btnExport.addEventListener("click", () => {
  const data = JSON.stringify(budgets);
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
  const reader = new FileReader();

  reader.onload = (ev) => {
    budgets = JSON.parse(ev.target.result);
    saveBudgets();
    renderTable();
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

// ---------- Inicialização ----------
(function init() {
  ensureAuthenticated();
  loadBudgets();
  renderTable();
})();

