/* ============================================================
   GlicoLog — login.js
   Validação e comportamento da tela de login
   ============================================================ */

const emailInput  = document.getElementById('login-email');
const senhaInput  = document.getElementById('login-senha');
const btnLogin    = document.getElementById('btn-login');
const toast       = document.getElementById('login-toast');

const errEmail = document.getElementById('err-login-email');
const errSenha = document.getElementById('err-login-senha');

/* --- Utilitários --- */
function isEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setErro(input, errEl, mostrar) {
  input.classList.toggle('error', mostrar);
  errEl.classList.toggle('show', mostrar);
}

function mostrarToast(mensagem, tipo) {
  toast.textContent = mensagem;
  toast.className = 'toast ' + tipo;
}

function limparToast() {
  toast.className = 'toast';
  toast.textContent = '';
}

/* --- Validação em tempo real --- */
emailInput.addEventListener('input', () => {
  if (emailInput.value.trim()) {
    setErro(emailInput, errEmail, !isEmailValido(emailInput.value.trim()));
  }
});

senhaInput.addEventListener('input', () => {
  if (senhaInput.value) {
    setErro(senhaInput, errSenha, false);
  }
});

/* --- Submit --- */
btnLogin.addEventListener('click', () => {
  limparToast();

  const email = emailInput.value.trim();
  const senha = senhaInput.value;

  const emailOk = isEmailValido(email);
  const senhaOk = senha.length > 0;

  setErro(emailInput, errEmail, !emailOk);
  setErro(senhaInput, errSenha, !senhaOk);

  if (!emailOk || !senhaOk) return;

  /* Aqui você conectará à autenticação real futuramente */
  mostrarToast('✓ Login realizado com sucesso!', 'success');

  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 1200);
});