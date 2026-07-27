/* ============================================================
   GlicoLog — dashboard.js
   Dashboard conectado ao backend
   ============================================================ */


/* ============================================================
   Utilitários
   ============================================================ */

/**
 * Retorna o status glicêmico com base no valor em mg/dL.
 *
 * < 70     → Baixa
 * 70–180   → Normal
 * > 180    → Alta
 */
function getGlucoseStatus(value) {

  if (value < 70) {

    return {
      key: 'low',
      label: 'Baixa',
      dotClass: 'low'
    };

  }

  if (value > 180) {

    return {
      key: 'high',
      label: 'Alta',
      dotClass: 'high'
    };

  }

  return {
    key: 'normal',
    label: 'Normal',
    dotClass: 'normal'
  };

}


/**
 * Formata uma data/hora para HH:MM.
 */
function formatTime(dateValue) {

  const date =
    new Date(dateValue);

  return date.toLocaleTimeString(
    'pt-BR',
    {
      hour: '2-digit',
      minute: '2-digit'
    }
  );

}


/**
 * Formata uma data completa.
 *
 * Exemplo:
 * seg., 27 de julho
 */
function formatDateFull(date) {

  return date.toLocaleDateString(
    'pt-BR',
    {
      weekday: 'short',
      day: 'numeric',
      month: 'long'
    }
  );

}


/**
 * Retorna uma saudação de acordo
 * com o horário atual.
 */
function getGreeting() {

  const hour =
    new Date().getHours();


  if (hour < 12) {

    return 'Bom dia';

  }


  if (hour < 18) {

    return 'Boa tarde';

  }


  return 'Boa noite';

}


/**
 * Retorna as iniciais do nome.
 *
 * João Silva
 * → JS
 */
function getInitials(name) {

  if (!name) {

    return '?';

  }


  const parts =
    name
      .trim()
      .split(/\s+/);


  if (
    parts.length === 1
  ) {

    return parts[0][0]
      .toUpperCase();

  }


  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();

}


/* ============================================================
   Usuário
   ============================================================ */

function renderGreeting(user) {

  const greetingLabel =
    document.getElementById(
      'greetingLabel'
    );

  const greetingName =
    document.getElementById(
      'greetingName'
    );

  const greetingDate =
    document.getElementById(
      'greetingDate'
    );

  const avatarInitials =
    document.getElementById(
      'avatarInitials'
    );


  const name =
    user?.name ||
    user?.nome ||
    'Usuário';


  const firstName =
    name
      .trim()
      .split(/\s+/)[0];


  if (greetingLabel) {

    greetingLabel.textContent =
      getGreeting();

  }


  if (greetingName) {

    greetingName.textContent =
      firstName;

  }


  if (greetingDate) {

    greetingDate.textContent =
      formatDateFull(
        new Date()
      );

  }


  if (avatarInitials) {

    avatarInitials.textContent =
      getInitials(name);

  }

}


/* ============================================================
   Registros
   ============================================================ */

/**
 * Converte o formato recebido da API
 * para o formato utilizado pelo dashboard.
 *
 * Backend:
 *
 * {
 *   id: 1,
 *   glucose_value: 120,
 *   measurement_type: "Jejum",
 *   measured_at: "2026-07-27T08:00:00.000Z"
 * }
 *
 * Dashboard:
 *
 * {
 *   id: 1,
 *   glicemia: 120,
 *   tipo: "Jejum",
 *   dataHora: "..."
 * }
 */
function normalizeRegistro(registro) {

  return {

    id:
      registro.id,

    glicemia:
      Number(
        registro.glicemia ??
        registro.glucose_value ??
        registro.glucoseValue
      ),

    tipo:
      registro.tipo ??
      registro.measurement_type ??
      registro.measurementType ??
      '',

    dataHora:
      registro.dataHora ??
      registro.measured_at ??
      registro.measuredAt ??
      registro.created_at ??
      registro.createdAt

  };

}


/**
 * Busca as glicemias do usuário
 * autenticado no backend.
 */
async function loadRegistros() {

  const data =
    await apiRequest(
      '/glucose',
      {
        method: 'GET'
      }
    );


  /*
   * Caso a API retorne diretamente:
   *
   * [
   *   {...},
   *   {...}
   * ]
   */
  if (
    Array.isArray(data)
  ) {

    return data.map(
      normalizeRegistro
    );

  }


  /*
   * Caso a API retorne:
   *
   * {
   *   records: [...]
   * }
   */
  if (
    Array.isArray(
      data.records
    )
  ) {

    return data.records.map(
      normalizeRegistro
    );

  }


  /*
   * Caso a API retorne:
   *
   * {
   *   data: [...]
   * }
   */
  if (
    Array.isArray(
      data.data
    )
  ) {

    return data.data.map(
      normalizeRegistro
    );

  }


  return [];

}


/**
 * Filtra os registros realizados hoje.
 */
function getRegistrosHoje(
  registros
) {

  const hoje =
    new Date();


  return registros.filter(
    function(registro) {

      const data =
        new Date(
          registro.dataHora
        );


      return (
        data.getDate() ===
          hoje.getDate() &&

        data.getMonth() ===
          hoje.getMonth() &&

        data.getFullYear() ===
          hoje.getFullYear()
      );

    }
  );

}


/* ============================================================
   Última medição
   ============================================================ */

function renderLastReading(
  registros
) {

  const valueNumber =
    document.getElementById(
      'valueNumber'
    );

  const lastReadingTime =
    document.getElementById(
      'lastReadingTime'
    );

  const statusDot =
    document.getElementById(
      'statusDot'
    );

  const statusText =
    document.getElementById(
      'statusText'
    );


  /*
   * Nenhum registro
   */
  if (
    registros.length === 0
  ) {

    if (valueNumber) {

      valueNumber.textContent =
        '—';

    }


    if (lastReadingTime) {

      lastReadingTime.textContent =
        'Nenhum registro ainda';

    }


    if (statusText) {

      statusText.textContent =
        '—';

    }


    if (statusDot) {

      statusDot.className =
        'status-dot';

    }


    return;

  }


  /*
   * Ordenar registros
   * do mais recente para o mais antigo
   */
  const sorted =
    [...registros].sort(
      function(a, b) {

        return (
          new Date(
            b.dataHora
          ) -
          new Date(
            a.dataHora
          )
        );

      }
    );


  const last =
    sorted[0];


  const status =
    getGlucoseStatus(
      last.glicemia
    );


  if (valueNumber) {

    valueNumber.textContent =
      last.glicemia;

  }


  if (lastReadingTime) {

    lastReadingTime.textContent =
      `às ${formatTime(
        last.dataHora
      )}`;

  }


  if (statusDot) {

    statusDot.className =
      `status-dot ${status.dotClass}`;

  }


  if (statusText) {

    statusText.textContent =
      status.label;

  }

}


/* ============================================================
   Resumo do dia
   ============================================================ */

function renderSummary(
  registrosHoje
) {

  const todayCount =
    document.getElementById(
      'todayCount'
    );

  const todayAvg =
    document.getElementById(
      'todayAvg'
    );

  const todayRange =
    document.getElementById(
      'todayRange'
    );


  /*
   * Quantidade de medições
   */
  if (todayCount) {

    todayCount.textContent =
      registrosHoje.length;

  }


  /*
   * Nenhuma medição hoje
   */
  if (
    registrosHoje.length === 0
  ) {

    if (todayAvg) {

      todayAvg.textContent =
        '—';

    }


    if (todayRange) {

      todayRange.textContent =
        '—';

    }


    return;

  }


  /*
   * Valores das glicemias
   */
  const values =
    registrosHoje.map(
      function(registro) {

        return registro.glicemia;

      }
    );


  /*
   * Média
   */
  const avg =
    Math.round(
      values.reduce(
        function(total, value) {

          return total + value;

        },
        0
      ) /
      values.length
    );


  /*
   * Mínimo e máximo
   */
  const min =
    Math.min(
      ...values
    );


  const max =
    Math.max(
      ...values
    );


  if (todayAvg) {

    todayAvg.textContent =
      avg;

  }


  if (todayRange) {

    todayRange.textContent =
      `${min}–${max}`;

  }

}


/* ============================================================
   Registros recentes
   ============================================================ */

function renderRecentList(
  registros
) {

  const list =
    document.getElementById(
      'recentList'
    );

  const emptyItem =
    document.getElementById(
      'recentEmpty'
    );


  if (!list) {

    return;

  }


  /*
   * Remover registros anteriores
   */
  const existingItems =
    list.querySelectorAll(
      '.recent-item'
    );


  existingItems.forEach(
    function(element) {

      element.remove();

    }
  );


  /*
   * Nenhum registro
   */
  if (
    registros.length === 0
  ) {

    if (emptyItem) {

      emptyItem.style.display =
        '';

    }


    return;

  }


  if (emptyItem) {

    emptyItem.style.display =
      'none';

  }


  /*
   * Ordenar pelos mais recentes
   *
   * Mostrar somente 5
   */
  const sorted =
    [...registros]
      .sort(
        function(a, b) {

          return (
            new Date(
              b.dataHora
            ) -
            new Date(
              a.dataHora
            )
          );

        }
      )
      .slice(
        0,
        5
      );


  /*
   * Criar cada registro
   */
  sorted.forEach(
    function(registro) {

      const status =
        getGlucoseStatus(
          registro.glicemia
        );


      const li =
        document.createElement(
          'li'
        );


      li.className =
        'recent-item';


      li.innerHTML = `
        <div class="recent-item-left">

          <span
            class="recent-dot ${status.dotClass}"
            aria-hidden="true">
          </span>

          <div>

            <div class="recent-time">
              ${formatTime(
                registro.dataHora
              )}
            </div>

            ${
              registro.tipo
                ? `
                  <div class="recent-type">
                    ${registro.tipo}
                  </div>
                `
                : ''
            }

          </div>

        </div>

        <span class="recent-value">
          ${registro.glicemia} mg/dL
        </span>
      `;


      list.appendChild(
        li
      );

    }
  );

}


/* ============================================================
   Navegação mobile
   ============================================================ */

function renderMobileNav() {

  const existing =
    document.querySelector(
      '.mobile-nav'
    );


  if (existing) {

    return;

  }


  const nav =
    document.createElement(
      'nav'
    );


  nav.className =
    'mobile-nav';


  nav.setAttribute(
    'aria-label',
    'Navegação móvel'
  );


  const items = [

    {
      href:
        'dashboard.html',

      label:
        'Início',

      active:
        true,

      icon:
        `
        <svg viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        `
    },

    {
      href:
        'historico.html',

      label:
        'Histórico',

      active:
        false,

      icon:
        `
        <svg viewBox="0 0 24 24">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        `
    },

    {
      href:
        'perfil.html',

      label:
        'Perfil',

      active:
        false,

      icon:
        `
        <svg viewBox="0 0 24 24">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        `
    }

  ];


  items.forEach(
    function(item) {

      const a =
        document.createElement(
          'a'
        );


      a.href =
        item.href;


      a.className =
        `mobile-nav-item ${
          item.active
            ? 'active'
            : ''
        }`;


      if (
        item.active
      ) {

        a.setAttribute(
          'aria-current',
          'page'
        );

      }


      a.innerHTML =
        `${item.icon}
         <span>
           ${item.label}
         </span>`;


      nav.appendChild(
        a
      );

    }
  );


  document.body.appendChild(
    nav
  );

}


/* ============================================================
   Carregamento do dashboard
   ============================================================ */

async function initDashboard() {

  /*
   * Verificar token
   */
  const token =
    localStorage.getItem(
      'token'
    );


  /*
   * Se não existe token,
   * usuário não está autenticado.
   */
  if (!token) {

    window.location.href =
      'login.html';

    return;

  }


  /*
   * Renderizar data e saudação
   * imediatamente.
   */
  const temporaryUser = {

    name:
      'Usuário'

  };


  renderGreeting(
    temporaryUser
  );


  renderMobileNav();


  try {

    /*
     * Buscar usuário autenticado
     */
    const user =
      await apiRequest(
        '/auth/me',
        {
          method: 'GET'
        }
      );


    /*
     * Algumas APIs retornam:
     *
     * {
     *   user: {...}
     * }
     *
     * Outras retornam diretamente:
     *
     * {
     *   id: 1,
     *   name: "João"
     * }
     */
    const userData =
      user.user ||
      user;


    renderGreeting(
      userData
    );


    /*
     * Buscar glicemias
     */
    const registros =
      await loadRegistros();


    /*
     * Registros de hoje
     */
    const registrosHoje =
      getRegistrosHoje(
        registros
      );


    /*
     * Renderizar dashboard
     */
    renderLastReading(
      registros
    );


    renderSummary(
      registrosHoje
    );


    renderRecentList(
      registros
    );


  } catch (error) {

    console.error(
      'Erro ao carregar dashboard:',
      error
    );


    /*
     * Token inválido ou expirado.
     */
    if (
      error.message
        ?.toLowerCase()
        .includes(
          'token'
        )
    ) {

      localStorage.removeItem(
        'token'
      );

      localStorage.removeItem(
        'user'
      );


      window.location.href =
        'login.html';


      return;

    }


    /*
     * Erro ao carregar dados
     */
    const greetingName =
      document.getElementById(
        'greetingName'
      );


    if (greetingName) {

      greetingName.textContent =
        'Não foi possível carregar';

    }


    const recentEmpty =
      document.getElementById(
        'recentEmpty'
      );


    if (recentEmpty) {

      recentEmpty.style.display =
        '';

      recentEmpty.innerHTML = `
        <span>
          Não foi possível carregar
          suas medições.
        </span>
        <button
          type="button"
          onclick="location.reload()">
          Tentar novamente
        </button>
      `;

    }

  }

}


/* ============================================================
   Inicialização
   ============================================================ */

document.addEventListener(
  'DOMContentLoaded',
  initDashboard
);