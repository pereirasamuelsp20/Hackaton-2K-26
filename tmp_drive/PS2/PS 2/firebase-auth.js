// WardWatch authorization helper: fixed hospital user set
const AUTH_USERS = {
  'siddhi@hospital.org': { password: 'siddhi', role: 'admin', name: 'Siddhi', title: 'Hospital Administrator' },
  'samuel@hospital.org': { password: 'samuel', role: 'doctor', name: 'Dr. Samuel', title: 'Attending Physician' },
  'ananya@hospital.org': { password: 'ananya', role: 'nurse', name: 'Nurse Ananya', title: 'Critical Care RN' },
  'aditya@hospital.org': { password: 'aditya', role: 'cleaner', name: 'EVS Tech Aditya', title: 'EVS Cleaner' }
};

function displayAuthError(message) {
  const errorNode = document.getElementById('auth-error');
  if (errorNode) {
    errorNode.textContent = message;
    errorNode.style.display = 'block';
  }
}

function clearAuthError() {
  const errorNode = document.getElementById('auth-error');
  if (errorNode) {
    errorNode.textContent = '';
    errorNode.style.display = 'none';
  }
}

function handleLogin(event) {
  event.preventDefault();
  clearAuthError();

  const emailInput = document.getElementById('auth-email');
  const passwordInput = document.getElementById('auth-password');
  const submitBtn = document.getElementById('auth-submit-btn');

  if (!emailInput || !passwordInput || !submitBtn) return;

  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    displayAuthError('Please enter both email and password.');
    return;
  }

  const user = AUTH_USERS[email];
  if (!user) {
    displayAuthError('Invalid email or password.');
    return;
  }

  if (password !== user.password) {
    displayAuthError('Invalid email or password.');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Signing in...';

  localStorage.setItem('wardwatch_role', user.role);
  localStorage.setItem('wardwatch_user_email', email);
  localStorage.setItem('wardwatch_user_name', user.name);
  localStorage.setItem('wardwatch_user_title', user.title);

  window.location.href = 'index.html';
}

function signOutAndRedirect() {
  localStorage.removeItem('wardwatch_role');
  localStorage.removeItem('wardwatch_user_email');
  localStorage.removeItem('wardwatch_user_name');
  localStorage.removeItem('wardwatch_user_title');
  window.location.href = 'login.html';
}

function initAuthRedirect() {
  const role = localStorage.getItem('wardwatch_role');
  const path = window.location.pathname.split('/').pop();
  const isLoginPage = path === 'login.html' || path === 'login' || path === '';
  const isHomePage = path === 'home.html';

  if (role) {
    if (isLoginPage) {
      window.location.href = 'index.html';
    }
  } else {
    if (!isLoginPage && !isHomePage) {
      window.location.href = 'login.html';
    }
  }
}

window.handleLogin = handleLogin;
window.signOutAndRedirect = signOutAndRedirect;
window.addEventListener('load', initAuthRedirect);
