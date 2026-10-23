const form = document.getElementById("product-form");
const liveResult = document.getElementById("live-result");
const tableBody = document.getElementById("product-table-body");
const searchInput = document.getElementById("product-search");
const totalProducts = document.getElementById("total-products");
const totalCostValue = document.getElementById("total-cost-value");
const totalProfitValue = document.getElementById("total-profit-value");
const averageRoi = document.getElementById("average-roi");
const totalCostDisplay = document.getElementById("total-cost-display");

const nameInput = document.getElementById("item-name");
const typeInput = document.getElementById("item-type");
const priceInput = document.getElementById("price-per-pack");
const packsInput = document.getElementById("number-of-packs");
const itemsInput = document.getElementById("items-per-pack");
const markupInput = document.getElementById("markup");

let products = [];

try {
  products = JSON.parse(localStorage.getItem("products")) || [];
} catch {
  products = [];
}

const money = value => "₱" + Number(value).toFixed(2);

function saveProducts() {
  localStorage.setItem("products", JSON.stringify(products));
}

function calculate(data) {
  const totalCost = data.pricePerPack * data.numberOfPacks;
  const totalItems = data.numberOfPacks * data.itemsPerPack;
  const costPerItem = totalCost / totalItems;
  const sellingPrice = Math.ceil(costPerItem * (1 + data.markup / 100));
  const profitPerItem = sellingPrice - costPerItem;
  const totalProfit = profitPerItem * totalItems;

  return {
    ...data,
    totalCost,
    totalItems,
    costPerItem,
    sellingPrice,
    profitPerItem,
    totalProfit,
    roi: totalProfit / totalCost * 100
  };
}

function render() {
  const query = searchInput.value.trim().toLowerCase();

  const matches = products
    .map((product, index) => ({ product, index }))
    .filter(({ product }) =>
      `${product.name} ${product.type}`.toLowerCase().includes(query)
    );

  tableBody.innerHTML = "";

  if (!matches.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="11" class="empty-message">
          ${products.length ? "No matching products found." : "No products saved yet."}
        </td>
      </tr>`;
  }

  matches.forEach(({ product: p, index }) => {
    const row = document.createElement("tr");

    [
      p.name,
      p.type,
      p.numberOfPacks,
      p.totalItems,
      money(p.totalCost),
      money(p.costPerItem),
      money(p.sellingPrice),
      money(p.profitPerItem),
      money(p.totalProfit),
      `${Number(p.roi).toFixed(2)}%`
    ].forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    const action = document.createElement("td");
    const button = document.createElement("button");

    button.className = "delete-btn";
    button.textContent = "Delete";
    button.dataset.index = index;

    action.appendChild(button);
    row.appendChild(action);
    tableBody.appendChild(row);
  });

  const cost = products.reduce((sum, p) => sum + Number(p.totalCost), 0);
  const profit = products.reduce((sum, p) => sum + Number(p.totalProfit), 0);
  const roi = products.length
    ? products.reduce((sum, p) => sum + Number(p.roi), 0) / products.length
    : 0;

  totalProducts.textContent = products.length;
  totalCostValue.textContent = money(cost);
  totalProfitValue.textContent = money(profit);
  averageRoi.textContent = roi.toFixed(2) + "%";
}

function updatePreview() {
  const price = Number(priceInput.value);
  const packs = Number(packsInput.value);
  const items = Number(itemsInput.value);
  const markup = Number(markupInput.value);

  totalCostDisplay.textContent = money(price * packs);

  if (
    !nameInput.value.trim() ||
    price <= 0 ||
    packs <= 0 ||
    items <= 0 ||
    markup < 10 ||
    markup > 100
  ) {
    liveResult.classList.add("hidden");
    return;
  }

  const product = calculate({
    name: nameInput.value.trim(),
    type: typeInput.value,
    pricePerPack: price,
    numberOfPacks: packs,
    itemsPerPack: items,
    markup
  });

  liveResult.classList.remove("hidden");
  liveResult.innerHTML = `
    <h3>Automatic Calculation</h3>
    <p><strong>Item:</strong> ${escapeText(product.name)}</p>
    <p><strong>Total items:</strong> ${product.totalItems}</p>
    <p><strong>Total purchase price:</strong> ${money(product.totalCost)}</p>
    <p><strong>Cost per item:</strong> ${money(product.costPerItem)}</p>
    <p><strong>Selling price per item:</strong> ${money(product.sellingPrice)}</p>
    <p><strong>Expected total profit:</strong> ${money(product.totalProfit)}</p>
    <p><strong>ROI:</strong> ${product.roi.toFixed(2)}%</p>`;
}

function escapeText(text) {
  const element = document.createElement("span");
  element.textContent = text;
  return element.innerHTML;
}

[nameInput, priceInput, packsInput, itemsInput, markupInput, typeInput]
  .forEach(input => input.addEventListener("input", updatePreview));

form.addEventListener("submit", event => {
  event.preventDefault();

  const markup = Number(markupInput.value);

  if (markup < 10 || markup > 100) {
    alert("Markup must be between 10% and 100%.");
    return;
  }

  products.push(calculate({
    name: nameInput.value.trim(),
    type: typeInput.value,
    pricePerPack: Number(priceInput.value),
    numberOfPacks: Number(packsInput.value),
    itemsPerPack: Number(itemsInput.value),
    markup
  }));

  saveProducts();
  render();
  form.reset();

  markupInput.value = 10;
  totalCostDisplay.textContent = money(0);
  liveResult.classList.add("hidden");
});

searchInput.addEventListener("input", render);

tableBody.addEventListener("click", event => {
  if (!event.target.matches(".delete-btn")) return;

  products.splice(Number(event.target.dataset.index), 1);
  saveProducts();
  render();
});

render();