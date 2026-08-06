// ---- Auth Check ----
if (!window.location.href.includes('login.html') && sessionStorage.getItem('loggedIn') !== 'true') {
  window.location.href = 'login.html';
}

// ---- Toggle between login and signup ----
const showSignup = document.getElementById('showSignup');
const showLogin = document.getElementById('showLogin');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

if (showSignup) {
  showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
  });
}
if (showLogin) {
  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });
}

// ---- Live character-blocking validation ----
// Only letters and spaces allowed (name fields)
function restrictToLetters(input) {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/[^a-zA-Z\s]/g, '');
  });
}

// Only digits allowed (phone / register number fields)
function restrictToDigits(input) {
  input.addEventListener('input', () => {
    input.value = input.value.replace(/[^0-9]/g, '');
  });
}

// Apply restrictions where these elements exist on the page
const nameFields = ['fullName', 'pName'];
nameFields.forEach(id => {
  const el = document.getElementById(id);
  if (el) restrictToLetters(el);
});

const phoneField = document.getElementById('phone');
if (phoneField) restrictToDigits(phoneField);

const regNoField = document.getElementById('regNo');
if (regNoField) {
  // Register number: letters + digits only, no symbols/spaces
  regNoField.addEventListener('input', () => {
    regNoField.value = regNoField.value.replace(/[^a-zA-Z0-9]/g, '');
  });
}

// ---- Show "please fill this field" + reject bad format on submit ----
function showError(inputId, errorId, message) {
  document.getElementById(errorId).textContent = message;
}

function clearError(errorId) {
  document.getElementById(errorId).textContent = '';
}

function validateForm(form, fields) {
  let valid = true;
  fields.forEach(({ inputId, errorId, pattern, emptyMsg, invalidMsg }) => {
    const input = document.getElementById(inputId);
    if (!input) return;
    const value = input.value.trim();
    if (value === '') {
      showError(inputId, errorId, emptyMsg);
      valid = false;
    } else if (pattern && !pattern.test(value)) {
      showError(inputId, errorId, invalidMsg);
      valid = false;
    } else {
      clearError(errorId);
    }
  });
  return valid;
}

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = validateForm(loginForm, [
      { inputId: 'loginEmail', errorId: 'loginEmailError',
        pattern: /^[^\s@]+@(student\.)?tce\.edu$/,
        emptyMsg: 'Please fill this field.',
        invalidMsg: 'Please enter a valid tce.edu email address.' },
      { inputId: 'loginPassword', errorId: 'loginPasswordError',
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
        emptyMsg: 'Please fill this field.',
        invalidMsg: 'Password must be 8+ chars with uppercase, lowercase, number, and special character.' }
    ]);
    if (ok) {
      alert('Login successful! Redirecting...');
      sessionStorage.setItem('loggedIn', 'true');
      window.location.href = 'index.html';
    }
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = validateForm(signupForm, [
      { inputId: 'fullName', errorId: 'fullNameError',
        pattern: /^[a-zA-Z\s]{2,}$/,
        emptyMsg: 'Please fill this field.',
        invalidMsg: 'Only letters and spaces are allowed.' },
      { inputId: 'signupEmail', errorId: 'signupEmailError',
        pattern: /^[^\s@]+@(student\.)?tce\.edu$/,
        emptyMsg: 'Please fill this field.',
        invalidMsg: 'Please enter a valid tce.edu email address.' },
      { inputId: 'regNo', errorId: 'regNoError',
        pattern: /^[a-zA-Z0-9]{5,}$/,
        emptyMsg: 'Please fill this field.',
        invalidMsg: 'Register number must be letters/digits only.' },
      { inputId: 'phone', errorId: 'phoneError',
        pattern: /^[0-9]{10}$/,
        emptyMsg: 'Please fill this field.',
        invalidMsg: 'Phone number must be exactly 10 digits.' },
      { inputId: 'signupPassword', errorId: 'signupPasswordError',
        pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/,
        emptyMsg: 'Please fill this field.',
        invalidMsg: 'Password must be 8+ chars with uppercase, lowercase, number, and special character.' }
    ]);
    if (ok) {
      alert('Account created! Redirecting...');
      sessionStorage.setItem('loggedIn', 'true');
      window.location.href = 'index.html';
    }
  });
}

if (document.getElementById('profileForm')) {
  document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = validateForm(document.getElementById('profileForm'), [
      { inputId: 'pName', errorId: 'pNameError',
        pattern: /^[a-zA-Z\s]{2,}$/,
        emptyMsg: 'Please fill this field.',
        invalidMsg: 'Only letters and spaces are allowed.' }
    ]);
    if (ok) alert('Profile updated! (demo)');
  });
}

// ---- Notifications: mark all as read ----
const markAllBtn = document.getElementById('markAllRead');
if (markAllBtn) {
  markAllBtn.addEventListener('click', () => {
    document.querySelectorAll('.notif-item.unread').forEach(item => {
      item.classList.remove('unread');
    });
  });
}

// ---- Manage Applicants: accept/reject ----
document.querySelectorAll('.btn-accept, .btn-reject').forEach(btn => {
  btn.addEventListener('click', () => {
    const row = btn.closest('.applicant-row');
    if (row) {
      row.style.transition = 'opacity 0.3s ease';
      row.style.opacity = '0';
      setTimeout(() => row.remove(), 300);
    }
  });
});

// ---- Create Listing: team size stepper ----
const teamCountEl = document.getElementById('teamCount');
const decreaseBtn = document.getElementById('decreaseTeam');
const increaseBtn = document.getElementById('increaseTeam');
let teamCount = 2;
if (decreaseBtn && increaseBtn) {
  decreaseBtn.addEventListener('click', () => {
    if (teamCount > 1) { teamCount--; teamCountEl.textContent = teamCount; }
  });
  increaseBtn.addEventListener('click', () => {
    if (teamCount < 10) { teamCount++; teamCountEl.textContent = teamCount; }
  });
}

// ---- Create Listing: validation ----
const listingForm = document.getElementById('listingForm');
if (listingForm) {
  listingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = validateForm(listingForm, [
      { inputId: 'listingTitle', errorId: 'listingTitleError',
        pattern: /^.{3,}$/,
        emptyMsg: 'Please fill this field.',
        invalidMsg: 'Title must be at least 3 characters.' },
      { inputId: 'listingDesc', errorId: 'listingDescError',
        pattern: /^.{10,}$/,
        emptyMsg: 'Please fill this field.',
        invalidMsg: 'Description must be at least 10 characters.' },
      { inputId: 'listingDeadline', errorId: 'listingDeadlineError',
        pattern: null,
        emptyMsg: 'Please select a deadline.',
        invalidMsg: '' }
    ]);
    if (ok) alert('Listing published! (demo)');
  });
}

// ---- Forum post validation ----
const forumPostForm = document.getElementById('forumPostForm');
if (forumPostForm) {
  forumPostForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = validateForm(forumPostForm, [
      { inputId: 'postTitle', errorId: 'postTitleError',
        pattern: /^[a-zA-Z0-9\s.,'?!-]{5,}$/,
        emptyMsg: 'Please fill this field.',
        invalidMsg: 'Only letters, numbers and basic punctuation allowed.' },
      { inputId: 'postBody', errorId: 'postBodyError',
        pattern: /^.{10,}$/,
        emptyMsg: 'Please fill this field.',
        invalidMsg: 'Please write at least 10 characters.' }
    ]);
    if (ok) alert('Posted to forum! (demo)');
  });
}

// ---- My Interests: tab filtering ----
const tabButtons = document.querySelectorAll('.tab-btn');
const interestRows = document.querySelectorAll('.interest-row');
tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    tabButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    interestRows.forEach(row => {
      if (filter === 'all' || row.dataset.status === filter) {
        row.style.display = 'flex';
      } else {
        row.style.display = 'none';
      }
    });
  });
});

// ---- Logout Logic ----
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('loggedIn');
    window.location.href = 'login.html';
  });
}

// ---- Browse Filtering Logic ----
const searchBtn = document.getElementById('searchBtn');
const deptFilter = document.getElementById('deptFilter');
const yearFilter = document.getElementById('yearFilter');
const searchInput = document.getElementById('searchInput');

if (searchBtn) {
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.toLowerCase();
    const dept = deptFilter.value;
    const year = yearFilter.value;

    document.querySelectorAll('.listing-card').forEach(card => {
      const textContent = card.textContent.toLowerCase();
      
      let matchQuery = true;
      if (query) {
        matchQuery = textContent.includes(query);
      }
      
      let matchDept = true;
      if (dept !== 'All Departments') {
        const deptLabel = card.querySelector('.dept-label');
        if (deptLabel) {
          matchDept = deptLabel.textContent.includes(dept.replace(' Dept', ''));
        }
      }

      // Hide or show based on matches
      if (matchQuery && matchDept) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });
}
