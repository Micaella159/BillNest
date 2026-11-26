(function () {
  "use strict";

  const STORAGE_KEY = "billnest.prototype.v1";
  const BACKUP_KEY = "billnest.prototype.v1.backup";
  const app = document.getElementById("app");
  const icons = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    receipt: '<path d="M4 3h16v18l-3-2-3 2-3-2-3 2-4-2z"/><path d="M8 8h8M8 12h8"/>',
    chart: '<path d="M4 19V5M4 19h17"/><path d="m7 15 4-5 3 2 5-7"/>',
    back: '<path d="m15 18-6-6 6-6"/><path d="M9 12h11"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    bolt: '<path d="m13 2-3 8h7l-6 12 1-9H5z"/>',
    water: '<path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11z"/>',
    wifi: '<path d="M5 9a11 11 0 0 1 14 0M8 12a6.5 6.5 0 0 1 8 0M11 15a2 2 0 0 1 2 0"/><path d="M12 19h.01"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/><path d="m9 12 2 2 4-4"/>',
    bag: '<path d="M5 8h14l1 13H4z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    car: '<path d="m5 11 2-5h10l2 5"/><path d="M3 11h18v8H3z"/><path d="M6 19v2m12-2v2M6 15h.01M18 15h.01"/>',
    food: '<path d="M7 3v7M4 3v4a3 3 0 0 0 6 0V3M7 10v11M17 3v18M17 3c-3 2-3 7 0 9"/>',
    dots: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6m4 4v7m6-7v7"/>',
    edit: '<path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16z"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    wallet: '<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18m-5 4h2"/>',
    warning: '<path d="m12 3 10 18H2z"/><path d="M12 9v4m0 4h.01"/>'
  };
  const categoryIcons = { Electricity: "bolt", Water: "water", Internet: "wifi", Insurance: "shield", Shopping: "bag", Transport: "car", Food: "food", Other: "receipt" };

  function icon(name, size) {
    return '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (icons[name] || icons.receipt) + '</svg>';
  }
  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function monthKey(date) {
    const value = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(value.getTime())) return null;
    return value.getFullYear() + "-" + String(value.getMonth() + 1).padStart(2, "0");
  }
  function dateIso(day, key) {
    const selected = key || monthKey(new Date());
    if (!selected) return "";
    const [year, month] = selected.split("-").map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return selected + "-" + String(Math.min(Math.max(Number(day) || 1, 1), lastDay)).padStart(2, "0");
  }
  function localDateIso(date) {
    const value = date || new Date();
    return value.getFullYear() + "-" + String(value.getMonth() + 1).padStart(2, "0") + "-" + String(value.getDate()).padStart(2, "0");
  }
  function shiftMonth(key, offset) {
    const [year, month] = key.split("-").map(Number);
    const date = new Date(year, month - 1 + offset, 1);
    return monthKey(date);
  }
  function monthLabel(key) {
    const [year, month] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1)).toUpperCase();
  }
  function normalizeId(record, prefix) {
    if (record && typeof record.id === "string" && record.id) return record.id;
    const id = uid(prefix);
    if (record) record.id = id;
    return id;
  }
  function validIsoDate(value) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value + "T12:00:00").getTime());
  }
  function sampleData() {
    const currentMonth = monthKey(new Date());
    return {
      bills: [
        { id: "bill-electric", name: "Electricity", category: "Electricity", amount: 2800, dueDate: dateIso(8, currentMonth), description: "Monthly household electricity · Account 0123-4567", provider: "Meralco", paid: false, paymentHistory: [{ date: dateIso(7, shiftMonth(currentMonth, -1)), amount: 2750 }, { date: dateIso(8, shiftMonth(currentMonth, -2)), amount: 2700 }, { date: dateIso(6, shiftMonth(currentMonth, -3)), amount: 2650 }] },
        { id: "bill-water", name: "Water", category: "Water", amount: 850, dueDate: dateIso(12, currentMonth), description: "Monthly water utility", provider: "Maynilad", paid: false, paymentHistory: [] },
        { id: "bill-internet", name: "Fiber Internet", category: "Internet", amount: 2100, dueDate: dateIso(20, currentMonth), description: "Home fiber internet service", provider: "Fiber Provider", paid: false, paymentHistory: [] },
        { id: "bill-insurance", name: "Health Insurance", category: "Insurance", amount: 1500, dueDate: dateIso(28, currentMonth), description: "Monthly health insurance", provider: "Health Insurance Provider", paid: false, paymentHistory: [] },
        { id: "bill-garbage", name: "Garbage Collection", category: "Other", amount: 350, dueDate: dateIso(30, shiftMonth(currentMonth, -1)), description: "Monthly garbage collection", provider: "Local Collection", paid: false, paymentHistory: [] }
      ],
      expenses: [
        { id: "expense-shopping", name: "Household shopping", category: "Shopping", amount: 7200, date: dateIso(8, currentMonth), description: "Household purchase" },
        { id: "expense-transport", name: "Transport", category: "Transport", amount: 1500, date: dateIso(12, currentMonth), description: "Monthly transport expenses" },
        { id: "expense-food", name: "Groceries", category: "Food", amount: 1100, date: dateIso(20, currentMonth), description: "Household groceries" },
        { id: "expense-utility", name: "Electricity payment", category: "Electricity", amount: 2800, date: dateIso(3, currentMonth), description: "Monthly household electricity · Account 0123-4567" },
        { id: "expense-water", name: "Water payment", category: "Water", amount: 850, date: dateIso(12, currentMonth), description: "No additional notes" }
      ],
      notifications: [
        { id: "notice-electric", title: "Electricity bill reminder", message: "Your ₱2,800 electricity bill is due on " + fmtDate(dateIso(8, currentMonth)) + ".", type: "bill", recordId: "bill-electric", date: dateIso(18, currentMonth) },
        { id: "notice-shopping", title: "Shopping spend is up", message: "Shopping is ₱2,200 above your usual monthly average.", type: "expense", recordId: "expense-shopping", date: dateIso(8, currentMonth) },
        { id: "notice-water", title: "Water bill reminder", message: "Your ₱850 water bill is due " + fmtDate(dateIso(12, currentMonth)) + ".", type: "bill", recordId: "bill-water", date: dateIso(10, currentMonth) }
      ],
      transactions: [
        { id: "txn-shopping", expenseId: "expense-shopping", name: "Household shopping", category: "Shopping", amount: 7200, date: dateIso(8), description: "Household purchase", status: "Completed" },
        { id: "txn-rent", billId: "bill-rent", name: "Home rent", category: "Other", amount: 6000, date: dateIso(3), description: "Monthly home rent", status: "Paid" },
        { id: "txn-electric", expenseId: "expense-utility", name: "Electricity payment", category: "Electricity", amount: 2800, date: dateIso(3), description: "Monthly household electricity · Account 0123-4567", status: "Completed" },
        { id: "txn-insurance", billId: "bill-insurance", name: "Insurance", category: "Insurance", amount: 1500, date: dateIso(8), description: "Household insurance", status: "Paid" },
        { id: "txn-transport", expenseId: "expense-transport", name: "Transport", category: "Transport", amount: 1500, date: dateIso(12), description: "Monthly transport expenses", status: "Completed" }
      ]
    };
  }
  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return sampleData();
      const parsed = JSON.parse(saved);
      if (!parsed || !Array.isArray(parsed.bills) || !Array.isArray(parsed.expenses) || !Array.isArray(parsed.transactions)) return sampleData();
      parsed.notifications = Array.isArray(parsed.notifications) ? parsed.notifications : sampleData().notifications;
      const fallbackDate = localDateIso(new Date());

      parsed.bills = parsed.bills.map(function (bill) {
        const record = bill && typeof bill === "object" ? bill : {};
        normalizeId(record, "bill");
        record.name = String(record.name || "Bill").trim();
        record.category = String(record.category || "Other");
        record.provider = String(record.provider || "");
        record.amount = Number(record.amount || 0);
        record.description = String(record.description || "");
        record.paid = record.paid === true;
        record.dueDate = validIsoDate(record.dueDate) ? record.dueDate : fallbackDate;
        record.paymentHistory = Array.isArray(record.paymentHistory) ? record.paymentHistory.map(function (payment) {
          const item = payment && typeof payment === "object" ? payment : {};
          return {
            date: validIsoDate(item.date) ? item.date : fallbackDate,
            amount: Number(item.amount || record.amount || 0),
            source: item.source === "marked-paid" ? "marked-paid" : "payment-history"
          };
        }) : [];
        record.paidDate = validIsoDate(record.paidDate) ? record.paidDate : null;
        return record;
      });
      parsed.expenses = parsed.expenses.map(function (expense) {
        const record = expense && typeof expense === "object" ? expense : {};
        normalizeId(record, "expense");
        record.name = String(record.name || "Expense").trim();
        record.category = String(record.category || "Other");
        record.amount = Number(record.amount || 0);
        record.description = String(record.description || "");
        record.date = validIsoDate(record.date) ? record.date : fallbackDate;
        return record;
      });
      parsed.transactions = parsed.transactions.map(function (transaction) {
        const record = transaction && typeof transaction === "object" ? transaction : {};
        normalizeId(record, "txn");
        record.name = String(record.name || "Transaction").trim();
        record.category = String(record.category || "Other");
        record.amount = Number(record.amount || 0);
        record.description = String(record.description || "");
        record.date = validIsoDate(record.date) ? record.date : fallbackDate;
        record.status = String(record.status || (record.billId ? "Paid" : "Completed"));
        return record;
      });
      parsed.notifications = parsed.notifications.filter(function (notice) { return notice && typeof notice === "object"; }).map(function (notice) {
        notice.id = String(notice.id || uid("notice"));
        notice.title = String(notice.title || "BillNest update");
        notice.message = String(notice.message || "");
        notice.type = notice.type === "expense" ? "expense" : "bill";
        notice.date = validIsoDate(notice.date) ? notice.date : fallbackDate;
        return notice;
      });
      reconcileNotifications(parsed);
      return parsed;
    } catch (error) {
      console.error("Could not load BillNest data from localStorage.", error);
      return sampleData();
    }
  }
  let state = loadData();
  let screen = "splash";
  let previousScreen = "dashboard";
  let selectedBillId = null;
  let selectedExpenseId = null;
  let selectedExpenseCategory = "Shopping";
  let selectedTransactionId = null;
  let transactionReturnScreen = "history";
  let returnTo = "dashboard";
  let transactionFilter = "All";
  let transactionCategoryFilter = "All";
  let transactionSearch = "";
  let billFilter = "Unpaid";
  let modal = null;
  let toastTimer = null;
  let selectedMonth = monthKey(new Date());

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
    catch (error) { console.error("Could not save BillNest data to localStorage.", error); showToast("Changes could not be saved on this device."); return false; }
  }
  function resetViewState() {
    selectedBillId = null;
    selectedExpenseId = null;
    selectedExpenseCategory = "Shopping";
    selectedTransactionId = null;
    transactionReturnScreen = "history";
    returnTo = "dashboard";
    previousScreen = "dashboard";
    transactionFilter = "All";
    transactionCategoryFilter = "All";
    transactionSearch = "";
    billFilter = "Unpaid";
    selectedMonth = monthKey(new Date());
  }
  function resetPrototypeData() {
    let previousData;
    try {
      previousData = localStorage.getItem(STORAGE_KEY);
      localStorage.setItem(BACKUP_KEY, JSON.stringify({
        version: 1,
        createdAt: new Date().toISOString(),
        storageKey: STORAGE_KEY,
        data: previousData
      }));
    } catch (error) {
      console.error("Could not back up BillNest data before resetting.", error);
      modal = null;
      render();
      showToast("Reset cancelled: your current data could not be backed up.");
      return;
    }

    const previousState = state;
    state = sampleData();
    const saved = save();
    if (!saved) {
      state = previousState;
      try {
        if (previousData === null) localStorage.removeItem(STORAGE_KEY);
        else localStorage.setItem(STORAGE_KEY, previousData);
      } catch (error) {
        console.error("Could not restore BillNest data after a failed reset.", error);
      }
      modal = null;
      render();
      showToast("Reset cancelled: demo data could not be saved. Your backup is available.");
      return;
    }

    resetViewState();
    screen = "dashboard";
    modal = null;
    render();
    showToast("Prototype data reset. Your previous data was backed up.");
  }
  function prototypeBackupAvailable() {
    try { return localStorage.getItem(BACKUP_KEY) !== null; }
    catch (error) {
      console.error("Could not check for a BillNest data backup.", error);
      return null;
    }
  }
  function restorePrototypeBackup() {
    let backup;
    let previousData;
    try {
      const backupText = localStorage.getItem(BACKUP_KEY);
      if (!backupText) throw new Error("No saved prototype backup was found.");
      backup = JSON.parse(backupText);
      if (!backup || backup.version !== 1 || backup.storageKey !== STORAGE_KEY ||
          !(backup.data === null || typeof backup.data === "string")) {
        throw new Error("The saved prototype backup is invalid.");
      }
      if (backup.data !== null) {
        const parsed = JSON.parse(backup.data);
        if (!parsed || !Array.isArray(parsed.bills) || !Array.isArray(parsed.expenses) || !Array.isArray(parsed.transactions)) {
          throw new Error("The saved prototype backup does not contain valid BillNest data.");
        }
      }
      previousData = localStorage.getItem(STORAGE_KEY);
      if (backup.data === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, backup.data);
    } catch (error) {
      console.error("Could not restore the BillNest prototype backup.", error);
      modal = null;
      render();
      showToast(error.message === "No saved prototype backup was found."
        ? error.message
        : "Backup could not be restored. Your current data was not changed.");
      return;
    }

    state = loadData();
    resetViewState();
    screen = "dashboard";
    modal = null;
    render();
    showToast("Previous BillNest data restored.");
  }
  function money(value) { return "₱" + Number(value || 0).toLocaleString("en-PH", { maximumFractionDigits: 2 }); }
  function fmtDate(value, options) {
    if (!value) return "—";
    const date = new Date(value + "T12:00:00");
    return new Intl.DateTimeFormat("en-PH", options || { month: "short", day: "numeric", year: "numeric" }).format(date);
  }
  function dateGroupLabel(value) {
    if (!validIsoDate(value)) return "Date not available";
    const today = localDateIso(new Date());
    const yesterday = localDateIso(new Date(Date.now() - 86400000));
    if (value === today) return "Today";
    if (value === yesterday) return "Yesterday";
    return fmtDate(value);
  }
  function byId(list, id) { return list.find(function (item) { return item.id === id; }); }
  function monthlyBills() { return state.bills.filter(function (bill) { return monthKey(bill.dueDate + "T12:00:00") === selectedMonth; }); }
  function totalBills() { return monthlyBills().reduce(function (sum, bill) { return sum + Number(bill.amount || 0); }, 0); }
  function paidBills() { return monthlyBills().filter(function (bill) { return bill.paid; }).reduce(function (sum, bill) { return sum + Number(bill.amount || 0); }, 0); }
  function dueBills() { return monthlyBills().filter(function (bill) { return !bill.paid; }).reduce(function (sum, bill) { return sum + Number(bill.amount || 0); }, 0); }
  function overdueBills() { return monthlyBills().filter(function (bill) { return !bill.paid && statusClass(bill) === "overdue"; }); }
  function overdueBillsTotal() { return overdueBills().reduce(function (sum, bill) { return sum + Number(bill.amount || 0); }, 0); }
  function expenseTotal() { return state.expenses.reduce(function (sum, expense) { return sum + Number(expense.amount || 0); }, 0); }
  function expenseTotalForMonth(key) {
    return state.expenses.filter(function (expense) { return validIsoDate(expense.date) && monthKey(expense.date) === key; }).reduce(function (sum, expense) { return sum + Number(expense.amount || 0); }, 0);
  }
  function categoryExpenseTotal(category, key) {
    return state.expenses.filter(function (expense) {
      return validIsoDate(expense.date) && monthKey(expense.date) === key && expense.category === category;
    }).reduce(function (sum, expense) { return sum + Number(expense.amount || 0); }, 0);
  }
  function categoryUsualAverage(category, key) {
    const recordedMonths = [];
    for (let offset = -3; offset < 0; offset += 1) {
      const month = shiftMonth(key, offset);
      if (state.expenses.some(function (expense) { return validIsoDate(expense.date) && monthKey(expense.date) === month; })) {
        recordedMonths.push(month);
      }
    }
    if (recordedMonths.length !== 3) return null;
    return recordedMonths.reduce(function (sum, month) { return sum + categoryExpenseTotal(category, month); }, 0) / recordedMonths.length;
  }
  function spendingAlert(current, average) {
    return average !== null && average > 0 && current >= average * 1.2;
  }
  function billsTotalForMonth(key) {
    return state.bills.filter(function (bill) { return validIsoDate(bill.dueDate) && monthKey(bill.dueDate) === key; }).reduce(function (sum, bill) { return sum + Number(bill.amount || 0); }, 0);
  }
  function monthHouseholdTotal(key) {
    return expenseTotalForMonth(key) + billsTotalForMonth(key);
  }
  function monthShortName(key) {
    if (!key) return "";
    const [year, month] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("en-PH", { month: "short" }).format(new Date(year, month - 1, 1));
  }
  function categoryTotal(category) { return state.expenses.filter(function (expense) { return expense.category === category; }).reduce(function (sum, expense) { return sum + Number(expense.amount || 0); }, 0); }
  function spentShopping() { return categoryTotal("Shopping"); }
  function uid(prefix) { return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function categoryIcon(category) { return categoryIcons[category] || "receipt"; }
  function statusClass(bill) {
    if (bill.paid) return "paid";
    if (!validIsoDate(bill.dueDate)) return "due";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(bill.dueDate + "T00:00:00");
    return due < today ? "overdue" : "due";
  }
  function statusText(bill) {
    if (bill.paid) return "Paid";
    return statusClass(bill) === "overdue" ? "Overdue" : "Due";
  }
  function route(next) { previousScreen = screen; screen = next; render(); }
  function goBack() {
    if (modal) { modal = null; render(); return; }
    if (screen === "bill-details") screen = returnTo && returnTo !== "bill-details" ? returnTo : "dashboard";
    else if (screen === "expense-details") screen = returnTo && returnTo !== "expense-details" ? returnTo : "dashboard";
    else if (screen === "category-overview") screen = returnTo && returnTo !== "category-overview" ? returnTo : "insights";
    else if (screen === "transaction-details" || screen === "expense-transaction-details") screen = transactionReturnScreen || "history";
    else if (screen === "edit-bill" || screen === "add-bill") screen = selectedBillId ? "bill-details" : (returnTo || "dashboard");
    else if (screen === "edit-expense" || screen === "add-expense") screen = selectedExpenseId ? "expense-details" : (returnTo || "dashboard");
    else if (screen === "history") screen = previousScreen && previousScreen !== "history" ? previousScreen : "dashboard";
    else if (screen === "notifications") screen = previousScreen && previousScreen !== "notifications" ? previousScreen : "dashboard";
    else if (screen !== "dashboard") screen = "dashboard";
    else screen = "splash";
    render();
  }
  function showToast(message) {
    let node = document.querySelector(".toast");
    if (node) node.remove();
    node = document.createElement("div");
    node.className = "toast";
    node.setAttribute("role", "status");
    node.textContent = message;
    document.body.appendChild(node);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { if (node.isConnected) node.remove(); }, 2600);
  }
  function topbar(title, subtitle, action) {
    return '<header class="topbar"><button class="icon-button" data-action="back" aria-label="Go back">' + icon("back") + '</button><div class="topbar-title"><h1>' + escapeHtml(title) + '</h1>' + (subtitle ? '<p>' + escapeHtml(subtitle) + '</p>' : '') + '</div>' + (action || '') + '</header>';
  }
  function monthControl() {
    return '<div class="summary-row month-control"><button class="secondary-button" data-action="previous-month" aria-label="Previous month">‹</button><button class="month-label" data-action="current-month" aria-label="Use current month">' + escapeHtml(monthLabel(selectedMonth)) + '</button><button class="secondary-button" data-action="next-month" aria-label="Next month">›</button></div>';
  }
  function bottomNav(active) {
    return '<nav class="bottom-nav" aria-label="Main navigation">' +
      navButton("dashboard", "Home", "home", active) +
      navButton("bills", "Bills", "receipt", active) +
      navButton("insights", "Insights", "chart", active) + '</nav>';
  }
  function navButton(target, label, iconName, active) {
    return '<button class="nav-item ' + (active === target ? "active" : "") + '" data-action="navigate" data-screen="' + target + '">' + icon(iconName) + '<span>' + label + '</span></button>';
  }
  function shell(content, options) {
    options = options || {};
    return '<section class="screen ' + (options.nav ? "has-nav" : "") + '">' + (options.header || "") + '<div class="screen-content ' + (!options.nav ? "no-nav" : "") + '">' + content + '</div>' + (options.nav ? bottomNav(options.active || "") : "") + '</section>';
  }
  function emptyState(title, message) {
    return '<div class="card empty-state"><strong>' + escapeHtml(title) + '</strong>' + escapeHtml(message) + '</div>';
  }
  function recordCard(record, type) {
    const bill = type === "bill";
    const category = record.category || "Other";
    const meta = bill ? "Due " + fmtDate(record.dueDate, { month: "short", day: "numeric" }) : fmtDate(record.date, { month: "short", day: "numeric" }) + " · " + category;
    return '<button class="record-card" data-action="open-' + type + '" data-id="' + escapeHtml(record.id) + '">' +
      '<span class="record-icon ' + (category === "Water" || category === "Shopping" ? "green" : category === "Internet" ? "purple" : category === "Insurance" ? "orange" : "") + '">' + icon(categoryIcon(category)) + '</span>' +
      '<span class="record-info"><strong>' + escapeHtml(record.name) + '</strong><small>' + escapeHtml(meta) + '</small></span>' +
      '<span class="record-trailing"><strong>' + money(record.amount) + '</strong><small class="status ' + (bill ? statusClass(record) : "paid") + '">' + (bill ? statusText(record) : "Expense") + '</small></span></button>';
  }
  function recordCardFromTransaction(txn) {
    const category = txn.category || "Other";
    return '<button class="record-card" data-action="open-transaction" data-id="' + escapeHtml(txn.id) + '">' +
      '<span class="record-icon ' + (txn.expenseId ? "green" : "") + '">' + icon(categoryIcon(category)) + '</span>' +
      '<span class="record-info"><strong>' + escapeHtml(txn.name) + '</strong><small>' + escapeHtml(fmtDate(txn.date, { month: "short", day: "numeric" }) + " · " + category) + '</small></span>' +
      '<span class="record-trailing"><strong>' + money(txn.amount) + '</strong><small class="status paid">' + escapeHtml(txn.status) + '</small></span></button>';
  }
  function dashboard() {
    const monthExpenses = state.expenses.filter(function (expense) { return validIsoDate(expense.date) && monthKey(expense.date) === selectedMonth; });
    const shopping = monthExpenses.filter(function (expense) { return expense.category === "Shopping"; }).reduce(function (sum, expense) { return sum + Number(expense.amount || 0); }, 0);
    const shoppingAverage = categoryUsualAverage("Shopping", selectedMonth);
    const difference = shoppingAverage === null ? 0 : shopping - shoppingAverage;
    const percent = shoppingAverage > 0 ? Math.round(difference / shoppingAverage * 100) : 0;
    const due = monthlyBills().filter(function (bill) { return !bill.paid; }).sort(function (a, b) { return a.dueDate.localeCompare(b.dueDate); }).slice(0, 3);
    const total = totalBills();
    const previousKey = shiftMonth(selectedMonth, -1);
    const previousTotal = monthHouseholdTotal(previousKey);
    const badgeComparisonTotal = monthHouseholdTotal(selectedMonth);
    const hasPreviousExpenseData = state.expenses.some(function (expense) { return validIsoDate(expense.date) && monthKey(expense.date) === previousKey; });
    const monthDifference = previousTotal > 0 && hasPreviousExpenseData ? Math.round((badgeComparisonTotal - previousTotal) / previousTotal * 100) : null;
    const dueCount = monthlyBills().filter(function (bill) { return !bill.paid; }).length;
    const recent = state.transactions.filter(function (txn) { return validIsoDate(txn.date) && monthKey(txn.date) === selectedMonth; }).sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 3);
    return shell(
      '<div class="greeting"><div><h2>Hi, Maria!</h2><p>Here’s your household this month</p></div><button class="icon-button" data-action="navigate" data-screen="notifications" aria-label="Notifications">' + icon("bell") + '</button></div>' +
      monthControl() + '<article class="card total-card"><div class="dashboard-month-row"><div class="total-label">Total This Month</div><span class="month-badge">' + (monthDifference === null ? "Current month" : (monthDifference >= 0 ? "+" : "") + monthDifference + "% vs " + monthShortName(previousKey)) + '</span></div><div class="total-amount">' + money(total) + '</div><div class="summary-row"><div class="summary-item"><i class="summary-dot"></i><span>Paid<strong>' + money(paidBills()) + '</strong></span></div><div class="summary-item due"><i class="summary-dot"></i><span>Due<strong>' + dueCount + ' bills</strong><small>' + money(dueBills()) + '</small></span></div></div></article>' +
      '<div class="section-heading"><h2>Spending alert</h2><span class="month-label">This month</span></div>' +
      (shoppingAverage === null ? '<article class="card alert-card"><div class="alert-title"><span class="alert-icon">' + icon("warning", 17) + '</span>Usual spending average unavailable</div><p>More recorded monthly expense history is needed to compare Shopping spending.</p></article>' :
        spendingAlert(shopping, shoppingAverage) ? '<article class="card alert-card"><div class="alert-title"><span class="alert-icon">' + icon("warning", 17) + '</span>Shopping is Higher Than Usual</div><p>Current spending: <strong>' + money(shopping) + '</strong>. Usual average: <strong>' + money(shoppingAverage) + '</strong>. Difference: <strong>+' + money(difference) + ' (' + percent + '%)</strong></p></article>' :
          '<article class="card alert-card"><div class="alert-title"><span class="alert-icon">' + icon("check", 17) + '</span>Spending is On Track</div><p>Current spending: <strong>' + money(shopping) + '</strong>. Usual average: <strong>' + money(shoppingAverage) + '</strong>.</p></article>') +
      '<div class="section-heading"><h2>Quick Actions</h2></div><div class="quick-grid quick-grid-three">' +
      '<button class="quick-action" data-action="start-add-bill"><span class="quick-icon">' + icon("receipt") + '</span><span><strong>Add Bill</strong><small>Record a household bill</small></span></button>' +
      '<button class="quick-action" data-action="start-add-expense"><span class="quick-icon">' + icon("plus") + '</span><span><strong>Add Expense</strong><small>Log a purchase</small></span></button>' +
      '<button class="quick-action" data-action="navigate" data-screen="insights"><span class="quick-icon">' + icon("chart") + '</span><span><strong>View Insights</strong><small>Review spending patterns</small></span></button></div>' +
      '<div class="section-heading"><h2>Upcoming bills</h2><button class="text-button" data-action="navigate" data-screen="bills">See all</button></div>' +
      (due.length ? '<div class="record-list">' + due.map(function (bill) { return recordCard(bill, "bill"); }).join("") + '</div>' : emptyState("All caught up", "You have no unpaid bills right now.")) +
      '<div class="section-heading"><h2>Recent Activity</h2><button class="text-button" data-action="navigate" data-screen="history">View history</button></div>' +
      '<div class="record-list">' + (recent.length ? recent.map(function (txn) { return recordCardFromTransaction(txn); }).join("") : '<div class="card empty-state">No recent activity for this month.</div>') + '</div>',
      { nav: true, active: "dashboard" }
    );
  }
  function billsScreen() {
    const currentBills = monthlyBills();
    const list = state.bills.filter(function (bill) {
      const billMonth = monthKey(bill.dueDate);
      return billMonth === selectedMonth || (!bill.paid && billMonth < selectedMonth);
    }).slice().sort(function (a, b) { return a.dueDate.localeCompare(b.dueDate); });
    const unpaid = currentBills.filter(function (bill) { return !bill.paid; });
    const overdue = list.filter(function (bill) { return !bill.paid && statusClass(bill) === "overdue"; });
    const paid = currentBills.filter(function (bill) { return bill.paid; });
    const filtered = list.filter(function (bill) {
      if (billFilter === "Unpaid") return monthKey(bill.dueDate) === selectedMonth && !bill.paid;
      if (billFilter === "Overdue") return !bill.paid && statusClass(bill) === "overdue";
      if (billFilter === "Paid") return bill.paid;
      return true;
    });
    const action = '<button class="icon-button" data-action="start-add-bill" aria-label="Add bill">' + icon("plus") + '</button>';
    return shell(topbar("Bills", "Manage your household payments", action) +
      monthControl() +
      '<div class="bill-summary-grid">' +
      '<article class="card bill-summary"><span class="bill-summary-label">Unpaid</span><strong>' + money(unpaid.reduce(function (sum, bill) { return sum + Number(bill.amount || 0); }, 0)) + '</strong><small>' + unpaid.length + ' bills</small></article>' +
      '<article class="card bill-summary overdue"><span class="bill-summary-label">Overdue</span><strong>' + money(overdue.reduce(function (sum, bill) { return sum + Number(bill.amount || 0); }, 0)) + '</strong><small>' + overdue.length + ' bill' + (overdue.length === 1 ? "" : "s") + '</small></article>' +
      '<article class="card bill-summary paid"><span class="bill-summary-label">Paid</span><strong>' + money(paid.reduce(function (sum, bill) { return sum + Number(bill.amount || 0); }, 0)) + '</strong><small>' + paid.length + ' bills</small></article>' +
      '</div>' +
      '<div class="filter-row bill-filter-row">' + [
        ["Unpaid", unpaid.length], ["Overdue", overdue.length], ["Paid", paid.length], ["All", list.length]
      ].map(function (filter) { return '<button class="filter-chip ' + (billFilter === filter[0] ? "active" : "") + '" data-action="filter-bills" data-filter="' + filter[0] + '">' + filter[0] + ' ' + filter[1] + '</button>'; }).join("") + '</div>' +
      '<div class="section-heading" style="margin-top:5px"><h2>Bills</h2><span class="month-label">' + filtered.length + ' bills</span></div>' +
      (filtered.length ? '<div class="record-list">' + filtered.map(function (bill) { return recordCard(bill, "bill"); }).join("") + '</div>' : emptyState("No bills found", "No bills match this filter.")) +
      '<button class="primary-button" style="width:100%;margin-top:16px" data-action="start-add-bill">' + icon("plus", 17) + ' &nbsp;Add Bill</button>',
      { nav: true, active: "bills" });
  }
  function billDetails() {
    const bill = byId(state.bills, selectedBillId);
    if (!bill) return shell(topbar("Bill details") + emptyState("Bill not found", "This bill may have been removed."), {});
    const paymentHistory = Array.isArray(bill.paymentHistory) ? bill.paymentHistory.slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); }) : [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueIn = bill.paid || !validIsoDate(bill.dueDate) ? null : Math.ceil((new Date(bill.dueDate + "T00:00:00") - today) / 86400000);
    const dueContext = bill.paid ? "Paid" : dueIn < 0 ? "Overdue" : dueIn === 0 ? "Due today" : "Due in " + dueIn + " day" + (dueIn === 1 ? "" : "s");
    return shell(topbar("Bill details", "", '<button class="icon-button" data-action="bill-menu" aria-label="More options">' + icon("dots") + '</button>') +
      '<article class="card detail-hero"><span class="record-icon">' + icon(categoryIcon(bill.category)) + '</span><h2>' + escapeHtml(bill.name) + '</h2><div class="detail-amount">' + money(bill.amount) + '</div><div class="detail-meta">' + escapeHtml(dueContext) + '</div><span class="status ' + statusClass(bill) + '" style="margin-top:12px">' + statusText(bill) + '</span></article>' +
      '<div class="section-heading"><h2>Bill information</h2></div><article class="card detail-list">' +
      '<div class="detail-line"><span>Bill name</span><strong>' + escapeHtml(bill.name) + '</strong></div>' +
      '<div class="detail-line"><span>Category</span><strong>' + escapeHtml(bill.category) + '</strong></div>' +
      '<div class="detail-line"><span>Provider</span><strong>' + escapeHtml(bill.provider || "Not specified") + '</strong></div>' +
      '<div class="detail-line"><span>Due date</span><strong>' + fmtDate(bill.dueDate) + '</strong></div>' +
      '<div class="detail-line"><span>Payment status</span><strong>' + statusText(bill) + '</strong></div>' +
      '<div class="detail-line"><span>Description</span><strong>' + escapeHtml(bill.description || "No additional notes") + '</strong></div></article>' +
      '<div class="section-heading"><h2>Payment History</h2>' + (paymentHistory.length ? '<button class="text-button" data-action="open-history">View Transaction History</button>' : '') + '</div>' +
      (paymentHistory.length ? '<article class="card detail-list">' + paymentHistory.map(function (payment) { return '<div class="detail-line"><span>Paid ' + fmtDate(payment.date, { month: "short", day: "numeric" }) + '</span><strong>' + money(payment.amount) + '</strong></div>'; }).join("") + '</article>' : '<article class="card empty-state">No previous payments recorded.</article>') +
      '<div class="action-stack">' + (!bill.paid ? '<button class="primary-button" data-action="mark-paid">' + icon("check", 17) + ' &nbsp;Mark as paid</button>' : '<button class="secondary-button" data-action="mark-unpaid">Mark as unpaid</button>') +
      '<button class="secondary-button" data-action="edit-bill">Edit Bill</button><button class="secondary-button" data-action="open-history">View Transaction History</button><button class="danger-button" data-action="confirm-delete-bill">Delete Bill</button></div>',
      {});
  }
  function formScreen(kind, editing) {
    const bill = kind === "bill";
    const existing = editing ? byId(bill ? state.bills : state.expenses, bill ? selectedBillId : selectedExpenseId) : null;
    const screenTitle = editing ? (bill ? "Edit bill" : "Edit expense") : (bill ? "Add bill" : "Add expense");
    if (editing && !existing) return shell(topbar(screenTitle) + emptyState("Record not found", "This item may have been removed."), {});
    const descDefault = bill ? "Monthly household electricity · Account 0123-4567" : "Household purchase";
    const date = existing ? (bill ? existing.dueDate : existing.date) : dateIso(8, selectedMonth);
    const categories = bill ? ["Electricity", "Water", "Internet", "Insurance", "Other"] : ["Shopping", "Transport", "Food", "Electricity", "Water", "Internet", "Insurance", "Other"];
    const selectOptions = categories.map(function (category) { return '<option value="' + category + '"' + ((existing ? existing.category : (bill ? "Electricity" : "Shopping")) === category ? " selected" : "") + '>' + category + '</option>'; }).join("");
    return shell(topbar(screenTitle) + '<form class="card form-card" id="record-form" data-kind="' + (bill ? "bill" : "expense") + '" data-editing="' + (editing ? "true" : "false") + '">' +
      '<div class="field"><label for="record-name">' + (bill ? "Bill name" : "Expense name") + '</label><input id="record-name" name="name" required maxlength="70" placeholder="' + (bill ? "e.g. Electricity" : "e.g. Household shopping") + '" value="' + escapeHtml(existing ? existing.name : "") + '"></div>' +
      '<div class="field"><label for="record-amount">Amount</label><input id="record-amount" name="amount" type="number" min="0.01" step="0.01" inputmode="decimal" required placeholder="₱0.00" value="' + (existing ? escapeHtml(existing.amount) : "") + '"></div>' +
      '<div class="field"><label for="record-category">Category</label><select id="record-category" name="category" required>' + selectOptions + '</select></div>' +
      (bill ? '<div class="field"><label for="record-provider">Provider</label><input id="record-provider" name="provider" maxlength="70" placeholder="e.g. Meralco" value="' + escapeHtml(existing ? existing.provider : "") + '"></div>' : '') +
      '<div class="field"><label for="record-date">' + (bill ? "Due date" : "Date") + '</label><input id="record-date" type="date" name="date" required value="' + escapeHtml(date) + '"></div>' +
      (bill ? '<fieldset class="status-control"><legend>Payment Status</legend><label><input type="radio" name="status" value="Unpaid"' + ((editing && existing && existing.paid) ? '' : ' checked') + '> <span>Unpaid</span></label><label><input type="radio" name="status" value="Paid"' + ((editing && existing && existing.paid) ? ' checked' : '') + '> <span>Paid</span></label></fieldset>' : '') +
      '<div class="field"><label for="record-description">Description</label><textarea id="record-description" name="description" maxlength="240" placeholder="Add a note">' + escapeHtml(existing ? existing.description : "") + '</textarea></div>' +
      '<p class="form-error" id="form-error" role="alert"></p><div class="button-row"><button type="button" class="secondary-button" data-action="cancel-form">Cancel</button><button type="submit" class="primary-button">' + (editing ? "Save changes" : "Save " + (bill ? "bill" : "expense")) + '</button></div></form>' +
      (editing ? '<button class="danger-button" style="width:100%;margin-top:13px" data-action="confirm-delete-' + (bill ? "bill" : "expense") + '">Delete ' + (bill ? "bill" : "expense") + '</button>' : ''),
      {});
  }
  function expenseDetails() {
    const expense = byId(state.expenses, selectedExpenseId);
    if (!expense) return shell(topbar("Expense Details") + emptyState("Expense not found", "This expense may have been removed."), {});
    return shell(topbar("Expense Details") +
      '<article class="card detail-hero"><span class="record-icon green">' + icon(categoryIcon(expense.category)) + '</span><h2>' + escapeHtml(expense.name) + '</h2><div class="detail-amount">' + money(expense.amount) + '</div><div class="detail-meta">' + fmtDate(expense.date) + '</div></article>' +
      '<div class="section-heading"><h2>Expense information</h2></div><article class="card detail-list">' +
      '<div class="detail-line"><span>Category</span><strong>' + escapeHtml(expense.category) + '</strong></div><div class="detail-line"><span>Date</span><strong>' + fmtDate(expense.date) + '</strong></div><div class="detail-line"><span>Description</span><strong>' + escapeHtml(expense.description || "No additional notes") + '</strong></div></article>' +
      '<div class="action-stack"><button class="primary-button" data-action="edit-expense">Edit Expense</button><button class="secondary-button" data-action="open-category-overview" data-category="' + escapeHtml(expense.category) + '">View Category Overview</button><button class="secondary-button" data-action="open-history">Transaction History</button><button class="danger-button" data-action="confirm-delete-expense">Delete Expense</button></div>',
      {});
  }
  function categoryOverview() {
    const category = ["Shopping", "Transport", "Food", "Electricity", "Water", "Internet", "Insurance", "Other"].includes(selectedExpenseCategory) ? selectedExpenseCategory : "Shopping";
    const currentTotal = categoryExpenseTotal(category, selectedMonth);
    const usualAverage = categoryUsualAverage(category, selectedMonth);
    const usualDifference = usualAverage === null ? null : currentTotal - usualAverage;
    const usualVariance = usualAverage > 0 ? usualDifference / usualAverage * 100 : null;
    const previousKey = shiftMonth(selectedMonth, -1);
    const previousTotal = categoryExpenseTotal(category, previousKey);
    const difference = currentTotal - previousTotal;
    const variance = previousTotal > 0 ? (difference / previousTotal) * 100 : null;
    const categoryExpenses = state.expenses.filter(function (expense) {
      return validIsoDate(expense.date) && monthKey(expense.date) === selectedMonth && expense.category === category;
    }).sort(function (a, b) { return b.date.localeCompare(a.date); });
    const oldestKey = categoryExpenseMonths(category)[0] || null;
    const fourMonths = [];
    for (let offset = -3; offset <= 0; offset += 1) fourMonths.push(shiftMonth(selectedMonth, offset));
    const chartAvailable = fourMonths.some(function (key) { return categoryExpenseTotal(category, key) > 0; });
    const categoryLabel = category === "Shopping" ? "Household Shopping" : category;
    const dateRange = categoryExpenses.length ? fmtDate(categoryExpenses.reduce(function (earliest, expense) { return expense.date < earliest ? expense.date : earliest; }, categoryExpenses[0].date), { month: "short", day: "numeric" }) + "–" + fmtDate(categoryExpenses.reduce(function (latest, expense) { return expense.date > latest ? expense.date : latest; }, categoryExpenses[0].date), { month: "short", day: "numeric", year: "numeric" }) : "No recorded dates";
    return shell(topbar(category + " Overview", monthLabel(selectedMonth)) +
      monthControl() +
      '<div class="category-selector">' +
      ["Shopping", "Transport", "Food", "Electricity", "Water", "Internet", "Insurance", "Other"].map(function (name) {
        return '<button class="filter-chip ' + (category === name ? "active" : "") + '" data-action="select-category" data-category="' + name + '">' + name + '</button>';
      }).join("") + '</div>' +
      '<article class="card detail-hero category-overview-hero"><span class="record-icon ' + (category === "Shopping" ? "green" : "") + '">' + icon(categoryIcon(category)) + '</span><h2>' + escapeHtml(categoryLabel) + '</h2><div class="detail-amount">' + money(currentTotal) + '</div><div class="detail-meta">' + escapeHtml(monthLabel(selectedMonth)) + '</div></article>' +
      (usualAverage === null ? '<article class="card alert-card"><div class="alert-title"><span class="alert-icon">' + icon("warning", 17) + '</span>Usual average unavailable</div><p>More recorded monthly expense history is needed for a reliable comparison.</p></article>' :
        spendingAlert(currentTotal, usualAverage) ? '<article class="card alert-card"><div class="alert-title"><span class="alert-icon">' + icon("warning", 17) + '</span>' + escapeHtml(categoryLabel) + ' is Higher Than Usual</div><p>Current spending: <strong>' + money(currentTotal) + '</strong>. Usual average: <strong>' + money(usualAverage) + '</strong>. Difference: <strong>+' + money(usualDifference) + ' (' + usualVariance.toFixed(1) + '%)</strong></p></article>' :
          '<article class="card alert-card"><div class="alert-title"><span class="alert-icon">' + icon("check", 17) + '</span>Spending is On Track</div><p>Current spending: <strong>' + money(currentTotal) + '</strong>. Usual average: <strong>' + money(usualAverage) + '</strong>.</p></article>') +
      '<article class="card comparison-card">' +
      '<div class="comparison-item"><span>Previous month</span><strong>' + (previousKey ? money(previousTotal) : "Unavailable") + '</strong></div>' +
      '<div class="comparison-item"><span>Variance</span><strong class="' + (difference > 0 ? "variance-up" : difference < 0 ? "variance-down" : "") + '">' + (variance === null ? "Unavailable" : (difference >= 0 ? "+" : "") + money(difference) + " (" + (variance >= 0 ? "+" : "") + variance.toFixed(1) + "%)") + '</strong></div>' +
      '</article>' +
      '<div class="section-heading"><h2>Category information</h2></div><article class="card detail-list">' +
      '<div class="detail-line"><span>Category</span><strong>' + escapeHtml(categoryLabel) + '</strong></div>' +
      '<div class="detail-line"><span>Period</span><strong>Current month · ' + escapeHtml(monthLabel(selectedMonth)) + '</strong></div>' +
      '<div class="detail-line"><span>Date range</span><strong>' + escapeHtml(dateRange) + '</strong></div>' +
      '<div class="detail-line"><span>Current spending</span><strong>' + money(currentTotal) + '</strong></div>' +
      '<div class="detail-line"><span>Previous month</span><strong>' + money(previousTotal) + '</strong></div>' +
      '<div class="detail-line"><span>Usual average</span><strong>' + (usualAverage === null ? "Unavailable" : money(usualAverage)) + '</strong></div>' +
      '<div class="detail-line"><span>Difference from usual</span><strong>' + (usualDifference === null ? "Unavailable" : (usualDifference >= 0 ? "+" : "") + money(usualDifference)) + '</strong></div>' +
      '<div class="detail-line"><span>Increase from usual</span><strong>' + (usualVariance === null ? "Unavailable" : (usualVariance >= 0 ? "+" : "") + usualVariance.toFixed(1) + "%") + '</strong></div>' +
      '<div class="detail-line"><span>Difference</span><strong>' + (difference >= 0 ? "+" : "") + money(difference) + '</strong></div>' +
      '<div class="detail-line"><span>Increase</span><strong>' + (variance === null ? "Unavailable" : (variance >= 0 ? "+" : "") + variance.toFixed(1) + "%") + '</strong></div>' +
      '</article>' +
      '<div class="section-heading"><h2>Last 4 Months</h2></div>' +
      (chartAvailable ? '<article class="card chart-card"><div class="bar-chart small-chart">' + fourMonths.map(function (key) {
        const value = categoryExpenseTotal(category, key);
        const maxValue = Math.max.apply(null, fourMonths.map(function (chartKey) { return categoryExpenseTotal(category, chartKey); }).concat([1]));
        const height = value > 0 ? Math.max(8, Math.round(value / maxValue * 112)) : 5;
        return '<div class="bar-group"><span class="bar-value">' + (value > 0 ? money(value).replace("₱", "") : "—") + '</span><i class="bar ' + (key === selectedMonth ? "current" : "") + '" style="height:' + height + 'px"></i><span class="bar-label">' + monthShortName(key) + '</span></div>';
      }).join("") + '</div></article>' : '<article class="card empty-state">No historical category spending is available.</article>') +
      '<div class="section-heading"><h2>Transactions</h2><button class="text-button" data-action="open-history">View history</button></div>' +
      (categoryExpenses.length ? '<article class="card" style="padding:3px 14px">' + categoryExpenses.map(function (expense) {
        return '<button class="transaction-row" style="width:100%;border:0;background:transparent;text-align:left" data-action="open-expense" data-id="' + escapeHtml(expense.id) + '"><span class="record-icon green">' + icon(categoryIcon(category)) + '</span><span class="record-info"><strong>' + escapeHtml(expense.name) + '</strong><small>' + fmtDate(expense.date) + ' · ' + escapeHtml(category) + '</small></span><span class="record-trailing"><strong>' + money(expense.amount) + '</strong></span></button>';
      }).join("") + '</article>' : '<article class="card empty-state">No ' + escapeHtml(category) + ' transactions for this month.</article>'),
      {});
  }
  function categoryExpenseMonths(category) {
    return Array.from(new Set(state.expenses.filter(function (expense) { return expense.category === category && validIsoDate(expense.date); }).map(function (expense) { return monthKey(expense.date); }))).sort();
  }
  function insights() {
    const monthExpenses = state.expenses.filter(function (expense) { return validIsoDate(expense.date) && monthKey(expense.date) === selectedMonth; });
    const categoryNames = ["Shopping", "Transport", "Food", "Electricity", "Water", "Internet", "Insurance", "Other"];
    const categories = categoryNames.map(function (name) {
      return { name: name, amount: categoryExpenseTotal(name, selectedMonth) };
    }).filter(function (item) { return item.amount > 0; }).sort(function (a, b) { return b.amount - a.amount; });
    const selectedExpenseTotal = expenseTotalForMonth(selectedMonth);
    const previousKey = shiftMonth(selectedMonth, -1);
    const previousExpenseTotal = expenseTotalForMonth(previousKey);
    const expenseDifference = selectedExpenseTotal - previousExpenseTotal;
    const expenseVariance = previousExpenseTotal > 0 ? expenseDifference / previousExpenseTotal * 100 : null;
    const chartKeys = [];
    for (let offset = -3; offset <= 0; offset += 1) chartKeys.push(shiftMonth(selectedMonth, offset));
    const shoppingCurrent = categoryExpenseTotal("Shopping", selectedMonth);
    const shoppingPrevious = categoryExpenseTotal("Shopping", previousKey);
    const shoppingDifference = shoppingCurrent - shoppingPrevious;
    const shoppingVariance = shoppingPrevious > 0 ? shoppingDifference / shoppingPrevious * 100 : null;
    const chartAvailable = chartKeys.some(function (key) { return expenseTotalForMonth(key) > 0; });
    const comparableCategories = categoryNames.map(function (name) {
      const average = categoryUsualAverage(name, selectedMonth);
      const current = categoryExpenseTotal(name, selectedMonth);
      return { name: name, current: current, average: average, difference: average === null ? null : current - average };
    }).filter(function (item) { return item.average !== null && item.average > 0; });
    const spendingAlerts = comparableCategories.filter(function (item) { return spendingAlert(item.current, item.average); });
    return shell(topbar("Insights", monthLabel(selectedMonth)) +
      monthControl() +
      '<article class="card insights-overview"><div class="chart-heading"><div><strong>Monthly Spending Overview</strong><small>' + escapeHtml(monthLabel(selectedMonth)) + '</small></div></div><div class="insights-total">' + money(selectedExpenseTotal) + '</div><div class="insights-change ' + (expenseDifference >= 0 ? "up" : "down") + '">' + (expenseVariance === null ? "No previous-month comparison" : (expenseDifference >= 0 ? "+" : "") + money(expenseDifference) + " · " + (expenseVariance >= 0 ? "+" : "") + expenseVariance.toFixed(1) + "%") + '</div><p class="insights-context">' + (previousExpenseTotal > 0 ? escapeHtml(money(expenseDifference)) + " compared with " + escapeHtml(monthLabel(previousKey)) + " (" + escapeHtml(money(previousExpenseTotal)) + ")" : "No actual records from " + escapeHtml(monthLabel(previousKey)) + " are available.") + '</p></article>' +
      '<div class="insights-summary-grid"><article class="card insights-summary paid"><span>Paid</span><strong>' + money(paidBills()) + '</strong></article><article class="card insights-summary due"><span>Still due</span><strong>' + money(dueBills()) + '</strong></article></div>' +
      '<div class="section-heading"><h2>Spending Trends</h2></div>' +
      (chartAvailable ? '<article class="card chart-card"><div class="bar-chart">' + chartKeys.map(function (key) {
        const value = expenseTotalForMonth(key);
        const maxValue = Math.max.apply(null, chartKeys.map(function (chartKey) { return expenseTotalForMonth(chartKey); }).concat([1]));
        const height = value > 0 ? Math.max(8, Math.round(value / maxValue * 112)) : 5;
        return '<div class="bar-group"><span class="bar-value">' + (value > 0 ? money(value).replace("₱", "") : "—") + '</span><i class="bar ' + (key === selectedMonth ? "current" : "") + '" style="height:' + height + 'px"></i><span class="bar-label">' + monthShortName(key) + '</span></div>';
      }).join("") + '</div></article>' : '<article class="card empty-state">No monthly expense records are available.</article>') +
      '<div class="section-heading"><h2>Spending Alerts</h2></div>' +
      (spendingAlerts.length ? '<div class="record-list">' + spendingAlerts.map(function (item) {
        const increase = (item.difference / item.average * 100).toFixed(1);
        return '<article class="card alert-card"><div class="alert-title"><span class="alert-icon">' + icon("warning", 17) + '</span>' + escapeHtml(item.name === "Shopping" ? "Household Shopping" : item.name) + ' is Higher Than Usual</div><p>Current spending: <strong>' + money(item.current) + '</strong>. Usual average: <strong>' + money(item.average) + '</strong>. Difference: <strong>+' + money(item.difference) + ' (' + increase + '%)</strong></p></article>';
      }).join("") + '</div>' : '<article class="card empty-state">' + (comparableCategories.length ? 'No category is at least 20% above its recorded three-month average.' : 'No actual expense history is available for a three-month comparison.') + '</article>') +
      '<div class="section-heading"><h2>Shopping Spending Comparison</h2></div><article class="card shopping-comparison">' +
      '<div class="comparison-item"><span>Current month</span><strong>' + money(shoppingCurrent) + '</strong></div><div class="comparison-item"><span>Previous month</span><strong>' + money(shoppingPrevious) + '</strong></div><div class="comparison-item comparison-variance"><span>Difference</span><strong>' + (shoppingVariance === null ? "Unavailable" : (shoppingDifference >= 0 ? "+" : "") + money(shoppingDifference) + " (" + (shoppingVariance >= 0 ? "+" : "") + shoppingVariance.toFixed(1) + "%)") + '</strong></div>' +
      '</article>' +
      '<div class="section-heading"><h2>Category Breakdown</h2><button class="text-button" data-action="open-history">Transactions</button></div><article class="card category-breakdown" style="padding:4px 15px">' +
      (categories.length ? categories.map(function (category) {
        const pct = selectedExpenseTotal > 0 ? category.amount / selectedExpenseTotal * 100 : 0;
        return '<button class="category-line category-button" data-action="open-category-overview" data-category="' + escapeHtml(category.name) + '"><i class="category-dot"></i><span class="record-info"><strong>' + escapeHtml(category.name === "Shopping" ? "Household Shopping" : category.name) + '</strong><small>' + pct.toFixed(pct >= 10 ? 0 : 1) + '% of expenses</small></span><strong>' + money(category.amount) + '</strong></button>';
      }).join("") : '<div class="empty-state">No spending data for this month.</div>') +
      '</article>',
      { nav: true, active: "insights" });
  }
  function history() {
    const search = transactionSearch.trim().toLowerCase();
    const entries = state.transactions.map(function (txn) { return txn; }).concat(
      state.bills.filter(function (bill) { return !bill.paid; }).map(function (bill) {
        return {
          id: "unpaid-bill-" + bill.id,
          billId: bill.id,
          name: bill.name,
          category: bill.category,
          amount: bill.amount,
          date: bill.dueDate,
          description: bill.description,
          status: "Unpaid",
          unpaidBill: true
        };
      })
    );
    const categories = Array.from(new Set(entries.map(function (entry) { return entry.category || "Other"; }))).sort();
    const filtered = entries.sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); }).filter(function (txn) {
      const matchesSearch = !search || [txn.name, txn.category, txn.description, txn.status].join(" ").toLowerCase().includes(search);
      const matchesType = transactionFilter === "All" ||
        (transactionFilter === "Expenses" ? !!txn.expenseId : (!!txn.billId || !!txn.unpaidBill));
      const matchesCategory = transactionCategoryFilter === "All" || (txn.category || "Other") === transactionCategoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
    const groups = [];
    filtered.forEach(function (txn) {
      const date = validIsoDate(txn.date) ? txn.date : "";
      let group = groups.find(function (item) { return item.date === date; });
      if (!group) { group = { date: date, entries: [] }; groups.push(group); }
      group.entries.push(txn);
    });
    return shell(topbar("Transaction history", "Your recent household activity") +
      '<label class="search-field">' + icon("search") + '<input type="search" data-action="search-transactions" value="' + escapeHtml(transactionSearch) + '" placeholder="Search transactions" aria-label="Search transactions"></label>' +
      '<div class="filter-row history-filters" aria-label="Transaction type">' + ["All", "Expenses", "Bills"].map(function (filter) { return '<button class="filter-chip ' + (transactionFilter === filter ? "active" : "") + '" data-action="filter-transactions" data-filter="' + filter + '">' + filter + '</button>'; }).join("") + '</div>' +
      '<div class="filter-row category-filters" aria-label="Transaction category">' + ["All"].concat(categories).map(function (category) { return '<button class="filter-chip ' + (transactionCategoryFilter === category ? "active" : "") + '" data-action="filter-transaction-category" data-category="' + escapeHtml(category) + '">' + (category === "All" ? "All categories" : escapeHtml(category)) + '</button>'; }).join("") + '</div>' +
      '<div class="history-summary"><strong>' + filtered.length + ' transactions</strong><span>Showing ' + escapeHtml(transactionFilter) + ' · ' + escapeHtml(transactionCategoryFilter === "All" ? "All categories" : transactionCategoryFilter) + '</span></div>' +
      (groups.length ? groups.map(function (group) {
        return '<section class="history-date-group"><div class="history-group-heading"><h2>' + escapeHtml(dateGroupLabel(group.date)) + '</h2><span>' + group.entries.length + '</span></div><article class="card history-group-card">' +
          group.entries.map(function (txn) {
            const action = txn.unpaidBill ? "open-unpaid-bill" : "open-transaction";
            const statusClassName = txn.unpaidBill ? "due" : (txn.status === "Paid" || txn.status === "Completed" ? "paid" : "pending");
            return '<button class="transaction-row" data-action="' + action + '" data-id="' + escapeHtml(txn.unpaidBill ? txn.billId : txn.id) + '"><span class="record-icon ' + (txn.expenseId ? "green" : txn.unpaidBill ? "orange" : "") + '">' + icon(categoryIcon(txn.category)) + '</span><span class="record-info"><strong>' + escapeHtml(txn.name) + '</strong><small>' + (txn.unpaidBill ? "Unpaid bill" : escapeHtml(txn.category || "Other")) + ' · ' + fmtDate(txn.date, { month: "short", day: "numeric" }) + '</small></span><span class="record-trailing"><strong>' + money(txn.amount) + '</strong><small class="status ' + statusClassName + '">' + escapeHtml(txn.status || "Completed") + '</small></span></button>';
          }).join("") + '</article></section>';
      }).join("") : '<div class="card empty-state"><strong>No transactions found</strong>Try changing your search or filter.</div>'),
      {});
  }
  function transactionDetails() {
    const txn = byId(state.transactions, selectedTransactionId);
    if (!txn) return shell(topbar("Transaction details") + emptyState("Transaction not found", "This transaction may have been removed."), {});
    return shell(topbar("Transaction details", "", '<button class="done-action" data-action="done">Done</button>') +
      '<article class="card detail-hero"><span class="record-icon green">' + icon(categoryIcon(txn.category)) + '</span><h2>' + escapeHtml(txn.name) + '</h2><div class="detail-amount">' + money(txn.amount) + '</div><div class="detail-meta">' + escapeHtml(txn.status) + '</div></article>' +
      '<div class="section-heading"><h2>Transaction information</h2></div><article class="card detail-list"><div class="detail-line"><span>Category</span><strong>' + escapeHtml(txn.category) + '</strong></div><div class="detail-line"><span>Date</span><strong>' + fmtDate(txn.date) + '</strong></div><div class="detail-line"><span>Description</span><strong>' + escapeHtml(txn.description || "No additional notes") + '</strong></div><div class="detail-line"><span>Type</span><strong>' + (txn.expenseId ? "Expense" : "Bill payment") + '</strong></div></article>' +
      '<div class="action-stack">' + (txn.expenseId ? '<button class="primary-button" data-action="open-related-expense" data-id="' + escapeHtml(txn.expenseId) + '">View expense</button>' : '<button class="primary-button" data-action="open-related-bill" data-id="' + escapeHtml(txn.billId) + '">View bill</button>') + '<button class="secondary-button" data-action="done">Done</button></div>',
      {});
  }
  function expenseTransactionDetails() {
    const txn = byId(state.transactions, selectedTransactionId);
    if (!txn) return shell(topbar("Expense Details", "", '<button class="done-action" data-action="done">Done</button>') + emptyState("Transaction not found", "This transaction may have been removed."), {});
    const expense = txn.expenseId ? byId(state.expenses, txn.expenseId) : null;
    const category = txn.category === "Shopping" ? "Household Shopping" : (txn.category || "Other");
    const amount = "PHP " + Number(txn.amount || 0).toLocaleString("en-PH", { maximumFractionDigits: 2 });
    return shell(topbar("Expense Details", "", '<button class="done-action" data-action="done">Done</button>') +
      '<article class="card detail-hero"><span class="record-icon green">' + icon(categoryIcon(txn.category)) + '</span><h2>' + escapeHtml(txn.name) + '</h2><div class="detail-amount">' + amount + '</div><span class="status paid" style="margin-top:12px">PAID EXPENSE</span></article>' +
      '<div class="section-heading"><h2>Expense information</h2></div><article class="card detail-list"><div class="detail-line"><span>Expense name</span><strong>' + escapeHtml(txn.name) + '</strong></div><div class="detail-line"><span>Category</span><strong>' + escapeHtml(category) + '</strong></div><div class="detail-line"><span>Date</span><strong>' + fmtDate(txn.date) + '</strong></div><div class="detail-line"><span>Description</span><strong>' + escapeHtml(txn.description || (expense && expense.description) || "No additional notes") + '</strong></div></article>' +
      '<div class="action-stack"><button class="secondary-button" data-action="open-history">View Transaction History</button>' +
      (expense ? '<button class="primary-button" data-action="edit-related-expense" data-id="' + escapeHtml(expense.id) + '">Edit Expense</button>' : '') +
      '<button class="secondary-button" data-action="done">Done</button></div>',
      {});
  }
  function notifications() {
    const groups = [];
    state.notifications.slice().sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); }).forEach(function (notice) {
      let title = "Unpaid";
      if (notice.type === "expense") title = "Spending alerts";
      else {
        const bill = byId(state.bills, notice.recordId);
        if (bill && bill.paid) title = "Updates";
        else if (bill && statusClass(bill) === "overdue") title = "Overdue";
        else if (bill) {
          const today = new Date(localDateIso(new Date()) + "T00:00:00");
          const due = new Date(bill.dueDate + "T00:00:00");
          const daysUntil = Math.ceil((due - today) / 86400000);
          title = daysUntil <= 10 ? "Due soon" : "Unpaid";
        }
      }
      let group = groups.find(function (item) { return item.title === title; });
      if (!group) { group = { title: title, entries: [] }; groups.push(group); }
      group.entries.push(notice);
    });
    const groupOrder = ["Overdue", "Spending alerts", "Due soon", "Unpaid", "Updates"];
    groups.sort(function (a, b) { return groupOrder.indexOf(a.title) - groupOrder.indexOf(b.title); });
    const action = state.notifications.length ? '<button class="done-action" data-action="reset-notifications">Clear all</button>' : "";
    const backupStatus = prototypeBackupAvailable();
    const restoreAction = backupStatus === true ? '<button class="secondary-button" data-action="restore-prototype-backup">Restore previous data</button>' : "";
    const backupStatusMessage = backupStatus === null ? '<p class="prototype-backup-error" role="alert">Saved backup status could not be checked.</p>' : "";
    return shell(topbar("Notifications", state.notifications.length ? state.notifications.length + " need your attention" : "You’re all caught up", action) +
      (groups.length ? groups.map(function (group) {
        return '<section class="notification-group"><div class="history-group-heading"><h2>' + escapeHtml(group.title) + '</h2><span>' + group.entries.length + '</span></div>' +
          group.entries.map(function (notice) {
            return '<button class="card notification-card" data-action="open-notification" data-type="' + escapeHtml(notice.type) + '" data-id="' + escapeHtml(notice.recordId) + '"><span class="record-icon ' + (notice.type === "bill" ? "orange" : "green") + '">' + icon(notice.type === "bill" ? "bell" : "chart") + '</span><span class="record-info"><strong>' + escapeHtml(notice.title) + '</strong><p>' + escapeHtml(notice.message) + '</p><small>' + fmtDate(notice.date) + '</small></span></button>';
          }).join("") + '</section>';
      }).join("") : emptyState("You’re all caught up", "New reminders and updates will appear here.")) +
      '<section class="card prototype-data-card"><div><strong>Prototype data</strong><p>Reset replaces all locally stored bills, expenses, transactions, and notifications with the initial demo data.</p>' + backupStatusMessage + '</div><div class="prototype-data-actions">' + restoreAction + '<button class="danger-button" data-action="reset-prototype-data">Reset prototype data</button></div></section>',
      {});
  }
  function splash() {
    return '<section class="splash" data-action="splash-continue" role="button" tabindex="0" aria-label="Continue to BillNest"><div class="brand-mark">' + icon("receipt", 48) + '</div><h1>BillNest</h1><p class="subtitle">Household Bill &amp; Expense Tracker</p><p class="tagline">Track • Save • Live Better</p><div class="splash-bottom"><div class="loading-dots"><i></i><i></i><i></i></div><div class="splash-hint">Tap to continue</div></div></section>';
  }
  function modalMarkup() {
    if (!modal) return "";
    return '<div class="modal-backdrop" data-action="close-modal"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><h2 id="modal-title">' + escapeHtml(modal.title) + '</h2><p>' + escapeHtml(modal.message) + '</p><div class="button-row"><button class="secondary-button" data-action="close-modal"' + (modal.safeDefault ? ' autofocus' : '') + '>Cancel</button><button class="' + (modal.danger ? "danger-button" : "primary-button") + '" data-action="confirm-modal">' + escapeHtml(modal.confirmText || "Confirm") + '</button></div></section></div>';
  }
  function render() {
    const views = {
      splash: splash,
      dashboard: dashboard,
      bills: billsScreen,
      "bill-details": billDetails,
      "add-bill": function () { return formScreen("bill", false); },
      "edit-bill": function () { return formScreen("bill", true); },
      "expense-details": expenseDetails,
      "add-expense": function () { return formScreen("expense", false); },
      "edit-expense": function () { return formScreen("expense", true); },
      "category-overview": categoryOverview,
      insights: insights,
      history: history,
      "transaction-details": transactionDetails,
      "expense-transaction-details": expenseTransactionDetails,
      notifications: notifications
    };
    app.innerHTML = (views[screen] || dashboard)() + modalMarkup();
    if (modal && modal.safeDefault) {
      const cancelButton = app.querySelector('[data-action="close-modal"]');
      if (cancelButton) cancelButton.focus();
    }
  }
  function addTransaction(record, type) {
    const existing = state.transactions.find(function (txn) { return type === "bill" ? txn.billId === record.id : txn.expenseId === record.id; });
    const txn = {
      id: existing ? existing.id : uid("txn"),
      billId: type === "bill" ? record.id : undefined,
      expenseId: type === "expense" ? record.id : undefined,
      name: record.name,
      category: record.category,
      amount: Number(record.amount),
      date: type === "bill" ? (validIsoDate(record.paidDate) ? record.paidDate : record.dueDate) : record.date,
      description: record.description || "",
      status: type === "bill" ? "Paid" : "Completed"
    };
    if (existing) Object.assign(existing, txn);
    else state.transactions.unshift(txn);
  }
  function removeTransactions(recordId, type) {
    state.transactions = state.transactions.filter(function (txn) { return type === "bill" ? txn.billId !== recordId : txn.expenseId !== recordId; });
  }
  function reconcileNotifications(data) {
    data.notifications = data.notifications.filter(function (notice) {
      if (!notice.recordId) return true;
      return notice.type === "bill"
        ? data.bills.some(function (bill) { return bill.id === notice.recordId; })
        : data.expenses.some(function (expense) { return expense.id === notice.recordId; });
    });
    data.notifications.forEach(function (notice) {
      if (!notice.recordId) return;
      if (notice.type === "bill") {
        const bill = data.bills.find(function (item) { return item.id === notice.recordId; });
        if (!bill) return;
        if (bill.paid) {
          notice.title = bill.name + " payment recorded";
          notice.message = money(bill.amount) + " was recorded as paid.";
        } else {
          notice.title = bill.name + " bill reminder";
          notice.message = "Your " + money(bill.amount) + " " + bill.name + " bill is due " + fmtDate(bill.dueDate) + ".";
        }
      } else {
        const expense = data.expenses.find(function (item) { return item.id === notice.recordId; });
        if (expense) {
          notice.title = expense.name + " expense";
          notice.message = money(expense.amount) + " was recorded on " + fmtDate(expense.date) + ".";
        }
      }
    });
  }
  function syncRecordNotification(record, type) {
    if (!record || !record.id) return;
    const notice = state.notifications.find(function (item) { return item.recordId === record.id && item.type === type; });
    if (type === "bill") {
      if (record.paid) {
        if (notice) {
          notice.title = record.name + " payment recorded";
          notice.message = money(record.amount) + " was recorded as paid.";
        }
      } else {
        if (notice) {
          notice.title = record.name + " bill reminder";
          notice.message = "Your " + money(record.amount) + " " + record.name + " bill is due " + fmtDate(record.dueDate) + ".";
          notice.date = record.dueDate;
        }
      }
    } else {
      if (notice) {
        notice.title = record.name + " expense";
        notice.message = money(record.amount) + " was recorded on " + fmtDate(record.date) + ".";
        notice.date = record.date;
      }
    }
  }
  function requestDelete(type) {
    const item = byId(type === "bill" ? state.bills : state.expenses, type === "bill" ? selectedBillId : selectedExpenseId);
    if (!item) return;
    modal = {
      title: "Delete " + type + "?",
      message: "“" + item.name + "” will be removed from this device. This action cannot be undone.",
      confirmText: "Delete",
      danger: true,
      onConfirm: function () {
        state.notifications = state.notifications.filter(function (notice) { return notice.recordId !== item.id; });
        if (type === "bill") {
          state.bills = state.bills.filter(function (record) { return record.id !== item.id; });
          removeTransactions(item.id, "bill");
          screen = returnTo === "bills" || returnTo === "history" ? returnTo : "dashboard";
        } else {
          state.expenses = state.expenses.filter(function (record) { return record.id !== item.id; });
          removeTransactions(item.id, "expense");
          screen = returnTo === "history" ? "history" : "dashboard";
        }
        save(); modal = null; render(); showToast((type === "bill" ? "Bill" : "Expense") + " deleted.");
      }
    };
    render();
  }
  function handleAction(button) {
    const action = button.dataset.action;
    if (!action) return;
    if (action === "previous-month") { selectedMonth = shiftMonth(selectedMonth, -1); render(); return; }
    if (action === "next-month") { selectedMonth = shiftMonth(selectedMonth, 1); render(); return; }
    if (action === "current-month") { selectedMonth = monthKey(new Date()); render(); return; }
    if (action === "back") return goBack();
    if (action === "splash-continue") { screen = "dashboard"; render(); return; }
    if (action === "navigate") return route(button.dataset.screen);
    if (action === "start-add-bill") { returnTo = screen; selectedBillId = null; screen = "add-bill"; render(); return; }
    if (action === "start-add-expense") { returnTo = screen; selectedExpenseId = null; screen = "add-expense"; render(); return; }
    if (action === "open-bill") { selectedBillId = button.dataset.id; returnTo = screen; screen = "bill-details"; render(); return; }
    if (action === "open-expense") { selectedExpenseId = button.dataset.id; returnTo = screen; screen = "expense-details"; render(); return; }
    if (action === "open-category-overview") { selectedExpenseCategory = button.dataset.category || selectedExpenseCategory; returnTo = screen; screen = "category-overview"; render(); return; }
    if (action === "select-category") { selectedExpenseCategory = button.dataset.category || "Shopping"; render(); return; }
    if (action === "edit-bill") { screen = "edit-bill"; render(); return; }
    if (action === "edit-expense") { screen = "edit-expense"; render(); return; }
    if (action === "cancel-form") return goBack();
    if (action === "open-history") { previousScreen = screen; transactionSearch = ""; transactionFilter = "All"; transactionCategoryFilter = "All"; screen = "history"; render(); return; }
    if (action === "open-transaction") {
      selectedTransactionId = button.dataset.id;
      transactionReturnScreen = screen;
      const transaction = byId(state.transactions, selectedTransactionId);
      screen = transaction && transaction.expenseId ? "expense-transaction-details" : "transaction-details";
      render(); return;
    }
    if (action === "open-unpaid-bill") { selectedBillId = button.dataset.id; returnTo = screen; screen = "bill-details"; render(); return; }
    if (action === "open-related-expense") { selectedExpenseId = button.dataset.id; returnTo = screen; screen = "expense-details"; render(); return; }
    if (action === "edit-related-expense") {
      if (!byId(state.expenses, button.dataset.id)) return;
      selectedExpenseId = button.dataset.id;
      returnTo = screen;
      screen = "edit-expense";
      render(); return;
    }
    if (action === "open-related-bill") { selectedBillId = button.dataset.id; returnTo = screen; screen = "bill-details"; render(); return; }
    if (action === "open-notification") {
      if (button.dataset.type === "bill") { selectedBillId = button.dataset.id; returnTo = screen; screen = "bill-details"; }
      else { selectedExpenseId = button.dataset.id; returnTo = screen; screen = "expense-details"; }
      render(); return;
    }
    if (action === "filter-transactions") { transactionFilter = button.dataset.filter; render(); return; }
    if (action === "filter-transaction-category") { transactionCategoryFilter = button.dataset.category || "All"; render(); return; }
    if (action === "filter-bills") { billFilter = button.dataset.filter; render(); return; }
    if (action === "done") { screen = transactionReturnScreen || "history"; render(); return; }
    if (action === "reset-notifications") {
      modal = {
        title: "Clear all notifications?",
        message: "All current notifications will be removed from this device.",
        confirmText: "Clear all",
        danger: true,
        onConfirm: function () {
          const previousNotifications = state.notifications;
          state.notifications = [];
          const saved = save();
          if (!saved) state.notifications = previousNotifications;
          modal = null;
          render();
          if (saved) showToast("Notifications cleared.");
        }
      };
      render(); return;
    }
    if (action === "reset-prototype-data") {
      modal = {
        title: "Reset prototype data?",
        message: "All locally stored bills, expenses, transactions, and notifications will be replaced with the initial demo data. Your current data will be backed up first.",
        confirmText: "Reset prototype data",
        danger: true,
        safeDefault: true,
        onConfirm: resetPrototypeData
      };
      render(); return;
    }
    if (action === "restore-prototype-backup") {
      modal = {
        title: "Restore previous data?",
        message: "This will replace the current bills, expenses, transactions, and notifications with the data saved in your last prototype reset backup.",
        confirmText: "Restore previous data",
        danger: true,
        safeDefault: true,
        onConfirm: restorePrototypeBackup
      };
      render(); return;
    }
    if (action === "confirm-delete-bill") return requestDelete("bill");
    if (action === "confirm-delete-expense") return requestDelete("expense");
    if (action === "mark-paid" || action === "mark-unpaid") {
      const bill = byId(state.bills, selectedBillId);
      if (!bill) return;
      bill.paid = action === "mark-paid";
      if (bill.paid) {
        const paymentDate = localDateIso(new Date());
        bill.paidDate = paymentDate;
        bill.paymentHistory = Array.isArray(bill.paymentHistory) ? bill.paymentHistory : [];
        if (!bill.paymentHistory.some(function (payment) { return payment.source === "marked-paid" && payment.date === paymentDate && Number(payment.amount) === Number(bill.amount); })) {
          bill.paymentHistory.push({ date: paymentDate, amount: Number(bill.amount), source: "marked-paid" });
        }
        addTransaction(bill, "bill");
      } else {
        bill.paidDate = null;
        bill.paymentHistory = Array.isArray(bill.paymentHistory) ? bill.paymentHistory.filter(function (payment) { return payment.source !== "marked-paid"; }) : [];
        removeTransactions(bill.id, "bill");
      }
      syncRecordNotification(bill, "bill");
      save(); render(); showToast(bill.paid ? "Bill marked as paid." : "Bill marked as unpaid."); return;
    }
    if (action === "bill-menu") {
      modal = { title: "Bill options", message: "Choose an action below or tap Cancel to close.", confirmText: "Edit bill", onConfirm: function () { modal = null; screen = "edit-bill"; render(); } };
      render(); return;
    }
    if (action === "close-modal") { modal = null; render(); return; }
    if (action === "confirm-modal") {
      const callback = modal && modal.onConfirm;
      if (callback) callback(); else { modal = null; render(); }
    }
  }
  app.addEventListener("click", function (event) {
    const target = event.target.closest("[data-action]");
    if (!target) return;
    if (target.classList.contains("modal-backdrop") && event.target !== target) return;
    handleAction(target);
  });
  app.addEventListener("keydown", function (event) {
    const target = event.target.closest('[data-action="splash-continue"]');
    if (target && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); screen = "dashboard"; render(); }
  });
  app.addEventListener("input", function (event) {
    if (event.target.matches('[data-action="search-transactions"]')) {
      const position = event.target.selectionStart;
      transactionSearch = event.target.value;
      const scrollTop = app.querySelector(".screen-content").scrollTop;
      render();
      const input = app.querySelector('[data-action="search-transactions"]');
      input.focus(); input.setSelectionRange(position, position);
      app.querySelector(".screen-content").scrollTop = scrollTop;
    }
  });
  app.addEventListener("submit", function (event) {
    if (event.target.id !== "record-form") return;
    event.preventDefault();
    const form = event.target;
    const errorNode = form.querySelector(".form-error");
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const kind = form.dataset.kind;
    const editing = form.dataset.editing === "true";
    const record = {
      name: String(formData.get("name")).trim(),
      amount: Number(formData.get("amount")),
      category: String(formData.get("category")),
      description: String(formData.get("description") || "").trim(),
      ...(kind === "bill" ? {
        dueDate: String(formData.get("date")),
        provider: String(formData.get("provider") || "").trim(),
        paid: String(formData.get("status") || "Unpaid") === "Paid"
      } : { date: String(formData.get("date")) })
    };
    if (!record.name || !Number.isFinite(record.amount) || record.amount <= 0 || !formData.get("date")) {
      errorNode.textContent = "Enter a name, a valid amount, and a date.";
      errorNode.classList.add("visible");
      return;
    }
    const list = kind === "bill" ? state.bills : state.expenses;
    const id = editing ? (kind === "bill" ? selectedBillId : selectedExpenseId) : null;
    const existing = id ? byId(list, id) : null;
    if (existing) {
      const wasPaid = kind === "bill" ? existing.paid === true : false;
      Object.assign(existing, record);
      if (kind === "expense") {
        state.transactions.filter(function (txn) { return txn.expenseId === existing.id; }).forEach(function (txn) { Object.assign(txn, { name: record.name, amount: record.amount, category: record.category, date: record.date, description: record.description }); });
        syncRecordNotification(existing, "expense");
      } else {
        existing.paymentHistory = Array.isArray(existing.paymentHistory) ? existing.paymentHistory : [];
        if (existing.paid && wasPaid) {
          const paymentDate = localDateIso(new Date());
          existing.paidDate = validIsoDate(existing.paidDate) ? existing.paidDate : paymentDate;
        } else if (existing.paid && !wasPaid) {
          existing.paidDate = localDateIso(new Date());
          if (!existing.paymentHistory.some(function (payment) { return payment.source === "marked-paid" && payment.date === existing.paidDate && Number(payment.amount) === Number(existing.amount); })) {
            existing.paymentHistory.push({ date: existing.paidDate, amount: Number(existing.amount), source: "marked-paid" });
          }
          addTransaction(existing, "bill");
        } else if (!existing.paid && wasPaid) {
          existing.paidDate = null;
          existing.paymentHistory = existing.paymentHistory.filter(function (payment) { return payment.source !== "marked-paid"; });
          removeTransactions(existing.id, "bill");
        }
        if (existing.paid) addTransaction(existing, "bill");
        else removeTransactions(existing.id, "bill");
        syncRecordNotification(existing, "bill");
      }
    } else {
      record.id = uid(kind);
      if (kind === "bill") {
        record.paid = record.paid === true;
        record.paymentHistory = Array.isArray(record.paymentHistory) ? record.paymentHistory : [];
        record.provider = String(record.provider || "").trim();
        if (record.paid) {
          record.paidDate = localDateIso(new Date());
          record.paymentHistory.push({ date: record.paidDate, amount: Number(record.amount), source: "marked-paid" });
        } else {
          record.paidDate = null;
        }
      }
      list.unshift(record);
      if (kind === "expense") addTransaction(record, "expense");
      if (kind === "bill") {
        if (record.paid) addTransaction(record, "bill");
        selectedBillId = record.id;
      }
      else selectedExpenseId = record.id;
    }
    save();
    screen = kind === "bill" ? "bill-details" : "expense-details";
    render();
    showToast(editing ? "Changes saved." : (kind === "bill" ? "Bill added." : "Expense added."));
  });
  render();
})();
