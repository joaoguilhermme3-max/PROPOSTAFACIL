const form = document.getElementById("form");
const tbody = document.getElementById("tbody");
let budgets = JSON.parse(localStorage.getItem("budgets")) || [];

function renderTable() {
  tbody.innerHTML = "";
  budgets.forEach((item, index) => {
    tbody.innerHTML += `
      <tr>
        <td>${item.title}</td>
        <td>${item.supplier}</td>
        <td>${item.category}</td>
        <td>${item.quantity}</td>
        <td>R$ ${item.unitPrice.toFixed(2)}</td>
        <td>R$ ${item.total.toFixed(2)}</td>
        <td>${item.date}</td>
        <td>
          <button onclick="deleteItem(${index})">Excluir</button>
        </td>
      </tr>
    `;
  });
}

form.addEventListener("submit", e => {
  e.preventDefault();

  const item = {
    title: title.value,
    supplier: supplier.value,
    category: category.value,
    quantity: Number(quantity.value),
    unitPrice: Number(unitPrice.value),
    date: date.value,
    total: quantity.value * unitPrice.value
  };

  budgets.push(item);
  localStorage.setItem("budgets", JSON.stringify(budgets));
  renderTable();
  form.reset();
});

function deleteItem(i) {
  budgets.splice(i, 1);
  localStorage.setItem("budgets", JSON.stringify(budgets));
  renderTable();
}

renderTable();
