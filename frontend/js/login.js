/* ============================================================
   GlicoLog — login.js
   Login, validação e acessibilidade
   ============================================================ */

const loginForm = document.getElementById("login-form");

const emailInput = document.getElementById("login-email");
const senhaInput = document.getElementById("login-senha");
const btnLogin = document.getElementById("btn-login");

const toast = document.getElementById("login-toast");
const errEmail = document.getElementById("err-login-email");
const errSenha = document.getElementById("err-login-senha");

let loginEmAndamento = false;


/* ============================================================
   Utilitários
   ============================================================ */

function isEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


function setErro(input, errEl, mostrar) {
  input.classList.toggle("error", mostrar);
  errEl.classList.toggle("show", mostrar);

  input.setAttribute(
    "aria-invalid",
    mostrar ? "true" : "false"
  );
}


function mostrarToast(mensagem, tipo) {
  toast.textContent = mensagem;
  toast.className = "toast " + tipo;
}


function limparToast() {
  toast.className = "toast";
  toast.textContent = "";
}


function definirEstadoCarregamento(carregando) {
  loginEmAndamento = carregando;
  btnLogin.disabled = carregando;
  btnLogin.setAttribute(
    "aria-busy",
    carregando ? "true" : "false"
  );

  btnLogin.textContent =
    carregando ? "Entrando..." : "Entrar";
}


/* ============================================================
   Validação em tempo real
   ============================================================ */

emailInput.addEventListener("input", function () {
  const email = emailInput.value.trim();

  setErro(
    emailInput,
    errEmail,
    email.length > 0 && !isEmailValido(email)
  );
});


senhaInput.addEventListener("input", function () {
  if (senhaInput.value) {
    setErro(senhaInput, errSenha, false);
  }
});


/* ============================================================
   Login pelo submit do formulário
   Funciona com clique e com a tecla Enter
   ============================================================ */

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (loginEmAndamento) {
    return;
  }

  limparToast();

  const email = emailInput.value.trim();
  const senha = senhaInput.value;

  const emailOk = isEmailValido(email);
  const senhaOk = senha.length > 0;

  setErro(emailInput, errEmail, !emailOk);
  setErro(senhaInput, errSenha, !senhaOk);

  if (!emailOk || !senhaOk) {
    mostrarToast(
      "Verifique os campos destacados.",
      "error"
    );

    if (!emailOk) {
      emailInput.focus();
    } else {
      senhaInput.focus();
    }

    return;
  }

  definirEstadoCarregamento(true);

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: email,
        password: senha
      })
    });

    localStorage.setItem("token", data.token);

    if (data.user) {
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );
    }

    mostrarToast(
      "✓ Login realizado com sucesso!",
      "success"
    );

    window.setTimeout(function () {
      window.location.href = "dashboard.html";
    }, 1000);

  } catch (error) {
    console.error("Erro no login:", error);

    mostrarToast(
      error.message || "E-mail ou senha incorretos.",
      "error"
    );

    senhaInput.focus();
    senhaInput.select();

  } finally {
    definirEstadoCarregamento(false);
  }
});