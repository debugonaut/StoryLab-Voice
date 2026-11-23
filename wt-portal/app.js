let calcCurrentDisplay = '0';
let calcOperationHistory = '';
let isNewNumber = true;

function updateCalcScreen() {
  document.getElementById('calc-screen').textContent = calcCurrentDisplay;
  document.getElementById('calc-history').textContent = calcOperationHistory;
}

function calcNumber(digit) {
  if (isNewNumber || calcCurrentDisplay === '0' || calcCurrentDisplay === 'Error') {
    calcCurrentDisplay = String(digit);
    isNewNumber = false;
  } else {
    if (digit === '.' && calcCurrentDisplay.includes('.')) return;
    calcCurrentDisplay += digit;
  }
  updateCalcScreen();
}

function calcOperator(op) {
  calcOperationHistory = `${calcCurrentDisplay} ${op} `;
  isNewNumber = true;
  updateCalcScreen();
}

function calcClear() {
  calcCurrentDisplay = '0';
  calcOperationHistory = '';
  isNewNumber = true;
  updateCalcScreen();
}

function calcBackspace() {
  if (calcCurrentDisplay.length > 1 && calcCurrentDisplay !== 'Error') {
    calcCurrentDisplay = calcCurrentDisplay.slice(0, -1);
  } else {
    calcCurrentDisplay = '0';
    isNewNumber = true;
  }
  updateCalcScreen();
}

function calcEvaluate() {
  if (!calcOperationHistory) return;
  try {
    const expression = (calcOperationHistory + calcCurrentDisplay)
      .replace(/×/g, '*')
      .replace(/÷/g, '/');
    
    if (!/^[0-9+\-*/. %()]+$/.test(expression)) {
      throw new Error('Invalid calculation characters');
    }

    const result = Function('"use strict";return (' + expression + ')')();
    calcOperationHistory = `${calcOperationHistory}${calcCurrentDisplay} =`;
    calcCurrentDisplay = String(Number(result.toFixed(6)));
    isNewNumber = true;
  } catch (err) {
    calcCurrentDisplay = 'Error';
    calcOperationHistory = '';
    isNewNumber = true;
  }
  updateCalcScreen();
}

const chatHistoryArray = [
  {
    sender: 'system',
    text: 'Welcome to StoryLab AI Tutor! Speech simulation engine online.',
    time: '10:00 AM'
  },
  {
    sender: 'bot',
    text: 'Hello student! What would you like to explore today? Science experiment or Math story?',
    time: '10:01 AM'
  }
];

function renderChatMessages() {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  container.innerHTML = chatHistoryArray.map((msg) => {
    const isBot = msg.sender === 'bot' || msg.sender === 'system';
    return `
      <div class="d-flex flex-column ${isBot ? 'align-items-start' : 'align-items-end'} mb-2">
        <div class="p-2 rounded-3 text-break ${
          isBot ? 'bg-light border text-dark' : 'bg-success text-white'
        }" style="max-width: 80%;">
          <div class="small fw-bold opacity-75">${isBot ? 'AI Companion' : 'Student'}</div>
          <div>${escapeHTML(msg.text)}</div>
          <div class="text-end small opacity-75" style="font-size: 0.65rem;">${msg.time}</div>
        </div>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

function handleChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text) return;

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  chatHistoryArray.push({
    sender: 'user',
    text: text,
    time: now
  });

  input.value = '';
  renderChatMessages();

  setTimeout(() => {
    let reply = `That is an insightful query on "${text}". In our Science module, this is explained with voice simulation.`;
    if (text.toLowerCase().includes('titration') || text.toLowerCase().includes('lab')) {
      reply = 'In the virtual chemistry lab, check acid-base indicators before dispensing from the burette!';
    } else if (text.toLowerCase().includes('gravity') || text.toLowerCase().includes('physics')) {
      reply = 'Gravity accelerates falling objects at approximately 9.8 m/s² near Earth\'s surface.';
    }

    chatHistoryArray.push({
      sender: 'bot',
      text: reply,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    renderChatMessages();
  }, 600);
}

let studentDataStoreArray = [
  {
    prn: '202401100099',
    name: 'Pritam Tatkari',
    email: 'pritam.tatkari@mitaoe.ac.in',
    age: 14,
    grade: 'Grade 9'
  },
  {
    prn: '202401100090',
    name: 'Aadesh Khande',
    email: 'aadesh.khande@mitaoe.ac.in',
    age: 15,
    grade: 'Grade 10'
  },
  {
    prn: '202401100082',
    name: 'Ritesh Gavhane',
    email: 'ritesh.gavhane@mitaoe.ac.in',
    age: 14,
    grade: 'Grade 9'
  },
  {
    prn: '202401100109',
    name: 'Anurag Kumbhar',
    email: 'anurag.khande@mitaoe.ac.in',
    age: 15,
    grade: 'Grade 10'
  }
];

function renderStoreTable() {
  const tbody = document.getElementById('store-table-body');
  const countEl = document.getElementById('store-count');
  if (!tbody) return;

  if (studentDataStoreArray.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No records in in-memory JSON array store.</td></tr>`;
    if (countEl) countEl.textContent = 'Total Records: 0';
    return;
  }

  tbody.innerHTML = studentDataStoreArray.map((s, idx) => `
    <tr>
      <td><code>${s.prn}</code></td>
      <td><strong>${escapeHTML(s.name)}</strong></td>
      <td><small class="text-muted">${escapeHTML(s.email)}</small></td>
      <td><span class="badge bg-primary-subtle text-primary border border-primary-subtle">${s.grade} (Age ${s.age})</span></td>
      <td>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteFromStore(${idx})" title="Delete Record">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');

  if (countEl) countEl.textContent = `Total Records: ${studentDataStoreArray.length}`;
}

function handleStoreSubmit(e) {
  e.preventDefault();

  const prnInput = document.getElementById('store-prn');
  const nameInput = document.getElementById('store-name');
  const emailInput = document.getElementById('store-email');
  const ageInput = document.getElementById('store-age');
  const gradeInput = document.getElementById('store-grade');

  const prn = prnInput.value.trim();
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const age = Number(ageInput.value.trim());
  const grade = gradeInput.value;

  clearValidationErrors();

  const errors = {};

  if (!prn) {
    errors.prn = 'PRN is required.';
  } else if (!/^[0-9]{12}$/.test(prn)) {
    errors.prn = 'PRN must be exactly 12 numeric digits (e.g. 202401100099).';
  } else if (studentDataStoreArray.some((s) => s.prn === prn)) {
    errors.prn = `Student with PRN ${prn} already exists in store!`;
  }

  if (!name) {
    errors.name = 'Full name is required.';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (!/^[a-zA-Z\s.-]+$/.test(name)) {
    errors.name = 'Name contains invalid characters (letters only).';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!emailRegex.test(email)) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!ageInput.value.trim() || isNaN(age)) {
    errors.age = 'Age is required.';
  } else if (age < 5 || age > 18) {
    errors.age = 'Age must be between 5 and 18 years.';
  }

  if (Object.keys(errors).length > 0) {
    displayErrors(errors);
    return;
  }

  const newStudentObject = {
    prn,
    name,
    email,
    age,
    grade,
    addedAt: new Date().toISOString()
  };

  studentDataStoreArray.unshift(newStudentObject);
  renderStoreTable();

  showFormAlert('Validation Passed! Student saved to JSON Array Store.', 'success');

  prnInput.value = '';
  nameInput.value = '';
  emailInput.value = '';
  ageInput.value = '';
}

function displayErrors(errors) {
  if (errors.prn) {
    const el = document.getElementById('store-prn');
    el.classList.add('is-invalid');
    document.getElementById('prn-error').textContent = errors.prn;
  }
  if (errors.name) {
    const el = document.getElementById('store-name');
    el.classList.add('is-invalid');
    document.getElementById('name-error').textContent = errors.name;
  }
  if (errors.email) {
    const el = document.getElementById('store-email');
    el.classList.add('is-invalid');
    document.getElementById('email-error').textContent = errors.email;
  }
  if (errors.age) {
    const el = document.getElementById('store-age');
    el.classList.add('is-invalid');
    document.getElementById('age-error').textContent = errors.age;
  }

  showFormAlert('Validation Failed! Please fix the errors highlighted below before saving.', 'danger');
}

function clearValidationErrors() {
  ['store-prn', 'store-name', 'store-email', 'store-age'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('is-invalid');
  });
  const alertContainer = document.getElementById('form-alert-container');
  if (alertContainer) alertContainer.innerHTML = '';
}

function showFormAlert(message, type) {
  const alertContainer = document.getElementById('form-alert-container');
  if (!alertContainer) return;
  alertContainer.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      <i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'}-fill me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;
}

function deleteFromStore(index) {
  studentDataStoreArray.splice(index, 1);
  renderStoreTable();
}

function clearStore() {
  if (confirm('Clear all student records from the JSON store?')) {
    studentDataStoreArray = [];
    renderStoreTable();
  }
}

function exportStoreJSON() {
  const jsonStr = JSON.stringify(studentDataStoreArray, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `student_store_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', () => {
  renderChatMessages();
  renderStoreTable();
  updateCalcScreen();
});
