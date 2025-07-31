// Initial quotes array
let quotes = [];
let filtered = [];

// Get DOM elements
const quoteDisplay = document.getElementById('quoteDisplay');
const categoryFilter = document.getElementById('categoryFilter');
const categorySelect = document.getElementById('categorySelect');
const addQuoteFormDiv = document.getElementById('addQuoteForm');

// Get unique categories from quotes
function getCategories() {
  const categories = new Set(quotes.map(q => q.category));
  return Array.from(categories);
}

// Populate both category dropdowns
function populateCategories() {
  // For filter dropdown
  categoryFilter.innerHTML = '<option value="all">All Categories</option>';
  getCategories().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categoryFilter.appendChild(opt);
  });

  // For add/select dropdown
  categorySelect.innerHTML = '';
  getCategories().forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });

  // Restore last filter from localStorage
  const lastFilter = localStorage.getItem('lastCategoryFilter');
  if (lastFilter) categoryFilter.value = lastFilter;
  filterQuotes();
}

// Filter quotes based on selected category
function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem('lastCategoryFilter', selected);
  if (selected === 'all') {
    filtered = quotes;
  } else {
    filtered = quotes.filter(q => q.category === selected);
  }
  showRandomQuote();
}

// Show a random quote from filtered list
function showRandomQuote() {
  if (!filtered || filtered.length === 0) {
    quoteDisplay.textContent = 'No quotes available for this category.';
    return;
  }
  const random = filtered[Math.floor(Math.random() * filtered.length)];
  quoteDisplay.textContent = `"${random.text}" — ${random.category}`;
  saveLastViewedQuote(random); // Save to sessionStorage
}

// Create and display the add quote form
function createAddQuoteForm() {
  addQuoteFormDiv.innerHTML = '';
  const form = document.createElement('form');
  form.onsubmit = function(e) {
    e.preventDefault();
    addQuote();
  };

  const quoteInput = document.createElement('input');
  quoteInput.type = 'text';
  quoteInput.id = 'newQuoteText';
  quoteInput.placeholder = 'Enter a new quote';
  quoteInput.required = true;

  const categoryInput = document.createElement('input');
  categoryInput.type = 'text';
  categoryInput.id = 'newQuoteCategory';
  categoryInput.placeholder = 'Enter quote category';
  categoryInput.required = true;

  const addBtn = document.createElement('button');
  addBtn.type = 'submit';
  addBtn.textContent = 'Add Quote';

  form.appendChild(quoteInput);
  form.appendChild(categoryInput);
  form.appendChild(addBtn);

  addQuoteFormDiv.appendChild(form);
}

// Add a new quote from form input
function addQuote() {
  const text = document.getElementById('newQuoteText').value.trim();
  const category = document.getElementById('newQuoteCategory').value.trim();
  if (text && category) {
    quotes.push({ text, category });
    saveQuotes(); // Save to localStorage
    populateCategories();
    categorySelect.value = category;
    filterQuotes();
    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';
  }
}

// --- Web Storage & JSON Handling additions ---

// Load quotes from localStorage if available
function loadQuotes() {
  const stored = localStorage.getItem('quotes');
  if (stored) {
    try {
      quotes = JSON.parse(stored);
    } catch (e) {
      quotes = [];
    }
  }
}

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Save last viewed quote to sessionStorage
function saveLastViewedQuote(quote) {
  sessionStorage.setItem('lastViewedQuote', JSON.stringify(quote));
}

// Export quotes to JSON file
function exportQuotesToJson() {
  const dataStr = JSON.stringify(quotes, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        filterQuotes();
        alert('Quotes imported successfully!');
      } else {
        alert('Invalid JSON format.');
      }
    } catch {
      alert('Error reading JSON file.');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// --- Server Sync Simulation ---

const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts'; // Example endpoint

// Simulate fetching quotes from server
async function fetchQuotesFromServer() {
  try {
    // Replace with your real API if available
    const response = await fetch(SERVER_URL);
    const serverData = await response.json();
    // Simulate server quotes structure
    const serverQuotes = serverData.map(post => ({
      text: post.title,
      category: post.body ? post.body.split(' ')[0] : 'General'
    }));
    resolveConflicts(serverQuotes);
  } catch (err) {
    notifyUser('Failed to sync with server.');
  }
}

// Simulate posting local quotes to server
async function postQuotesToServer() {
  try {
    await fetch(SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(quotes)
    });
    notifyUser('Local quotes synced to server.');
  } catch (err) {
    notifyUser('Failed to post quotes to server.');
  }
}

// Conflict resolution: server data takes precedence
function resolveConflicts(serverQuotes) {
  let conflicts = false;
  // If server quotes differ, replace local and notify
  if (JSON.stringify(serverQuotes) !== JSON.stringify(quotes)) {
    quotes = serverQuotes;
    saveQuotes();
    populateCategories();
    filterQuotes();
    conflicts = true;
  }
  if (conflicts) {
    notifyUser('Quotes updated from server (server data used).');
  }
}

// Notification UI
function notifyUser(message) {
  let note = document.getElementById('syncNotification');
  if (!note) {
    note = document.createElement('div');
    note.id = 'syncNotification';
    note.style.background = '#ffeeba';
    note.style.border = '1px solid #ffc107';
    note.style.padding = '8px';
    note.style.margin = '10px 0';
    document.body.insertBefore(note, document.body.firstChild);
  }
  note.textContent = message;
  setTimeout(() => { note.textContent = ''; }, 4000);
}

// Periodic sync (every 30 seconds)
setInterval(fetchQuotesFromServer, 30000);

// Manual sync button (optional)
const manualSyncBtn = document.createElement('button');
manualSyncBtn.textContent = 'syncQuotes';
manualSyncBtn.onclick = fetchQuotesFromServer;
document.body.insertBefore(manualSyncBtn, document.body.firstChild);

// --- Initial setup ---
loadQuotes();
populateCategories();
createAddQuoteForm();

document.getElementById('importFile').onchange = importFromJsonFile;
document.getElementById('exportQuotesBtn').onclick = exportQuotesToJson;
categoryFilter.onchange = filterQuotes;