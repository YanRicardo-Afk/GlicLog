/* ============================================================
GlicoLog — historico.js
Histórico conectado ao backend
============================================================ */

/* ============================================================
Elementos da página
============================================================ */

const lista = document.getElementById("historyList");
const vazio = document.getElementById("empty");

/* ============================================================
Status da glicemia
============================================================ */

function obterStatus(valor) {
    if (valor < 70) {
        return {
            classe: "low",
            texto: "Baixa"
        };
    }

    if (valor <= 180) {
        return {
            classe: "normal",
            texto: "Normal"
        };
    }

    return {
        classe: "high",
        texto: "Alta"
    };
}

/* ============================================================
Formatação de data
============================================================ */

function formatarData(data) {
    if (!data) {
        return "Data não informada";
    }

    const date = new Date(data);

    if (Number.isNaN(date.getTime())) {
        return "Data inválida";
    }

    return date.toLocaleDateString("pt-BR");
}

/* ============================================================
Formatação de horário
============================================================ */

function formatarHora(registro) {
    /*
     * O backend atual retorna:
     * measurementTime
     *
     * Exemplo: "14:30"
     */
    if (
        registro.measurementTime &&
        typeof registro.measurementTime === "string"
    ) {
        /*
         * Se for somente HH:MM
         */
        if (/^\d{2}:\d{2}/.test(registro.measurementTime)) {
            return registro.measurementTime.substring(0, 5);
        }
    }

    /*
     * Compatibilidade com outros formatos futuros.
     */
    if (registro.hora) {
        return registro.hora;
    }

    return "--:--";
}

/* ============================================================
Formatação do tipo de medição
============================================================ */

function formatarTipo(registro) {
    return (
        registro.measurementType ||
        registro.tipo ||
        "Medição"
    );
}

/* ============================================================
Criar item do histórico
============================================================ */

function criarRegistro(item) {
    if (!lista) return;

    const li = document.createElement("li");

    /*
     * Backend atual:
     * glucoseValue
     */
    const valor = Number(
        item.glucoseValue ??
        item.glicemia
    );

    const status = obterStatus(valor);

    li.className = "history-item";

    li.innerHTML = `
        <div class="history-left">
            <div class="history-dot ${status.classe}"></div>
            <div class="history-info">
                <span class="history-value">
                    ${valor} mg/dL
                </span>
                <span class="history-meta">
                    ${formatarTipo(item)}
                    •
                    ${formatarHora(item)}
                </span>
            </div>
        </div>

        <div class="history-right">
            <div class="history-date">
                ${formatarData(item.createdAt)}
            </div>
            <div class="history-status">
                ${status.texto}
            </div>
        </div>
    `;

    lista.appendChild(li);
}

/* ============================================================
Mostrar estado vazio
============================================================ */

function mostrarVazio(mensagem = "Nenhuma medição registrada.") {
    if (lista) {
        /*
         * Remover registros existentes.
         */
        const items = lista.querySelectorAll(".history-item");
        items.forEach(function (item) {
            item.remove();
        });
    }

    if (vazio) {
        /*
         * Mostrar mensagem.
         */
        vazio.style.display = "";
        vazio.innerHTML = `
            <span>
                ${mensagem}
            </span>
            <a href="registro.html">
                Criar primeiro registro
            </a>
        `;
    }
}

/* ============================================================
Carregar histórico
============================================================ */

async function carregarHistorico() {
    /*
     * Verificar se o usuário está autenticado.
     */
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        /*
         * Buscar registros do usuário.
         * O backend já identifica o usuário através do JWT.
         */
        const data = await apiRequest("/glucose", {
            method: "GET"
        });

        /*
         * Seu backend atual retorna:
         * { records: [...] }
         * Ou em alguns casos diretamente a lista de registros.
         */
        const registros = Array.isArray(data?.records)
            ? data.records
            : Array.isArray(data)
                ? data
                : [];

        /*
         * Nenhum registro.
         */
        if (registros.length === 0) {
            mostrarVazio();
            return;
        }

        /*
         * Esconder mensagem de vazio.
         */
        if (vazio) {
            vazio.style.display = "none";
        }

        /*
         * Limpar registros antigos.
         */
        if (lista) {
            const items = lista.querySelectorAll(".history-item");
            items.forEach(function (item) {
                item.remove();
            });
        }

        /*
         * Ordenar do mais recente para o mais antigo.
         */
        registros.sort(function (a, b) {
            /*
             * createdAt é a data criada pelo banco.
             */
            return (
                new Date(b.createdAt) -
                new Date(a.createdAt)
            );
        });

        /*
         * Criar os registros.
         */
    registros.forEach(function (registro) {
    console.log(
        "REGISTRO RECEBIDO DA API:",
        JSON.stringify(registro, null, 2)
    );

    criarRegistro(registro);
});

    } catch (error) {
        console.error("Erro ao carregar histórico:", error);

        /*
         * Se o token estiver inválido ou expirado, voltar para login.
         */
        const mensagem = error.message?.toLowerCase() || "";

        if (
            mensagem.includes("token") ||
            mensagem.includes("autoriz") ||
            mensagem.includes("não autentic")
        ) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.location.href = "login.html";
            return;
        }

        /*
         * Mostrar erro na tela.
         */
        mostrarVazio("Não foi possível carregar seu histórico.");
    }
}

/* ============================================================
Inicialização
============================================================ */

document.addEventListener("DOMContentLoaded", carregarHistorico);