/* ============================================================
GlicoLog — historico.js
Histórico conectado ao backend
Agora com: filtro por período, editar e excluir registros
============================================================ */

/* ============================================================
Elementos da página
============================================================ */

const lista = document.getElementById("historyList");
const vazio = document.getElementById("empty");

const filtroPeriodo = document.getElementById("filtroPeriodo");
const filtroMesWrapper = document.getElementById("filtroMesWrapper");
const filtroMes = document.getElementById("filtroMes");
const filtroSemanaWrapper = document.getElementById("filtroSemanaWrapper");
const filtroSemana = document.getElementById("filtroSemana");

const editModalOverlay = document.getElementById("editModalOverlay");
const editModalClose = document.getElementById("editModalClose");
const editForm = document.getElementById("editForm");
const editToast = document.getElementById("editToast");
const editCancelBtn = document.getElementById("editCancelBtn");

const editIdInput = document.getElementById("editId");
const editGlicemiaInput = document.getElementById("editGlicemia");
const editTipoInput = document.getElementById("editTipo");
const editHoraInput = document.getElementById("editHora");
const editRefeicaoInput = document.getElementById("editRefeicao");
const editObsInput = document.getElementById("editObs");

const deleteModalOverlay = document.getElementById("deleteModalOverlay");
const deleteCancelBtn = document.getElementById("deleteCancelBtn");
const deleteConfirmBtn = document.getElementById("deleteConfirmBtn");

const downloadWeekPdfBtn = document.getElementById("downloadWeekPdf");
const downloadMonthPdfBtn = document.getElementById("downloadMonthPdf");
const reportMonthInput = document.getElementById("reportMonth");

/* ============================================================
Estado em memória
============================================================ */

/*
 * Guardamos todos os registros vindos da API aqui.
 * Os filtros trabalham em cima dessa cópia, sem
 * precisar buscar de novo no backend a cada troca.
 */
let todosOsRegistros = [];

/*
 * Guarda o id do registro selecionado
 * para exclusão (usado pelo modal de confirmação).
 */
let idParaExcluir = null;

/*
 * Controle de acessibilidade dos modais.
 * Guarda o modal aberto e o elemento que possuía foco antes da abertura.
 */
let modalAtivo = null;
let elementoFocoAnterior = null;
let elementosTemporariamenteInertes = [];

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
Ícones (editar / excluir)
============================================================ */

const iconeEditar = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
    </svg>
`;

const iconeExcluir = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
        <path d="M10 11v6"></path>
        <path d="M14 11v6"></path>
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
    </svg>
`;

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
    li.dataset.id = item.id;

    li.innerHTML = `
        <div class="history-left">
            <div class="history-dot ${status.classe}" aria-hidden="true"></div>
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
            <div class="history-right-info">
                <div class="history-date">
                    ${formatarData(item.createdAt)}
                </div>
                <div class="history-status">
                    ${status.texto}
                </div>
            </div>

            <div class="history-actions">
                <button type="button" class="icon-btn edit-btn" data-id="${item.id}" aria-label="Editar registro">
                    ${iconeEditar}
                </button>
                <button type="button" class="icon-btn delete-btn" data-id="${item.id}" aria-label="Excluir registro">
                    ${iconeExcluir}
                </button>
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
        const items = lista.querySelectorAll(".history-item");
        items.forEach(function (item) {
            item.remove();
        });
    }

    if (vazio) {
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
Renderizar lista de registros na tela
============================================================ */

function renderizarRegistros(registros) {
    if (registros.length === 0) {
        mostrarVazio("Nenhuma medição encontrada para o período selecionado.");
        return;
    }

    if (vazio) {
        vazio.style.display = "none";
    }

    if (lista) {
        const items = lista.querySelectorAll(".history-item");
        items.forEach(function (item) {
            item.remove();
        });
    }

    const ordenados = [...registros].sort(function (a, b) {
        return (
            new Date(b.createdAt) -
            new Date(a.createdAt)
        );
    });

    ordenados.forEach(function (registro) {
        criarRegistro(registro);
    });
}

/* ============================================================
Utilitários de data para os filtros
============================================================ */

function obterInicioDaSemana(data) {
    const d = new Date(data);
    const dia = d.getDay();
    const diff = dia === 0 ? -6 : 1 - dia;

    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);

    return d;
}

function obterIntervaloSemanaISO(valorSemana) {
    const [anoStr, semanaStr] = valorSemana.split("-W");

    const ano = Number(anoStr);
    const semana = Number(semanaStr);

    const referencia = new Date(ano, 0, 4);
    const inicioSemana1 = obterInicioDaSemana(referencia);

    const inicio = new Date(inicioSemana1);
    inicio.setDate(inicio.getDate() + (semana - 1) * 7);
    inicio.setHours(0, 0, 0, 0);

    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);
    fim.setHours(23, 59, 59, 999);

    return { inicio, fim };
}

/* ============================================================
Aplicar filtro selecionado
============================================================ */

function aplicarFiltro() {
    const periodo = filtroPeriodo ? filtroPeriodo.value : "all";

    let filtrados = todosOsRegistros;

    if (periodo === "week") {
        const inicio = obterInicioDaSemana(new Date());
        const fim = new Date();
        fim.setHours(23, 59, 59, 999);

        filtrados = todosOsRegistros.filter(function (registro) {
            const data = new Date(registro.createdAt);
            return data >= inicio && data <= fim;
        });

    } else if (periodo === "month") {
        const agora = new Date();

        filtrados = todosOsRegistros.filter(function (registro) {
            const data = new Date(registro.createdAt);
            return (
                data.getFullYear() === agora.getFullYear() &&
                data.getMonth() === agora.getMonth()
            );
        });

    } else if (periodo === "custom-month") {
        const valor = filtroMes ? filtroMes.value : "";

        if (!valor) {
            filtrados = [];
        } else {
            const [ano, mes] = valor.split("-").map(Number);

            filtrados = todosOsRegistros.filter(function (registro) {
                const data = new Date(registro.createdAt);
                return (
                    data.getFullYear() === ano &&
                    data.getMonth() === mes - 1
                );
            });
        }

    } else if (periodo === "custom-week") {
        const valor = filtroSemana ? filtroSemana.value : "";

        if (!valor) {
            filtrados = [];
        } else {
            const { inicio, fim } = obterIntervaloSemanaISO(valor);

            filtrados = todosOsRegistros.filter(function (registro) {
                const data = new Date(registro.createdAt);
                return data >= inicio && data <= fim;
            });
        }
    }

    renderizarRegistros(filtrados);
}

/* ============================================================
Alternar campos de filtro visíveis
============================================================ */

function atualizarCamposDeFiltro() {
    const periodo = filtroPeriodo ? filtroPeriodo.value : "all";

    if (filtroMesWrapper) {
        filtroMesWrapper.hidden = periodo !== "custom-month";
    }

    if (filtroSemanaWrapper) {
        filtroSemanaWrapper.hidden = periodo !== "custom-week";
    }

    aplicarFiltro();
}

if (filtroPeriodo) {
    filtroPeriodo.addEventListener("change", atualizarCamposDeFiltro);
}

if (filtroMes) {
    filtroMes.addEventListener("change", aplicarFiltro);
}

if (filtroSemana) {
    filtroSemana.addEventListener("change", aplicarFiltro);
}

/* ============================================================
Carregar histórico
============================================================ */

async function carregarHistorico() {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    try {
        const data = await apiRequest("/glucose", {
            method: "GET"
        });

        const registros = Array.isArray(data?.records)
            ? data.records
            : Array.isArray(data)
                ? data
                : [];

        todosOsRegistros = registros;

        if (registros.length === 0) {
            mostrarVazio();
            return;
        }

        aplicarFiltro();

    } catch (error) {
        console.error("Erro ao carregar histórico:", error);

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

        mostrarVazio("Não foi possível carregar seu histórico.");
    }
}

/* ============================================================
Acessibilidade e gerenciamento de foco dos modais
============================================================ */

function obterElementosFocaveis(container) {
    if (!container) return [];

    return Array.from(
        container.querySelectorAll(
            [
                'a[href]',
                'button:not([disabled])',
                'input:not([disabled]):not([type="hidden"])',
                'select:not([disabled])',
                'textarea:not([disabled])',
                '[tabindex]:not([tabindex="-1"])'
            ].join(",")
        )
    ).filter(function (elemento) {
        return !elemento.hidden &&
            elemento.getAttribute("aria-hidden") !== "true" &&
            elemento.offsetParent !== null;
    });
}

function bloquearConteudoDaPagina(overlayAtivo) {
    elementosTemporariamenteInertes = [];

    Array.from(document.body.children).forEach(function (elemento) {
        if (
            elemento === overlayAtivo ||
            elemento.tagName === "SCRIPT"
        ) {
            return;
        }

        elementosTemporariamenteInertes.push({
            elemento,
            inertAnterior: elemento.inert,
            ariaHiddenAnterior: elemento.getAttribute("aria-hidden")
        });

        elemento.inert = true;
        elemento.setAttribute("aria-hidden", "true");
    });

    document.body.classList.add("modal-open");
}

function desbloquearConteudoDaPagina() {
    elementosTemporariamenteInertes.forEach(function (item) {
        item.elemento.inert = item.inertAnterior;

        if (item.ariaHiddenAnterior === null) {
            item.elemento.removeAttribute("aria-hidden");
        } else {
            item.elemento.setAttribute(
                "aria-hidden",
                item.ariaHiddenAnterior
            );
        }
    });

    elementosTemporariamenteInertes = [];
    document.body.classList.remove("modal-open");
}

function abrirModal(overlay, focoInicial) {
    if (!overlay) return;

    elementoFocoAnterior =
        document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

    modalAtivo = overlay;
    overlay.hidden = false;

    bloquearConteudoDaPagina(overlay);

    window.requestAnimationFrame(function () {
        const alvo =
            focoInicial ||
            obterElementosFocaveis(overlay)[0] ||
            overlay.querySelector('[role="dialog"]');

        if (alvo instanceof HTMLElement) {
            alvo.focus();
        }
    });
}

function fecharModal(overlay) {
    if (!overlay) return;

    overlay.hidden = true;

    if (modalAtivo === overlay) {
        modalAtivo = null;
    }

    desbloquearConteudoDaPagina();

    if (
        elementoFocoAnterior instanceof HTMLElement &&
        document.contains(elementoFocoAnterior)
    ) {
        elementoFocoAnterior.focus();
    }

    elementoFocoAnterior = null;
}

function manterFocoNoModal(event) {
    if (!modalAtivo || event.key !== "Tab") {
        return;
    }

    const focaveis = obterElementosFocaveis(modalAtivo);

    if (focaveis.length === 0) {
        event.preventDefault();

        const dialogo = modalAtivo.querySelector('[role="dialog"]');

        if (dialogo instanceof HTMLElement) {
            dialogo.focus();
        }

        return;
    }

    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];

    if (event.shiftKey && document.activeElement === primeiro) {
        event.preventDefault();
        ultimo.focus();
        return;
    }

    if (!event.shiftKey && document.activeElement === ultimo) {
        event.preventDefault();
        primeiro.focus();
    }
}

document.addEventListener("keydown", function (event) {
    if (!modalAtivo) {
        return;
    }

    if (event.key === "Escape") {
        event.preventDefault();

        if (modalAtivo === editModalOverlay) {
            fecharModalEdicao();
        } else if (modalAtivo === deleteModalOverlay) {
            fecharModalExclusao();
        }

        return;
    }

    manterFocoNoModal(event);
});

/* ============================================================
Editar registro — abrir modal
============================================================ */

function abrirModalEdicao(id) {
    const registro = todosOsRegistros.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!registro) return;

    editIdInput.value = registro.id;
    editGlicemiaInput.value = Number(
        registro.glucoseValue ?? registro.glicemia
    );
    editTipoInput.value =
        registro.measurementType || registro.tipo || "";
    editHoraInput.value = formatarHora(registro);
    editRefeicaoInput.value = registro.meal || "";
    editObsInput.value = registro.notes || "";

    if (editToast) {
        editToast.className = "toast";
        editToast.textContent = "";
    }

    abrirModal(editModalOverlay, editGlicemiaInput);
}

function fecharModalEdicao() {
    fecharModal(editModalOverlay);
    editForm.reset();

    if (editToast) {
        editToast.className = "toast";
        editToast.textContent = "";
    }
}

if (editModalClose) {
    editModalClose.addEventListener("click", fecharModalEdicao);
}

if (editCancelBtn) {
    editCancelBtn.addEventListener("click", fecharModalEdicao);
}

if (editModalOverlay) {
    editModalOverlay.addEventListener("mousedown", function (event) {
        if (event.target === editModalOverlay) {
            fecharModalEdicao();
        }
    });
}

/* ============================================================
Editar registro — enviar alterações
============================================================ */

if (editForm) {
    editForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const id = editIdInput.value;

        const valor = Number(editGlicemiaInput.value);

        if (!valor || valor < 20 || valor > 600) {
            editToast.className = "toast error";
            editToast.textContent = "Informe um valor de glicemia válido.";
            editGlicemiaInput.focus();
            return;
        }

        if (!editHoraInput.value) {
            editToast.className = "toast error";
            editToast.textContent = "Informe o horário da medição.";
            return;
        }

        const submitButton = editForm.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Salvando...";
        }

        try {
            await apiRequest(`/glucose/${id}`, {
                method: "PUT",
                body: JSON.stringify({
                    glucoseValue: valor,
                    measurementType: editTipoInput.value || null,
                    measurementTime: editHoraInput.value,
                    meal: editRefeicaoInput.value.trim() || null,
                    notes: editObsInput.value.trim() || null
                })
            });

            todosOsRegistros = todosOsRegistros.map(function (registro) {
                if (String(registro.id) !== String(id)) {
                    return registro;
                }

                return {
                    ...registro,
                    glucoseValue: valor,
                    measurementType: editTipoInput.value || null,
                    measurementTime: editHoraInput.value,
                    meal: editRefeicaoInput.value.trim() || null,
                    notes: editObsInput.value.trim() || null
                };
            });

            fecharModalEdicao();
            aplicarFiltro();

        } catch (error) {
            console.error("Erro ao atualizar registro:", error);

            editToast.className = "toast error";
            editToast.textContent =
                error.message || "Não foi possível salvar as alterações.";

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Salvar Alterações";
            }
        }
    });
}

/* ============================================================
Excluir registro — abrir modal de confirmação
============================================================ */

function abrirModalExclusao(id) {
    idParaExcluir = id;
    abrirModal(deleteModalOverlay, deleteCancelBtn);
}

function fecharModalExclusao() {
    fecharModal(deleteModalOverlay);
    idParaExcluir = null;
}

if (deleteCancelBtn) {
    deleteCancelBtn.addEventListener("click", fecharModalExclusao);
}

if (deleteModalOverlay) {
    deleteModalOverlay.addEventListener("mousedown", function (event) {
        if (event.target === deleteModalOverlay) {
            fecharModalExclusao();
        }
    });
}

if (deleteConfirmBtn) {
    deleteConfirmBtn.addEventListener("click", async function () {
        if (!idParaExcluir) return;

        deleteConfirmBtn.disabled = true;
        deleteConfirmBtn.textContent = "Excluindo...";

        try {
            await apiRequest(`/glucose/${idParaExcluir}`, {
                method: "DELETE"
            });

            todosOsRegistros = todosOsRegistros.filter(function (registro) {
                return String(registro.id) !== String(idParaExcluir);
            });

            fecharModalExclusao();

            if (todosOsRegistros.length === 0) {
                mostrarVazio();
            } else {
                aplicarFiltro();
            }

        } catch (error) {
            console.error("Erro ao excluir registro:", error);
            alert(error.message || "Não foi possível excluir o registro.");

        } finally {
            deleteConfirmBtn.disabled = false;
            deleteConfirmBtn.textContent = "Excluir";
        }
    });
}

/* ============================================================
Delegação de eventos — botões de editar/excluir na lista
============================================================ */

if (lista) {
    lista.addEventListener("click", function (event) {
        const editBtn = event.target.closest(".edit-btn");
        const deleteBtn = event.target.closest(".delete-btn");

        if (editBtn) {
            abrirModalEdicao(editBtn.dataset.id);
            return;
        }

        if (deleteBtn) {
            abrirModalExclusao(deleteBtn.dataset.id);
        }
    });
}

/* ============================================================
Gerar relatório PDF
============================================================ */

function formatarDataConsulta(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function obterPeriodoPdf(periodo) {
    const agora = new Date();

    if (periodo === "week") {
        /*
         * O relatório semanal continua usando a semana atual.
         * A seleção de uma semana específica poderá ser adicionada
         * posteriormente em um campo próprio do relatório.
         */
        const inicio = obterInicioDaSemana(agora);
        const fim = new Date(inicio);

        fim.setDate(fim.getDate() + 6);
        fim.setHours(23, 59, 59, 999);

        return { inicio, fim };
    }

    /*
     * O mês do relatório é independente do filtro do histórico.
     * Assim, um mês antigo escondido no filtro não interfere
     * acidentalmente no PDF.
     */
    const valorMes = reportMonthInput?.value || "";

    if (valorMes) {
        const [ano, mes] = valorMes
            .split("-")
            .map(Number);

        const inicio = new Date(ano, mes - 1, 1);
        const fim = new Date(
            ano,
            mes,
            0,
            23,
            59,
            59,
            999
        );

        return { inicio, fim };
    }

    const inicio = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        1
    );

    const fim = new Date(
        agora.getFullYear(),
        agora.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
    );

    return { inicio, fim };
}

function definirMesAtualNoRelatorio() {
    if (!reportMonthInput) {
        return;
    }

    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = String(agora.getMonth() + 1).padStart(2, "0");
    const valorAtual = `${ano}-${mes}`;

    if (!reportMonthInput.value) {
        reportMonthInput.value = valorAtual;
    }

    /*
     * Impede selecionar meses futuros, nos quais ainda
     * não existem medições registradas.
     */
    reportMonthInput.max = valorAtual;
}

async function baixarRelatorioPdf(periodo, botao) {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const textoOriginal = botao.textContent;

    botao.disabled = true;
    botao.textContent = "Gerando PDF...";

    try {
        const { inicio, fim } = obterPeriodoPdf(periodo);

        const parametros = new URLSearchParams({
            period: periodo,
            start: formatarDataConsulta(inicio),
            end: formatarDataConsulta(fim)
        });

        const response = await fetch(
            `/api/glucose/report/pdf?${parametros.toString()}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            let mensagem = "Não foi possível gerar o PDF.";

            try {
                const erro = await response.json();
                mensagem = erro.message || mensagem;
            } catch (erroLeitura) {
                /*
                 * A resposta de erro pode não ser JSON.
                 */
            }

            throw new Error(mensagem);
        }

        const arquivo = await response.blob();
        const urlTemporaria = URL.createObjectURL(arquivo);
        const link = document.createElement("a");

        const contentDisposition =
            response.headers.get("Content-Disposition") || "";

        const nomeEncontrado = contentDisposition.match(
            /filename="?([^";]+)"?/i
        );

        link.href = urlTemporaria;

        if (periodo === "month" && reportMonthInput?.value) {
            link.download =
                `gliclog-relatorio-${reportMonthInput.value}.pdf`;
        } else {
            link.download =
                nomeEncontrado?.[1] ||
                `gliclog-relatorio-${periodo}.pdf`;
        }

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(urlTemporaria);

    } catch (error) {
        console.error(
            "Erro ao baixar relatório:",
            error
        );

        alert(
            error.message ||
            "Não foi possível gerar o relatório PDF."
        );

    } finally {
        botao.disabled = false;
        botao.textContent = textoOriginal;
    }
}

if (downloadWeekPdfBtn) {
    downloadWeekPdfBtn.addEventListener(
        "click",
        function () {
            baixarRelatorioPdf(
                "week",
                downloadWeekPdfBtn
            );
        }
    );
}

if (downloadMonthPdfBtn) {
    downloadMonthPdfBtn.addEventListener(
        "click",
        function () {
            baixarRelatorioPdf(
                "month",
                downloadMonthPdfBtn
            );
        }
    );
}

/* ============================================================
Inicialização
============================================================ */

document.addEventListener("DOMContentLoaded", function () {
    definirMesAtualNoRelatorio();
    carregarHistorico();
});