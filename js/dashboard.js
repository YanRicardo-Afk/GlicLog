/* ============================================================
   GlicoLog — dashboard.js
   ============================================================ */

// ---------- Utilitários ----------

/**
 * Retorna o status glicêmico com base no valor em mg/dL.
 * Referências para DM1 (uso geral):
 *   < 70  → Baixa (hipoglicemia)
 *   70–180 → Normal
 *   > 180  → Alta (hiperglicemia)
 */
function getGlucoseStatus(value) {
  if (value < 70)  return { key: 'low',    label: 'Baixa',  dotClass: 'low'    };
  if (value > 180) return { key: 'high',   label: 'Alta',   dotClass: 'high'   };
  return             { key: 'normal', label: 'Normal', dotClass: 'normal' };
}

/** Formata uma data/hora ISO para "HH:MM" no fuso local. */
function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formata data para exibição legível (ex.: "seg, 23 de junho"). */
function formatDateFull(date) {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  });
}

/** Saudação adequada ao horário atual. */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

// ---------- Dados do usuário ----------

function loadUser() {
  try {
    const raw = localStorage.getItem('glicolog_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ---------- Registros ----------

function loadRegistros() {
  try {
    const raw = localStorage.getItem('glicolog_registros');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Filtra registros do dia de hoje (por data local). */
function getRegistrosHoje(registros) {
  const hoje = new Date().toLocaleDateString('pt-BR');
  return registros.filter((r) => {
    const d = new Date(r.dataHora);
    return d.toLocaleDateString('pt-BR') === hoje;
  });
}

// ---------- Renderização ----------

function renderGreeting(user) {
  const greetingLabel = document.getElementById('greetingLabel');
  const greetingName  = document.getElementById('greetingName');
  const greetingDate  = document.getElementById('greetingDate');
  const avatarInitials = document.getElementById('avatarInitials');

  const name = user?.nome ?? 'Usuário';
  const firstName = name.split(' ')[0];

  greetingLabel.textContent = getGreeting();
  greetingName.textContent  = firstName;
  greetingDate.textContent  = formatDateFull(new Date());
  avatarInitials.textContent = getInitials(name);
}

function renderLastReading(registros) {
  const valueNumber    = document.getElementById('valueNumber');
  const lastReadingTime = document.getElementById('lastReadingTime');
  const statusDot      = document.getElementById('statusDot');
  const statusText     = document.getElementById('statusText');

  if (registros.length === 0) {
    valueNumber.textContent     = '—';
    lastReadingTime.textContent = 'Nenhum registro ainda';
    statusText.textContent      = '—';
    return;
  }

  // Ordenar pelo mais recente
  const sorted = [...registros].sort(
    (a, b) => new Date(b.dataHora) - new Date(a.dataHora)
  );
  const last   = sorted[0];
  const status = getGlucoseStatus(last.glicemia);

  valueNumber.textContent     = last.glicemia;
  lastReadingTime.textContent = `às ${formatTime(last.dataHora)}`;
  statusDot.className         = `status-dot ${status.dotClass}`;
  statusText.textContent      = status.label;
}

function renderSummary(registrosHoje) {
  const todayCount = document.getElementById('todayCount');
  const todayAvg   = document.getElementById('todayAvg');
  const todayRange = document.getElementById('todayRange');

  todayCount.textContent = registrosHoje.length;

  if (registrosHoje.length === 0) {
    todayAvg.textContent   = '—';
    todayRange.textContent = '—';
    return;
  }

  const values = registrosHoje.map((r) => r.glicemia);
  const avg    = Math.round(values.reduce((s, v) => s + v, 0) / values.length);
  const min    = Math.min(...values);
  const max    = Math.max(...values);

  todayAvg.textContent   = avg;
  todayRange.textContent = `${min}–${max}`;
}

function renderRecentList(registros) {
  const list       = document.getElementById('recentList');
  const emptyItem  = document.getElementById('recentEmpty');

  // Limpar itens anteriores (manter o empty placeholder)
  const existingItems = list.querySelectorAll('.recent-item');
  existingItems.forEach((el) => el.remove());

  if (registros.length === 0) {
    emptyItem.style.display = '';
    return;
  }

  emptyItem.style.display = 'none';

  // Mostrar os 5 mais recentes
  const sorted = [...registros]
    .sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora))
    .slice(0, 5);

  sorted.forEach((r) => {
    const status = getGlucoseStatus(r.glicemia);
    const li     = document.createElement('li');
    li.className = 'recent-item';
    li.innerHTML = `
      <div class="recent-item-left">
        <span class="recent-dot ${status.dotClass}" aria-hidden="true"></span>
        <div>
          <div class="recent-time">${formatTime(r.dataHora)}</div>
          ${r.tipo ? `<div class="recent-type">${r.tipo}</div>` : ''}
        </div>
      </div>
      <span class="recent-value">${r.glicemia} mg/dL</span>
    `;
    list.appendChild(li);
  });
}

// ---------- Mobile nav ----------

function renderMobileNav() {
  const existing = document.querySelector('.mobile-nav');
  if (existing) return; // já injetado

  const nav = document.createElement('nav');
  nav.className   = 'mobile-nav';
  nav.setAttribute('aria-label', 'Navegação móvel');

  const items = [
    {
      href: 'dashboard.html',
      label: 'Início',
      active: true,
      icon: `<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    },
    {
      href: 'historico.html',
      label: 'Histórico',
      active: false,
      icon: `<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    },
    {
      href: 'perfil.html',
      label: 'Perfil',
      active: false,
      icon: `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    },
  ];

  items.forEach(({ href, label, active, icon }) => {
    const a = document.createElement('a');
    a.href      = href;
    a.className = `mobile-nav-item${active ? ' active' : ''}`;
    if (active) a.setAttribute('aria-current', 'page');
    a.innerHTML = `${icon}<span>${label}</span>`;
    nav.appendChild(a);
  });

  document.body.appendChild(nav);
}

// ---------- Init ----------

function init() {
  const user      = loadUser();
  const registros = loadRegistros();
  const hoje      = getRegistrosHoje(registros);

  renderGreeting(user);
  renderLastReading(registros);
  renderSummary(hoje);
  renderRecentList(registros);
  renderMobileNav();
}

document.addEventListener('DOMContentLoaded', init);