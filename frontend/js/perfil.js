/* ============================================================
GlicoLog — perfil.js
Perfil conectado ao backend real
============================================================ */

/**
 * Retorna as iniciais do nome.
 * João Silva → JS
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

/**
 * Extrai a lista de registros independente
 * do formato retornado pela API.
 */
function extractRecords(data) {
    if (Array.isArray(data)) {
        return data;
    }
    if (Array.isArray(data.records)) {
        return data.records;
    }
    if (Array.isArray(data.data)) {
        return data.data;
    }
    return [];
}

function renderProfile(user) {
    const nome = user?.name || user?.nome || 'Usuário';
    const email = user?.email || 'usuario@email.com';

    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileAvatar = document.getElementById('profileAvatar');

    if (profileName) {
        profileName.textContent = nome;
    }

    if (profileEmail) {
        profileEmail.textContent = email;
    }

    if (profileAvatar) {
        profileAvatar.textContent = getInitials(nome);
    }
}

function renderStats(registros) {
    const countRegister = document.getElementById('countRegister');
    const avgRegister = document.getElementById('avgRegister');

    if (countRegister) {
        countRegister.textContent = registros.length;
    }

    if (!registros.length) {
        if (avgRegister) {
            avgRegister.textContent = '—';
        }
        return;
    }

    const values = registros.map(function (registro) {
        return Number(
            registro.glucoseValue ??
            registro.glicemia ??
            registro.glucose_value ??
            0
        );
    });

    const media = Math.round(
        values.reduce(function (total, value) {
            return total + value;
        }, 0) / values.length
    );

    if (avgRegister) {
        avgRegister.textContent = media;
    }
}

/**
 * Encerra a sessão do usuário,
 * limpando os mesmos dados salvos no login.
 */
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

async function initPerfil() {
    const token = localStorage.getItem('token');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    try {
        /*
         * Buscar usuário autenticado
         * diretamente do backend.
         */
        const userResponse = await apiRequest('/auth/me', {
            method: 'GET'
        });

        const user = userResponse.user || userResponse;
        renderProfile(user);

        /*
         * Buscar medições reais do usuário
         * para calcular estatísticas do perfil.
         */
        const glucoseResponse = await apiRequest('/glucose', {
            method: 'GET'
        });

        const registros = extractRecords(glucoseResponse);
        renderStats(registros);

    } catch (error) {
        console.error('Erro ao carregar perfil:', error);

        if (error.message?.toLowerCase().includes('token')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }

        const profileName = document.getElementById('profileName');
        if (profileName) {
            profileName.textContent = 'Não foi possível carregar';
        }
    }
}

document.addEventListener('DOMContentLoaded', initPerfil);
