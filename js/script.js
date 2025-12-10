/* script.js - PropostaFácil
   Funções: CRUD, sessão, import/export, contadores, busca
   Certifique-se de ter no HTML os elementos com os ids usados abaixo:
   form, id, title, supplier, category, quantity, unitPrice, date, notes,
   tbody, btnImport, btnExport, btnClear, fileInput, q, logout
*/

// ---------- Configurações e seletores ----------
const STORAGE_KEY = "budgets";
const SESSION_KEY = "proposta_session";

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

// Elementos opcionais para contadores (se existirem no HTML)
const countEl = document.getElementById("count");
const totalEl = document.getElementById("total");
const grandTotalEl = document.getElementById("grandTotal");
const itemsTotalEl = document.getElementById("itemsTotal");

// ---------- Estado ----------
let budgets = [];

// ---------- Utilitários ----------
function generateId() {
  return "b_" + Date.now() + "_" + Math.floor(Math.random() * 9999);
}

function formatCurrency(value) {
  // formata número para "R$ 1.234,56"
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
  const session = localStorage.getItem(SESSION_KEY);
  if (!session) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

// ---------- Renderização ----------
function renderTable(list = budgets) {
  tbody.innerHTML = "";

  if (!list || list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty">Nenhum orçamento cadastrado.</td></tr>`;
    updateCounters();
    return;
  }

  // cria linhas
  list.forEach((item) => {
    const tr = document.createElement("tr");
    // Use data-id para ações (mais seguro que index)
    tr.dataset.id = item.id;

    const totalItem = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

    tr.innerHTML = `
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.supplier)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td>${item.quantity}</td>
      <td>${formatCurrency(Number(item.unitPrice || 0))}</td>
      <td>${formatCurrency(totalItem)}</td>
      <td>${escapeHtml(item.date || "")}</td>
      <td>
        <button class="btn-edit" data-action="edit" data-id="${item.id}">Editar</button>
        <button class="btn-delete" data-action="delete" data-id="${item.id}">Excluir</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  updateCounters();
}

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- Contadores ----------
function updateCounters() {
  const totalValue = budgets.reduce((acc, i) => {
    const q = Number(i.quantity) || 0;
    const p = Number(i.unitPrice) || 0;
    return acc + q * p;
  }, 0);

  // Atualiza se os elementos existirem
  if (countEl) countEl.textContent = budgets.length;
  if (totalEl) totalEl.textContent = formatCurrency(totalValue);
  if (grandTotalEl) grandTotalEl.textContent = formatCurrency(totalValue);
  if (itemsTotalEl) itemsTotalEl.textContent = budgets.length;
}

// ---------- CRUD ----------
function addBudget(data) {
  const newItem = {
    id: generateId(),
    title: data.title,
    supplier: data.supplier,
    category: data.category,
    quantity: Number(data.quantity) || 0,
    unitPrice: Number(data.unitPrice) || 0,
    date: data.date,
    notes: data.notes || ""
  };
  budgets.push(newItem);
  saveBudgets();
  renderTable();
}

function updateBudget(id, data) {
  const idx = budgets.findIndex(b => b.id === id);
  if (idx === -1) return false;
  budgets[idx] = {
    ...budgets[idx],
    title: data.title,
    supplier: data.supplier,
    category: data.category,
    quantity: Number(data.quantity) || 0,
    unitPrice: Number(data.unitPrice) || 0,
    date: data.date,
    notes: data.notes || ""
  };
  saveBudgets();
  renderTable();
  return true;
}

function removeBudget(id) {
  budgets = budgets.filter(b => b.id !== id);
  saveBudgets();
  renderTable();
}

// ---------- Interações do formulário ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const payload = {
    title: titleEl.value.trim(),
    supplier: supplierEl.value.trim(),
    category: categoryEl.value,
    quantity: quantityEl.value,
    unitPrice: unitPriceEl.value,
    date: dateEl.value,
    notes: notesEl.value.trim()
  };

  // Validações básicas
  if (!payload.title || !payload.supplier || !payload.category) {
    alert("Preencha os campos obrigatórios: Título, Fornecedor e Categoria.");
    return;
  }
  if (Number(payload.quantity) <= 0 || isNaN(Number(payload.quantity))) {
    alert("Quantidade inválida. Deve ser um número maior que zero.");
    return;
  }
  if (Number(payload.unitPrice) < 0 || isNaN(Number(payload.unitPrice))) {
    alert("Preço unitário inválido.");
    return;
  }

  const editingId = inputId.value;
  if (editingId) {
    // Atualiza existente
    const ok = updateBudget(editingId, payload);
    if (!ok) alert("Não foi possível atualizar o item (ID não encontrado).");
  } else {
    // Adiciona novo
    addBudget(payload);
  }

  form.reset();
  inputId.value = "";
});

// ---------- Ações da tabela (delegation) ----------
tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (action === "delete") {
    if (confirm("Tem certeza que deseja excluir este item?")) {
      removeBudget(id);
    }
  } else if (action === "edit") {
    // preencher o formulário para edição
    const item = budgets.find(b => b.id === id);
    if (!item) { alert("Item não encontrado."); return; }
    inputId.value = item.id;
    titleEl.value = item.title;
    supplierEl.value = item.supplier;
    categoryEl.value = item.category;
    quantityEl.value = item.quantity;
    unitPriceEl.value = item.unitPrice;
    dateEl.value = item.date;
    notesEl.value = item.notes;
    // trazer foco para o título
    titleEl.focus();
    // opcional: rolar até o formulário se estiver fora da tela
    titleEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

// ---------- Busca em tempo real ----------
if (q) {
  q.addEventListener("input", () => {
    const term = q.value.trim().toLowerCase();
    if (!term) {
      renderTable(budgets);
      return;
    }
    const filtered = budgets.filter(b =>
      (b.title || "").toLowerCase().includes(term) ||
      (b.supplier || "").toLowerCase().includes(term) ||
      (b.category || "").toLowerCase().includes(term)
    );
    renderTable(filtered);
  });
}

// ---------- Import / Export ----------
btnExport && btnExport.addEventListener("click", () => {
  const data = JSON.stringify(budgets, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "orcamentos.json";
  a.click();
  URL.revokeObjectURL(url);
});

btnImport && btnImport.addEventListener("click", () => {
  fileInput && fileInput.click();
});

fileInput && fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result);
      // valida estrutura mínima
      if (!Array.isArray(parsed)) throw new Error("Arquivo inválido.");
      // assegura que cada item tenha id (se não, cria)
      const normalized = parsed.map(item => ({
        id: item.id || generateId(),
        title: item.title || "",
        supplier: item.supplier || "",
        category: item.category || "",
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        date: item.date || "",
        notes: item.notes || ""
      }));
      budgets = normalized;
      saveBudgets();
      renderTable();
      alert("Importação concluída.");
    } catch (err) {
      alert("Erro ao importar JSON: " + err.message);
    }
  };
  reader.readAsText(file);
});

// ---------- Limpar tudo ----------
btnClear && btnClear.addEventListener("click", () => {
  if (confirm("Deseja limpar todos os orçamentos? Esta ação não pode ser desfeita.")) {
    budgets = [];
    saveBudgets();
    renderTable();
  }
});

// ---------- Logout ----------
logoutBtn && logoutBtn.addEventListener("click", logout);

// ---------- Inicialização ----------
(function init() {
  // Se esta página exigir autenticação, garante que o usuário tenha sessão
  // (mantenha essa chamada caso tenha login.html redirecionando aqui)
  if (typeof ensureAuthenticated === "function") ensureAuthenticated();

  loadBudgets();
  renderTable();
})();
