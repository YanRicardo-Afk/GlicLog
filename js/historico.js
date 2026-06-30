const lista = document.getElementById("historyList");
const vazio = document.getElementById("empty");

const registros = JSON.parse(localStorage.getItem("registros")) || [];

if (registros.length) {
    vazio.remove();
    registros.forEach(criarRegistro);
}

function criarRegistro(item) {
    const li = document.createElement("li");
    const status = obterStatus(item.glicemia);

    li.className = "history-item";
    li.innerHTML = `
        <div class="history-left">
            <div class="history-dot ${status.classe}"></div>
            <div class="history-info">
                <span class="history-value">${item.glicemia} mg/dL</span>
                <span class="history-meta">${item.tipo} • ${item.hora}</span>
            </div>
        </div>
        <div class="history-right">
            <div class="history-date">${formatarData(item.data)}</div>
            <div class="history-status">${status.texto}</div>
        </div>
    `;

    lista.append(li);
}

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

function formatarData(data) {
    return new Date(data).toLocaleDateString("pt-BR");
}