/* ============================================================
   GlicoLog — cadastro.js
   Cadastro, validação e acessibilidade
   ============================================================ */

const cadastroForm = document.getElementById("cadastro-form");

const nomeInput = document.getElementById("cad-nome");
const emailInput = document.getElementById("cad-email");
const senhaInput = document.getElementById("cad-senha");
const confirmaInput = document.getElementById("cad-confirma");

const btnCadastro = document.getElementById("btn-cadastro");
const toast = document.getElementById("cad-toast");

const errNome = document.getElementById("err-cad-nome");
const errEmail = document.getElementById("err-cad-email");
const errSenha = document.getElementById("err-cad-senha");
const errConfirma = document.getElementById("err-cad-confirma");

const strengthLabel = document.getElementById("strength-label");

const strengthSegments = [
  document.getElementById("s1"),
  document.getElementById("s2"),
  document.getElementById("s3"),
  document.getElementById("s4")
];

let cadastroEmAndamento = false;


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
  cadastroEmAndamento = carregando;
  btnCadastro.disabled = carregando;

  btnCadastro.setAttribute(
    "aria-busy",
    carregando ? "true" : "false"
  );

  btnCadastro.textContent =
    carregando ? "Criando conta..." : "Criar conta";
}


/* ============================================================
   Força da senha
   ============================================================ */

function verificarForcaSenha(senha) {
  let forca = 0;

  if (senha.length >= 6) forca++;
  if (senha.length >= 8) forca++;
  if (/[A-Z]/.test(senha)) forca++;
  if (/[0-9!@#$%^&*]/.test(senha)) forca++;

  return forca;
}


function atualizarForcaSenha() {
  const senha = senhaInput.value;
  const forca = verificarForcaSenha(senha);

  strengthSegments.forEach(function (segmento) {
    segmento.className = "strength-seg";
  });

  if (!senha) {
    strengthLabel.textContent = "";
    return;
  }

  const classes = ["weak", "med", "strong", "strong"];

  for (let i = 0; i < forca; i++) {
    if (strengthSegments[i]) {
      strengthSegments[i].classList.add(classes[forca - 1]);
    }
  }

  if (forca <= 1) {
    strengthLabel.textContent = "Senha fraca";
  } else if (forca === 2) {
    strengthLabel.textContent = "Senha média";
  } else if (forca === 3) {
    strengthLabel.textContent = "Senha boa";
  } else {
    strengthLabel.textContent = "Senha forte";
  }
}


/* ============================================================
   Validação em tempo real
   ============================================================ */

nomeInput.addEventListener("input", function () {
  if (nomeInput.value.trim()) {
    setErro(nomeInput, errNome, false);
  }
});


emailInput.addEventListener("input", function () {
  const email = emailInput.value.trim();

  setErro(
    emailInput,
    errEmail,
    email.length > 0 && !isEmailValido(email)
  );
});


senhaInput.addEventListener("input", function () {
  atualizarForcaSenha();

  if (senhaInput.value) {
    setErro(
      senhaInput,
      errSenha,
      senhaInput.value.length < 6
    );
  }

  if (confirmaInput.value) {
    setErro(
      confirmaInput,
      errConfirma,
      confirmaInput.value !== senhaInput.value
    );
  }
});


confirmaInput.addEventListener("input", function () {
  if (confirmaInput.value) {
    setErro(
      confirmaInput,
      errConfirma,
      confirmaInput.value !== senhaInput.value
    );
  }
});


/* ============================================================
   Cadastro pelo submit do formulário
   Funciona com clique e com a tecla Enter
   ============================================================ */

cadastroForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  if (cadastroEmAndamento) {
    return;
  }

  limparToast();

  const nome = nomeInput.value.trim();
  const email = emailInput.value.trim();
  const senha = senhaInput.value;
  const confirma = confirmaInput.value;

  const nomeOk = nome.length > 0;
  const emailOk = isEmailValido(email);
  const senhaOk = senha.length >= 6;
  const confirmaOk =
    confirma.length > 0 &&
    senha === confirma;

  setErro(nomeInput, errNome, !nomeOk);
  setErro(emailInput, errEmail, !emailOk);
  setErro(senhaInput, errSenha, !senhaOk);
  setErro(confirmaInput, errConfirma, !confirmaOk);

  if (!nomeOk || !emailOk || !senhaOk || !confirmaOk) {
    mostrarToast(
      "Verifique os campos destacados.",
      "error"
    );

    if (!nomeOk) {
      nomeInput.focus();
    } else if (!emailOk) {
      emailInput.focus();
    } else if (!senhaOk) {
      senhaInput.focus();
    } else {
      confirmaInput.focus();
    }

    return;
  }

  definirEstadoCarregamento(true);

  try {
    const data = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: nome,
        email: email,
        password: senha
      })
    });

    mostrarToast(
      data.message || "✓ Conta criada com sucesso!",
      "success"
    );

    cadastroForm.reset();
    atualizarForcaSenha();

    [
      [nomeInput, errNome],
      [emailInput, errEmail],
      [senhaInput, errSenha],
      [confirmaInput, errConfirma]
    ].forEach(function (item) {
      setErro(item[0], item[1], false);
    });

    window.setTimeout(function () {
      window.location.href = "login.html";
    }, 1500);

  } catch (error) {
    console.error("Erro no cadastro:", error);

    mostrarToast(
      error.message || "Não foi possível criar a conta.",
      "error"
    );

    emailInput.focus();

  } finally {
    definirEstadoCarregamento(false);
  }
});