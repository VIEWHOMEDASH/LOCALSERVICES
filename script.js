const DATA_URL = "data/transactions.csv";
let transactions = [];
let charts = {};
let renderQueued = false;

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function parseCSV(text) {
  const rows = text.trim().split(/\r?\n/).map(row => {
    const values = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      const next = row[i + 1];
      if (char === '"' && insideQuotes && next === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  });

  const headers = rows.shift();
  return rows.map(row => {
    const item = {};
    headers.forEach((header, index) => item[header] = row[index] || "");
    item.Amount = Number(String(item.Amount).replace(/[$,()]/g, match => match === "(" ? "-" : "")) || 0;
    return item;
  });
}

async function loadSampleData() {
  const response = await fetch(DATA_URL);
  const text = await response.text();
  transactions = parseCSV(text);
  populateMonthFilter();
  renderDashboard();
}

function getFilteredData() {
  const month = document.getElementById("monthFilter").value;
  const type = document.getElementById("typeFilter").value;
  const search = document.getElementById("searchBox").value.toLowerCase();

  return transactions.filter(tx => {
    const txMonth = tx.Date?.slice(0, 7);
    const matchesMonth = month === "all" || txMonth === month;
    const matchesType = type === "all" || tx.Type === type;
    const matchesSearch = !search || Object.values(tx).join(" ").toLowerCase().includes(search);
    return matchesMonth && matchesType && matchesSearch;
  });
}

function sum(data, type = null) {
  return data
    .filter(tx => !type || tx.Type === type)
    .reduce((total, tx) => total + Math.abs(tx.Amount), 0);
}

function groupByMonth(data) {
  const months = [...new Set(data.map(tx => tx.Date.slice(0, 7)))].sort();
  return months.map(month => {
    const rows = data.filter(tx => tx.Date.startsWith(month));
    return {
      month,
      income: sum(rows, "Income"),
      expenses: sum(rows, "Expense"),
      profit: sum(rows, "Income") - sum(rows, "Expense")
    };
  });
}

function groupExpensesByCategory(data) {
  const grouped = {};
  data.filter(tx => tx.Type === "Expense").forEach(tx => {
    grouped[tx.Category] = (grouped[tx.Category] || 0) + Math.abs(tx.Amount);
  });
  return Object.entries(grouped).sort((a, b) => b[1] - a[1]);
}

function populateMonthFilter() {
  const select = document.getElementById("monthFilter");
  const current = select.value;
  const months = [...new Set(transactions.map(tx => tx.Date.slice(0, 7)))].sort();
  select.innerHTML = '<option value="all">All Months</option>' + months.map(m => `<option value="${m}">${m}</option>`).join("");
  select.value = months.includes(current) ? current : "all";
}

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderDashboard();
  });
}

function getChartCanvas(id) {
  const canvas = document.getElementById(id);
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
  canvas.removeAttribute("style");
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  return canvas;
}

function renderDashboard() {
  const data = getFilteredData();
  const income = sum(data, "Income");
  const expenses = sum(data, "Expense");
  const profit = income - expenses;
  const margin = income ? (profit / income) * 100 : 0;

  document.getElementById("totalIncome").textContent = currency.format(income);
  document.getElementById("totalExpenses").textContent = currency.format(expenses);
  document.getElementById("netProfit").textContent = currency.format(profit);
  document.getElementById("profitMargin").textContent = `${margin.toFixed(1)}%`;

  renderCharts(data);
  renderTable(data);
}

function renderCharts(data) {
  Object.values(charts).forEach(chart => chart && chart.destroy());
  charts = {};
  const monthly = groupByMonth(data);
  const categories = groupExpensesByCategory(data);

  charts.incomeExpense = new Chart(getChartCanvas("incomeExpenseChart"), {
    type: "bar",
    data: {
      labels: monthly.map(item => item.month),
      datasets: [
        { label: "Income", data: monthly.map(item => item.income) },
        { label: "Expenses", data: monthly.map(item => item.expenses) }
      ]
    },
    options: { responsive: false, maintainAspectRatio: false, animation: false }
  });

  charts.category = new Chart(getChartCanvas("categoryChart"), {
    type: "doughnut",
    data: {
      labels: categories.map(item => item[0]),
      datasets: [{ label: "Expenses", data: categories.map(item => item[1]) }]
    },
    options: { responsive: false, maintainAspectRatio: false, animation: false }
  });

  charts.profit = new Chart(getChartCanvas("profitChart"), {
    type: "line",
    data: {
      labels: monthly.map(item => item.month),
      datasets: [{ label: "Net Profit", data: monthly.map(item => item.profit), tension: 0.35 }]
    },
    options: { responsive: false, maintainAspectRatio: false, animation: false }
  });
}

function renderTable(data) {
  const tbody = document.getElementById("transactionTable");
  tbody.innerHTML = data
    .sort((a, b) => new Date(b.Date) - new Date(a.Date))
    .map(tx => `
      <tr>
        <td>${tx.Date}</td>
        <td>${tx.Type}</td>
        <td>${tx.Category}</td>
        <td>${tx.VendorCustomer}</td>
        <td>${tx.Account}</td>
        <td class="amount">${currency.format(Math.abs(tx.Amount))}</td>
        <td>${tx.Notes || ""}</td>
      </tr>
    `).join("");
}

function downloadCSVTemplate() {
  const template = "Date,Type,Category,VendorCustomer,Account,Amount,Notes\n2026-01-01,Expense,Fuel,Example Vendor,Business Checking,100.00,Example note\n";
  const blob = new Blob([template], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "transactions-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

document.getElementById("monthFilter").addEventListener("change", scheduleRender);
document.getElementById("typeFilter").addEventListener("change", scheduleRender);
document.getElementById("searchBox").addEventListener("input", scheduleRender);
document.getElementById("resetData").addEventListener("click", loadSampleData);
document.getElementById("downloadTemplate").addEventListener("click", downloadCSVTemplate);

document.getElementById("csvUpload").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    transactions = parseCSV(e.target.result);
    populateMonthFilter();
    renderDashboard();
  };
  reader.readAsText(file);
});

window.addEventListener("resize", scheduleRender);

loadSampleData();
