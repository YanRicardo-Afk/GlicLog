/* ============================================================
   GlicoLog — cadastro.js
   Cadastro e validação da tela de criação de conta
   ============================================================ */

const nomeInput = document.getElementById('cad-nome');
const emailInput = document.getElementById('cad-email');
const senhaInput = document.getElementById('cad-senha');
const confirmaInput = document.getElementById('cad-confirma');

const btnCadastro = document.getElementById('btn-cadastro');
const toast = document.getElementById('cad-toast');

const errNome = document.getElementById('err-cad-nome');
const errEmail = document.getElementById('err-cad-email');
const errSenha = document.getElementById('err-cad-senha');
const errConfirma = document.getElementById('err-cad-confirma');

const strengthLabel = document.getElementById('strength-label');

const strengthSegments = [
  document.getElementById('s1'),
  document.getElementById('s2'),
  document.getElementById('s3'),
  document.getElementById('s4')
];

/* ============================================================
   Utilitários
   ============================================================ */

function isEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


function setErro(input, errEl, mostrar) {

  input.classList.toggle(
    'error',
    mostrar
  );

  errEl.classList.toggle(
    'show',
    mostrar
  );
}


function mostrarToast(mensagem, tipo) {

  toast.textContent = mensagem;

  toast.className =
    'toast ' + tipo;
}


function limparToast() {

  toast.className =
    'toast';

  toast.textContent =
    '';
}


/* ============================================================
   Força da senha
   ============================================================ */

function verificarForcaSenha(senha) {

  let forca = 0;

  if (senha.length >= 6) {
    forca++;
  }

  if (senha.length >= 8) {
    forca++;
  }

  if (/[A-Z]/.test(senha)) {
    forca++;
  }

  if (/[0-9!@#$%^&*]/.test(senha)) {
    forca++;
  }

  return forca;
}


function atualizarForcaSenha() {

  const senha =
    senhaInput.value;

  const forca =
    verificarForcaSenha(
      senha
    );

  // Limpar segmentos
  strengthSegments.forEach(
    function(segment) {

      segment.classList.remove(
        'active'
      );
    }
  );

  if (!senha) {

    strengthLabel.textContent =
      '';

    return;
  }

  // Ativar segmentos
  for (
    let i = 0;
    i < forca;
    i++
  ) {

    if (strengthSegments[i]) {

      strengthSegments[i]
        .classList.add(
          'active'
        );
    }
  }

  // Texto da força
  if (forca <= 1) {

    strengthLabel.textContent =
      'Senha fraca';

  } else if (forca === 2) {

    strengthLabel.textContent =
      'Senha média';

  } else if (forca === 3) {

    strengthLabel.textContent =
      'Senha boa';

  } else {

    strengthLabel.textContent =
      'Senha forte';
  }
}


/* ============================================================
   Validação em tempo real
   ============================================================ */

// Nome
nomeInput.addEventListener(
  'input',
  function() {

    if (
      nomeInput.value.trim()
    ) {

      setErro(
        nomeInput,
        errNome,
        false
      );
    }
  }
);


// E-mail
emailInput.addEventListener(
  'input',
  function() {

    const email =
      emailInput.value.trim();

    if (email) {

      setErro(
        emailInput,
        errEmail,
        !isEmailValido(email)
      );
    }
  }
);


// Senha
senhaInput.addEventListener(
  'input',
  function() {

    atualizarForcaSenha();

    if (
      senhaInput.value
    ) {

      setErro(
        senhaInput,
        errSenha,
        senhaInput.value.length < 6
      );
    }

    // Verificar confirmação
    if (
      confirmaInput.value
    ) {

      setErro(
        confirmaInput,
        errConfirma,
        confirmaInput.value !==
        senhaInput.value
      );
    }
  }
);


// Confirmar senha
confirmaInput.addEventListener(
  'input',
  function() {

    if (
      confirmaInput.value
    ) {

      setErro(
        confirmaInput,
        errConfirma,
        confirmaInput.value !==
        senhaInput.value
      );
    }
  }
);


/* ============================================================
   Cadastro
   ============================================================ */

btnCadastro.addEventListener(
  'click',
  async function() {

    limparToast();

    const nome =
      nomeInput.value.trim();

    const email =
      emailInput.value.trim();

    const senha =
      senhaInput.value;

    const confirma =
      confirmaInput.value;


    /* --------------------------------------------------------
       Validações
       -------------------------------------------------------- */

    const nomeOk =
      nome.length > 0;

    const emailOk =
      isEmailValido(email);

    const senhaOk =
      senha.length >= 6;

    const confirmaOk =
      confirma.length > 0 &&
      senha === confirma;


    setErro(
      nomeInput,
      errNome,
      !nomeOk
    );

    setErro(
      emailInput,
      errEmail,
      !emailOk
    );

    setErro(
      senhaInput,
      errSenha,
      !senhaOk
    );

    setErro(
      confirmaInput,
      errConfirma,
      !confirmaOk
    );


    // Se houver algum erro,
    // não envia para o backend
    if (
      !nomeOk ||
      !emailOk ||
      !senhaOk ||
      !confirmaOk
    ) {

      mostrarToast(
        'Verifique os campos destacados.',
        'error'
      );

      return;
    }


    /* --------------------------------------------------------
       Desabilitar botão
       -------------------------------------------------------- */

    btnCadastro.disabled =
      true;

    btnCadastro.textContent =
      'Criando conta...';


    try {

      /* ------------------------------------------------------
         Enviar cadastro para o backend
         ------------------------------------------------------ */

      const data =
        await apiRequest(
          '/auth/register',
          {
            method: 'POST',

            body: JSON.stringify({
              name: nome,
              email: email,
              password: senha
            })
          }
        );


      /* ------------------------------------------------------
         Cadastro realizado
         ------------------------------------------------------ */

      mostrarToast(
        data.message ||
        '✓ Conta criada com sucesso!',
        'success'
      );


      // Limpar campos
      nomeInput.value =
        '';

      emailInput.value =
        '';

      senhaInput.value =
        '';

      confirmaInput.value =
        '';

      atualizarForcaSenha();


      /* ------------------------------------------------------
         Ir para login
         ------------------------------------------------------ */

      setTimeout(
        function() {

          window.location.href =
            'login.html';

        },
        1500
      );


    } catch (error) {

      console.error(
        'Erro no cadastro:',
        error
      );


      mostrarToast(
        error.message ||
        'Não foi possível criar a conta.',
        'error'
      );


    } finally {

      // Reativar botão
      btnCadastro.disabled =
        false;

      btnCadastro.textContent =
        'Criar conta';
    }
  }
);