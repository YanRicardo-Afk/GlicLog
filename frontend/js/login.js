/* ============================================================
   GlicoLog — login.js
   Login e autenticação da tela de login
   ============================================================ */

const emailInput = document.getElementById(
  'login-email'
);

const senhaInput = document.getElementById(
  'login-senha'
);

const btnLogin = document.getElementById(
  'btn-login'
);

const toast = document.getElementById(
  'login-toast'
);

const errEmail = document.getElementById(
  'err-login-email'
);

const errSenha = document.getElementById(
  'err-login-senha'
);


/* ============================================================
   Utilitários
   ============================================================ */

function isEmailValido(email) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );

}


function setErro(
  input,
  errEl,
  mostrar
) {

  input.classList.toggle(
    'error',
    mostrar
  );

  errEl.classList.toggle(
    'show',
    mostrar
  );

}


function mostrarToast(
  mensagem,
  tipo
) {

  toast.textContent =
    mensagem;

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
   Validação em tempo real
   ============================================================ */

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

    } else {

      setErro(
        emailInput,
        errEmail,
        false
      );

    }

  }
);


senhaInput.addEventListener(
  'input',
  function() {

    if (
      senhaInput.value
    ) {

      setErro(
        senhaInput,
        errSenha,
        false
      );

    }

  }
);


/* ============================================================
   Login
   ============================================================ */

btnLogin.addEventListener(
  'click',
  async function() {

    limparToast();


    /* --------------------------------------------------------
       Pegar dados dos campos
       -------------------------------------------------------- */

    const email =
      emailInput.value.trim();

    const senha =
      senhaInput.value;


    /* --------------------------------------------------------
       Validar campos
       -------------------------------------------------------- */

    const emailOk =
      isEmailValido(email);

    const senhaOk =
      senha.length > 0;


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


    if (
      !emailOk ||
      !senhaOk
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

    btnLogin.disabled =
      true;

    btnLogin.textContent =
      'Entrando...';


    try {

      /* ------------------------------------------------------
         Fazer login no backend
         ------------------------------------------------------ */

      const data =
        await apiRequest(
          '/auth/login',
          {
            method: 'POST',

            body: JSON.stringify({
              email: email,
              password: senha
            })
          }
        );


      /* ------------------------------------------------------
         Salvar token JWT
         ------------------------------------------------------ */

      localStorage.setItem(
        'token',
        data.token
      );


      /* ------------------------------------------------------
         Salvar dados do usuário
         ------------------------------------------------------ */

      if (data.user) {

        localStorage.setItem(
          'user',
          JSON.stringify(
            data.user
          )
        );

      }


      /* ------------------------------------------------------
         Mostrar sucesso
         ------------------------------------------------------ */

      mostrarToast(
        '✓ Login realizado com sucesso!',
        'success'
      );


      /* ------------------------------------------------------
         Redirecionar para dashboard
         ------------------------------------------------------ */

      setTimeout(
        function() {

          window.location.href =
            'dashboard.html';

        },
        1000
      );


    } catch (error) {

      console.error(
        'Erro no login:',
        error
      );


      /* ------------------------------------------------------
         Mostrar erro retornado pelo backend
         ------------------------------------------------------ */

      mostrarToast(
        error.message ||
        'E-mail ou senha incorretos.',
        'error'
      );


    } finally {

      /* ------------------------------------------------------
         Reativar botão
         ------------------------------------------------------ */

      btnLogin.disabled =
        false;

      btnLogin.textContent =
        'Entrar';

    }

  }
);