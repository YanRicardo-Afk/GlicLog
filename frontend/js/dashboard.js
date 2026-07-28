/* ============================================================
GlicoLog — dashboard.js
Dashboard conectado ao backend
============================================================ */

/* ============================================================
Utilitários
============================================================ */

/**
 * Retorna o status glicêmico com base no valor em mg/dL.
 * < 70 → Baixa
 * 70–180 → Normal
 * > 180 → Alta
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
 * Aceita:
 * Date
 * ISO
 * String
 */
function formatTime(dateValue) {
    if (!dateValue) {
        return '--:--';
    }

    /*
    Se o backend retornar apenas HH:MM,
    não precisamos criar um objeto Date.
    */
    if (typeof dateValue === 'string' && /^\d{2}:\d{2}/.test(dateValue)) {
        return dateValue.substring(0, 5);
    }

    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
        return '--:--';
    }

    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Formata uma data completa.
 * Exemplo:
 * seg., 27 de julho
 */
function formatDateFull(date) {
    return date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: 'numeric',
        month: 'long'
    });
}

/**
 * Retorna uma saudação de acordo
 * com o horário atual.
 */
function getGreeting() {
    const hour = new Date().getHours();
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
 * João Silva
 * → JS
 */
function getInitials(name) {
    if (!name) {
        return '?';
    }
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0][0].toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ============================================================
Usuário
============================================================ */

function renderGreeting(user) {
    const greetingLabel = document.getElementById('greetingLabel');
    const greetingName = document.getElementById('greetingName');
    const greetingDate = document.getElementById('greetingDate');
    const avatarInitials = document.getElementById('avatarInitials');

    /*
     * O backend pode retornar:
     * name
     * ou
     * nome
     */
    const name = user?.name || user?.nome || 'Usuário';
    const firstName = name.trim().split(/\s+/)[0];

    if (greetingLabel) {
        greetingLabel.textContent = getGreeting();
    }

    if (greetingName) {
        greetingName.textContent = firstName;
    }

    if (greetingDate) {
        greetingDate.textContent = formatDateFull(new Date());
    }

    if (avatarInitials) {
        avatarInitials.textContent = getInitials(name);
    }
}

/* ============================================================
Registros
============================================================ */

/**
 * Converte o formato recebido pela API
 * para o formato utilizado internamente
 * pelo Dashboard.
 * 
 * Backend atual:
 * {
 *   id,
 *   glucoseValue,
 *   measurementType,
 *   measurementTime,
 *   meal,
 *   notes,
 *   createdAt
 * }
 * 
 * Dashboard:
 * {
 *   id,
 *   glicemia,
 *   tipo,
 *   dataHora,
 *   hora
 * }
 */
function normalizeRegistro(registro) {
    return {
        id: registro.id,

        glicemia: Number(
            registro.glicemia ??
            registro.glucoseValue ??
            registro.glucose_value
        ),

        tipo: (
            registro.tipo ??
            registro.measurementType ??
            registro.measurement_type ??
            ''
        ),

        /*
         * measurementTime é o campo
         * que seu backend atual retorna.
         */
        dataHora: (
            registro.dataHora ??
            registro.measurementTime ??
            registro.measured_at ??
            registro.measuredAt ??
            registro.created_at ??
            registro.createdAt
        ),

        /*
         * Guardamos também o horário
         * separado caso o backend retorne
         * somente "HH:MM".
         */
        hora: (
            registro.measurementTime ??
            registro.hora ??
            null
        ),

        refeicao: (
            registro.meal ??
            registro.refeicao ??
            null
        ),

        observacoes: (
            registro.notes ??
            registro.obs ??
            null
        ),

        /*
         * IMPORTANTE: precisamos preservar o createdAt,
         * pois measurementTime é somente um horário (HH:MM:SS),
         * sem data. Sem o createdAt, getRegistroDate() não
         * consegue montar uma data válida e todos os registros
         * acabam virando "Invalid Date" — foi isso que fazia a
         * média e a variação do dia nunca aparecerem.
         */
        createdAt: (
            registro.createdAt ??
            registro.created_at ??
            null
        )
    };
}

/**
 * Busca as glicemias do usuário
 * autenticado no backend.
 */
async function loadRegistros() {
    const data = await apiRequest('/glucose', {
        method: 'GET'
    });

    /*
    Caso a API retorne diretamente:
    [
      {...},
      {...}
    ]
    */
    if (Array.isArray(data)) {
        return data.map(normalizeRegistro);
    }

    /*
    Seu backend atual retorna:
    {
      records: [...]
    }
    */
    if (Array.isArray(data.records)) {
        return data.records.map(normalizeRegistro);
    }

    /*
    Compatibilidade caso futuramente
    a API retorne:
    {
      data: [...]
    }
    */
    if (Array.isArray(data.data)) {
        return data.data.map(normalizeRegistro);
    }

    return [];
}

/**
 * Converte uma data/horário de registro
 * em um objeto Date.
 * O backend atual salva o horário como:
 * "14:30"
 * Portanto, precisamos combinar
 * com a data de criação do registro.
 */
function getRegistroDate(registro) {
    /*
    Se dataHora já for uma data completa,
    tentar utilizar diretamente.
    */
    if (
        registro.dataHora &&
        typeof registro.dataHora === 'string' &&
        registro.dataHora.includes('T')
    ) {
        const date = new Date(registro.dataHora);
        if (!Number.isNaN(date.getTime())) {
            return date;
        }
    }

    /*
    Se existir createdAt,
    usamos a data de criação
    e o horário da medição.
    */
    if (registro.createdAt) {
        const createdDate = new Date(registro.createdAt);
        if (!Number.isNaN(createdDate.getTime())) {
            const hora = registro.hora || registro.dataHora;

            if (
                hora &&
                typeof hora === 'string' &&
                /^\d{2}:\d{2}/.test(hora)
            ) {
                const [horas, minutos] = hora.split(':').map(Number);
                createdDate.setHours(horas, minutos, 0, 0);
            }

            return createdDate;
        }
    }

    /*
    Última tentativa.
    */
    const date = new Date(registro.dataHora);
    return date;
}

/**
 * Retorna somente os registros
 * realizados hoje.
 */
function getRegistrosHoje(registros) {
    const hoje = new Date();
    return registros.filter(function (registro) {
        const data = getRegistroDate(registro);

        if (Number.isNaN(data.getTime())) {
            return false;
        }

        return (
            data.getDate() === hoje.getDate() &&
            data.getMonth() === hoje.getMonth() &&
            data.getFullYear() === hoje.getFullYear()
        );
    });
}

/* ============================================================
Última medição
============================================================ */

function renderLastReading(registros) {
    const valueNumber = document.getElementById('valueNumber');
    const lastReadingTime = document.getElementById('lastReadingTime');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    /*
     * Nenhum registro
     */
    if (registros.length === 0) {
        if (valueNumber) {
            valueNumber.textContent = '—';
        }

        if (lastReadingTime) {
            lastReadingTime.textContent = 'Nenhum registro ainda';
        }

        if (statusText) {
            statusText.textContent = '—';
        }

        if (statusDot) {
            statusDot.className = 'status-dot';
        }

        return;
    }

    /*
     * Ordenar registros
     * do mais recente para o mais antigo.
     */
    const sorted = [...registros].sort(function (a, b) {
        return getRegistroDate(b) - getRegistroDate(a);
    });

    const last = sorted[0];
    const status = getGlucoseStatus(last.glicemia);

    if (valueNumber) {
        valueNumber.textContent = last.glicemia;
    }

    if (lastReadingTime) {
        lastReadingTime.textContent = `às ${formatTime(last.hora || last.dataHora)}`;
    }

    if (statusDot) {
        statusDot.className = `status-dot ${status.dotClass}`;
    }

    if (statusText) {
        statusText.textContent = status.label;
    }
}

/* ============================================================
Resumo do dia
============================================================ */

function renderSummary(registrosHoje) {
    const todayCount = document.getElementById('todayCount');
    const todayAvg = document.getElementById('todayAvg');
    const todayRange = document.getElementById('todayRange');

    /*
     * Quantidade de medições
     */
    if (todayCount) {
        todayCount.textContent = registrosHoje.length;
    }

    /*
     * Nenhuma medição hoje
     */
    if (registrosHoje.length === 0) {
        if (todayAvg) {
            todayAvg.textContent = '—';
        }

        if (todayRange) {
            todayRange.textContent = '—';
        }

        return;
    }

    /*
     * Valores das glicemias
     */
    const values = registrosHoje.map(function (registro) {
        return registro.glicemia;
    });

    /*
     * Média
     */
    const avg = Math.round(
        values.reduce(function (total, value) {
            return total + value;
        }, 0) / values.length
    );

    /*
     * Mínimo e máximo
     */
    const min = Math.min(...values);
    const max = Math.max(...values);

    if (todayAvg) {
        todayAvg.textContent = avg;
    }

    if (todayRange) {
        todayRange.textContent = `${min}–${max}`;
    }
}

/* ============================================================
Registros recentes
============================================================ */

function renderRecentList(registros) {
    const list = document.getElementById('recentList');
    const emptyItem = document.getElementById('recentEmpty');

    if (!list) {
        return;
    }

    /*
     * Remover registros anteriores.
     */
    const existingItems = list.querySelectorAll('.recent-item');
    existingItems.forEach(function (element) {
        element.remove();
    });

    /*
     * Nenhum registro.
     */
    if (registros.length === 0) {
        if (emptyItem) {
            emptyItem.style.display = '';
        }

        return;
    }

    if (emptyItem) {
        emptyItem.style.display = 'none';
    }

    /*
     * Ordenar pelos mais recentes.
     * Mostrar somente 5.
     */
    const sorted = [...registros]
        .sort(function (a, b) {
            return getRegistroDate(b) - getRegistroDate(a);
        })
        .slice(0, 5);

    /*
     * Criar cada registro.
     */
    sorted.forEach(function (registro) {
        const status = getGlucoseStatus(registro.glicemia);

        const li = document.createElement('li');
        li.className = 'recent-item';

        li.innerHTML = `
            <div class="recent-item-left">
                <span class="recent-dot ${status.dotClass}" aria-hidden="true"></span>
                <div>
                    <div class="recent-time">
                        ${formatTime(registro.hora || registro.dataHora)}
                    </div>
                    ${
                        registro.tipo
                            ? `<div class="recent-type">${registro.tipo}</div>`
                            : ''
                    }
                </div>
            </div>
            <span class="recent-value">
                ${registro.glicemia} mg/dL
            </span>
        `;

        list.appendChild(li);
    });
}

/* ============================================================
Menu do avatar / Logout
============================================================ */

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

function initAvatarMenu() {
    const avatarBtn = document.getElementById('avatarBtn');
    const dropdown = document.getElementById('avatarDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!avatarBtn || !dropdown) {
        return;
    }

    function closeDropdown() {
        dropdown.classList.remove('open');
        avatarBtn.setAttribute('aria-expanded', 'false');
    }

    function toggleDropdown() {
        const isOpen = dropdown.classList.toggle('open');
        avatarBtn.setAttribute('aria-expanded', String(isOpen));
    }

    avatarBtn.addEventListener('click', function (event) {
        event.stopPropagation();
        toggleDropdown();
    });

    document.addEventListener('click', function (event) {
        if (!dropdown.contains(event.target) && event.target !== avatarBtn) {
            closeDropdown();
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeDropdown();
        }
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

/* ============================================================
Navegação mobile
============================================================ */

function renderMobileNav() {
    const existing = document.querySelector('.mobile-nav');

    if (existing) {
        return;
    }

    const nav = document.createElement('nav');
    nav.className = 'mobile-nav';
    nav.setAttribute('aria-label', 'Navegação móvel');

    const items = [
        {
            href: 'dashboard.html',
            label: 'Início',
            active: true,
            icon: `
                <svg viewBox="0 0 24 24">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
            `
        },
        {
            href: 'historico.html',
            label: 'Histórico',
            active: false,
            icon: `
                <svg viewBox="0 0 24 24">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
            `
        },
        {
            href: 'perfil.html',
            label: 'Perfil',
            active: false,
            icon: `
                <svg viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
            `
        }
    ];

    items.forEach(function (item) {
        const a = document.createElement('a');
        a.href = item.href;
        a.className = `mobile-nav-item ${item.active ? 'active' : ''}`;

        if (item.active) {
            a.setAttribute('aria-current', 'page');
        }

        a.innerHTML = `
            ${item.icon}
            <span>${item.label}</span>
        `;

        nav.appendChild(a);
    });

    document.body.appendChild(nav);
}

/* ============================================================
Carregamento do Dashboard
============================================================ */

async function initDashboard() {
    /*
     * Verificar token.
     */
    const token = localStorage.getItem('token');

    /*
     * Se não existe token,
     * usuário não está autenticado.
     */
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    /*
     * Mostrar uma saudação temporária.
     */
    renderGreeting({
        name: 'Usuário'
    });

    renderMobileNav();
    initAvatarMenu();

    try {
        /*
         * Buscar usuário autenticado.
         */
        const user = await apiRequest('/auth/me', {
            method: 'GET'
        });

        /*
         * Algumas APIs retornam:
         * { user: {...} }
         * 
         * Outras retornam diretamente
         * o objeto do usuário.
         */
        const userData = user.user || user;

        renderGreeting(userData);

        /*
         * Buscar glicemias.
         */
        const registros = await loadRegistros();

        /*
         * Registros de hoje.
         */
        const registrosHoje = getRegistrosHoje(registros);

        /*
         * Renderizar Dashboard.
         */
        renderLastReading(registros);
        renderSummary(registrosHoje);
        renderRecentList(registros);

    } catch (error) {
        console.error('Erro ao carregar dashboard:', error);

        /*
         * Token inválido ou expirado.
         */
        if (error.message?.toLowerCase().includes('token')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            window.location.href = 'login.html';
            return;
        }

        /*
         * Erro ao carregar dados.
         */
        const greetingName = document.getElementById('greetingName');
        if (greetingName) {
            greetingName.textContent = 'Não foi possível carregar';
        }

        const recentEmpty = document.getElementById('recentEmpty');
        if (recentEmpty) {
            recentEmpty.style.display = '';
            recentEmpty.innerHTML = `
                <span>
                    Não foi possível carregar suas medições.
                </span>
                <button type="button" onclick="location.reload()">
                    Tentar novamente
                </button>
            `;
        }
    }
}

/* ============================================================
Inicialização
============================================================ */

document.addEventListener('DOMContentLoaded', initDashboard);