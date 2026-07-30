const PDFDocument = require("pdfkit");
const SVGtoPDF = require("svg-to-pdfkit");
const fs = require("fs");
const path = require("path");

const pool = require("../config/database");

/* ============================================================
Normalizar textos

Remove acentos, transforma em minúsculo e facilita
a identificação do tipo de medição e da refeição.
============================================================ */

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

/* ============================================================
Converter horário para minutos
============================================================ */

function horarioParaMinutos(horario) {
    if (!horario) {
        return null;
    }

    const partes = String(horario)
        .substring(0, 5)
        .split(":");

    if (partes.length !== 2) {
        return null;
    }

    const horas = Number(partes[0]);
    const minutos = Number(partes[1]);

    if (
        Number.isNaN(horas) ||
        Number.isNaN(minutos)
    ) {
        return null;
    }

    return horas * 60 + minutos;
}

/* ============================================================
Classificar registro

Primeiro tenta usar o tipo e a refeição informados.
Caso não consiga, usa o horário da medição.
============================================================ */

function classificarRegistro(registro) {
    const tipo = normalizarTexto(registro.measurementType);
    const refeicao = normalizarTexto(registro.meal);

    const antesDaRefeicao =
        tipo.includes("pre") ||
        tipo.includes("antes");

    const depoisDaRefeicao =
        tipo.includes("pos") ||
        tipo.includes("depois");

    /* Jejum */

    if (
        tipo.includes("jejum") ||
        refeicao.includes("jejum")
    ) {
        return "jejum";
    }

    /* Café da manhã */

    if (
        refeicao.includes("cafe") ||
        refeicao.includes("manha")
    ) {
        if (depoisDaRefeicao) {
            return "depoisCafe";
        }

        /*
         * Caso esteja marcado como antes do café,
         * consideramos como jejum.
         */
        if (antesDaRefeicao) {
            return "jejum";
        }
    }

    /* Almoço */

    if (refeicao.includes("almoco")) {
        if (depoisDaRefeicao) {
            return "depoisAlmoco";
        }

        if (antesDaRefeicao) {
            return "antesAlmoco";
        }
    }

    /* Jantar */

    if (
        refeicao.includes("jantar") ||
        refeicao.includes("janta")
    ) {
        if (depoisDaRefeicao) {
            return "depoisJanta";
        }

        if (antesDaRefeicao) {
            return "antesJanta";
        }
    }

    /* Ceia / antes de dormir */

    if (
        refeicao.includes("ceia") ||
        tipo.includes("ceia") ||
        tipo.includes("dormir") ||
        refeicao.includes("dormir")
    ) {
        return "ceia";
    }

    /* Madrugada */

    if (
        tipo.includes("madrugada") ||
        refeicao.includes("madrugada")
    ) {
        return "madrugada";
    }

    /* ========================================================
    Classificação pelo horário
    ======================================================== */

    const minutos = horarioParaMinutos(
        registro.measurementTime
    );

    if (minutos === null) {
        return "outros";
    }

    /*
     * 00:00 até 04:59
     */
    if (minutos < 5 * 60) {
        return "madrugada";
    }

    /*
     * 05:00 até 08:29
     */
    if (minutos < 8 * 60 + 30) {
        return "jejum";
    }

    /*
     * 08:30 até 10:59
     */
    if (minutos < 11 * 60) {
        return "depoisCafe";
    }

    /*
     * 11:00 até 13:29
     */
    if (minutos < 13 * 60 + 30) {
        return "antesAlmoco";
    }

    /*
     * 13:30 até 16:59
     */
    if (minutos < 17 * 60) {
        return "depoisAlmoco";
    }

    /*
     * 17:00 até 19:59
     */
    if (minutos < 20 * 60) {
        return "antesJanta";
    }

    /*
     * 20:00 até 22:29
     */
    if (minutos < 22 * 60 + 30) {
        return "depoisJanta";
    }

    /*
     * 22:30 até 23:59
     */
    return "ceia";
}

/* ============================================================
Formatação de datas
============================================================ */

function formatarDataBrasileira(data) {
    const objetoData = new Date(data);

    if (Number.isNaN(objetoData.getTime())) {
        return "--/--/----";
    }

    return objetoData.toLocaleDateString(
        "pt-BR",
        {
            timeZone: "America/Recife"
        }
    );
}

function formatarDataParaBanco(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

function obterInicioDaSemana(data) {
    const resultado = new Date(data);

    const diaDaSemana = resultado.getDay();

    /*
     * Domingo = 0
     * Segunda = 1
     */
    const diferenca =
        diaDaSemana === 0
            ? -6
            : 1 - diaDaSemana;

    resultado.setDate(
        resultado.getDate() + diferenca
    );

    resultado.setHours(0, 0, 0, 0);

    return resultado;
}

/* ============================================================
Determinar período do relatório
============================================================ */

function obterPeriodoRelatorio(query) {
    const periodo = query.period || "month";

    /*
     * Período personalizado enviado pelo frontend.
     */
    if (query.start && query.end) {
        const inicio = new Date(`${query.start}T00:00:00`);
        const fim = new Date(`${query.end}T23:59:59`);

        if (
            !Number.isNaN(inicio.getTime()) &&
            !Number.isNaN(fim.getTime())
        ) {
            return {
                inicio,
                fim,
                titulo:
                    periodo === "week"
                        ? "Relatório glicêmico semanal"
                        : "Relatório glicêmico mensal"
            };
        }
    }

    const hoje = new Date();

    /*
     * Semana atual
     */
    if (periodo === "week") {
        const inicio = obterInicioDaSemana(hoje);

        const fim = new Date(inicio);
        fim.setDate(fim.getDate() + 6);
        fim.setHours(23, 59, 59, 999);

        return {
            inicio,
            fim,
            titulo: "Relatório glicêmico semanal"
        };
    }

    /*
     * Mês atual
     */
    const inicio = new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        1
    );

    const fim = new Date(
        hoje.getFullYear(),
        hoje.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
    );

    return {
        inicio,
        fim,
        titulo: "Relatório glicêmico mensal"
    };
}

/* ============================================================
Status da glicemia
============================================================ */

function obterStatusGlicemia(valor) {
    const numero = Number(valor);

    if (numero < 70) {
        return {
            texto: "Baixa",
            cor: "#DCEEFF",
            corTexto: "#245A8D"
        };
    }

    if (numero <= 180) {
        return {
            texto: "No alvo",
            cor: "#E5F5E8",
            corTexto: "#276738"
        };
    }

    if (numero <= 250) {
        return {
            texto: "Alta",
            cor: "#FFF2CC",
            corTexto: "#876500"
        };
    }

    return {
        texto: "Muito alta",
        cor: "#FADDDD",
        corTexto: "#922B2B"
    };
}

/* ============================================================
Agrupar registros por dia
============================================================ */

function agruparRegistrosPorDia(registros) {
    const dias = {};

    registros.forEach(function (registro) {
        const data = new Date(registro.createdAt);

        if (Number.isNaN(data.getTime())) {
            return;
        }

        const chave = formatarDataParaBanco(data);
        const categoria = classificarRegistro(registro);

        if (!dias[chave]) {
            dias[chave] = {
                data,
                jejum: [],
                depoisCafe: [],
                antesAlmoco: [],
                depoisAlmoco: [],
                antesJanta: [],
                depoisJanta: [],
                ceia: [],
                madrugada: [],
                outros: []
            };
        }

        dias[chave][categoria].push(registro);
    });

    return Object.values(dias).sort(function (a, b) {
        return a.data - b.data;
    });
}

/* ============================================================
Formatar conteúdo da célula

Se houver mais de uma medição na mesma categoria,
elas aparecem uma abaixo da outra.
============================================================ */

function formatarMedicoesCelula(registros, mostrarDetalhes = false) {
    if (!registros || registros.length === 0) {
        return "—";
    }

    return registros
        .sort(function (a, b) {
            return String(a.measurementTime || "")
                .localeCompare(String(b.measurementTime || ""));
        })
        .map(function (registro) {
            const valor = `${registro.glucoseValue} mg/dL`;

            /*
             * Nas categorias previstas, o título da coluna já informa
             * o momento da medição. Por isso, exibimos somente o valor.
             */
            if (!mostrarDetalhes) {
                return valor;
            }

            /*
             * Em "Outras medições", o horário é importante porque não
             * existe uma categoria fixa que indique quando o teste ocorreu.
             */
            const horario = String(
                registro.measurementTime || "--:--"
            ).substring(0, 5);

            const observacao = String(registro.notes || "").trim();

            if (observacao) {
                return `${horario} — ${valor}\n${observacao}`;
            }

            return `${horario} — ${valor}`;
        })
        .join("\n");
}

/* ============================================================
Calcular estatísticas
============================================================ */

function calcularEstatisticas(registros) {
    if (registros.length === 0) {
        return {
            total: 0,
            media: 0,
            menor: 0,
            maior: 0,
            hipoglicemias: 0,
            hiperglicemias: 0,
            noAlvo: 0,
            percentualNoAlvo: 0
        };
    }

    const valores = registros.map(function (registro) {
        return Number(registro.glucoseValue);
    });

    const soma = valores.reduce(function (total, valor) {
        return total + valor;
    }, 0);

    const hipoglicemias = valores.filter(function (valor) {
        return valor < 70;
    }).length;

    const noAlvo = valores.filter(function (valor) {
        return valor >= 70 && valor <= 180;
    }).length;

    const hiperglicemias = valores.filter(function (valor) {
        return valor > 180;
    }).length;

    return {
        total: valores.length,
        media: Math.round(soma / valores.length),
        menor: Math.min(...valores),
        maior: Math.max(...valores),
        hipoglicemias,
        hiperglicemias,
        noAlvo,
        percentualNoAlvo: Math.round(
            (noAlvo / valores.length) * 100
        )
    };
}

/* ============================================================
Adicionar logo

O caminho esperado é:
frontend/assets/logo.svg
============================================================ */

function adicionarLogo(doc) {
    const caminhoLogo = path.join(
        __dirname,
        "../../../frontend/assets/logo.svg"
    );

    if (!fs.existsSync(caminhoLogo)) {
        return false;
    }

    try {
        const svg = fs.readFileSync(
            caminhoLogo,
            "utf8"
        );

        SVGtoPDF(
            doc,
            svg,
            40,
            25,
            {
                width: 115,
                height: 45,
                preserveAspectRatio: "xMinYMid meet"
            }
        );

        return true;

    } catch (error) {
        console.error(
            "Não foi possível adicionar a logo ao PDF:",
            error
        );

        return false;
    }
}

/* ============================================================
Cabeçalho do relatório
============================================================ */

function desenharCabecalho(
    doc,
    titulo,
    inicio,
    fim,
    estatisticas
) {
    const temLogo = adicionarLogo(doc);

    if (!temLogo) {
        doc
            .font("Helvetica-Bold")
            .fontSize(21)
            .fillColor("#234D3D")
            .text(
                "GlicLog",
                40,
                30
            );
    }

    doc
        .font("Helvetica-Bold")
        .fontSize(17)
        .fillColor("#234D3D")
        .text(
            titulo,
            175,
            29,
            {
                width: 560,
                align: "center"
            }
        );

    doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#555555")
        .text(
            `Período: ${formatarDataBrasileira(inicio)} até ${formatarDataBrasileira(fim)}`,
            175,
            53,
            {
                width: 560,
                align: "center"
            }
        );

    doc
        .moveTo(40, 82)
        .lineTo(802, 82)
        .lineWidth(1)
        .strokeColor("#C8DDD8")
        .stroke();

    const caixas = [
        {
            titulo: "Medições",
            valor: estatisticas.total
        },
        {
            titulo: "Média",
            valor: `${estatisticas.media} mg/dL`
        },
        {
            titulo: "Menor",
            valor: `${estatisticas.menor} mg/dL`
        },
        {
            titulo: "Maior",
            valor: `${estatisticas.maior} mg/dL`
        },
        {
            titulo: "Dentro do alvo",
            valor: `${estatisticas.percentualNoAlvo}%`
        }
    ];

    const larguraCaixa = 140;
    const espacamento = 15;
    const inicioX = 40;
    const caixaY = 96;

    caixas.forEach(function (caixa, indice) {
        const x =
            inicioX +
            indice * (larguraCaixa + espacamento);

        doc
            .roundedRect(
                x,
                caixaY,
                larguraCaixa,
                52,
                6
            )
            .fillAndStroke(
                "#F5FAF8",
                "#C8DDD8"
            );

        doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor("#4A6058")
            .text(
                caixa.titulo,
                x + 8,
                caixaY + 8,
                {
                    width: larguraCaixa - 16,
                    align: "center"
                }
            );

        doc
            .font("Helvetica-Bold")
            .fontSize(12)
            .fillColor("#234D3D")
            .text(
                String(caixa.valor),
                x + 8,
                caixaY + 27,
                {
                    width: larguraCaixa - 16,
                    align: "center"
                }
            );
    });

    return 168;
}

/* ============================================================
Cabeçalho da tabela
============================================================ */

const colunas = [
    {
        chave: "data",
        titulo: "Data",
        largura: 60
    },
    {
        chave: "jejum",
        titulo: "Jejum",
        largura: 72
    },
    {
        chave: "depoisCafe",
        titulo: "Depois do\ncafé",
        largura: 76
    },
    {
        chave: "antesAlmoco",
        titulo: "Antes do\nalmoço",
        largura: 80
    },
    {
        chave: "depoisAlmoco",
        titulo: "Depois do\nalmoço",
        largura: 80
    },
    {
        chave: "antesJanta",
        titulo: "Antes da\njanta",
        largura: 80
    },
    {
        chave: "depoisJanta",
        titulo: "Depois da\njanta",
        largura: 80
    },
    {
        chave: "ceia",
        titulo: "Ceia",
        largura: 68
    },
    {
        chave: "madrugada",
        titulo: "Madrugada",
        largura: 76
    },
    {
        chave: "outros",
        titulo: "Outras\nmedições",
        largura: 84
    }
];

function desenharCabecalhoTabela(doc, y) {
    const inicioX = 40;
    const altura = 38;

    let x = inicioX;

    colunas.forEach(function (coluna) {
        doc
            .rect(
                x,
                y,
                coluna.largura,
                altura
            )
            .fillAndStroke(
                "#3D8B6E",
                "#2A6350"
            );

        doc
            .font("Helvetica-Bold")
            .fontSize(7.5)
            .fillColor("#FFFFFF")
            .text(
                coluna.titulo,
                x + 4,
                y + 9,
                {
                    width: coluna.largura - 8,
                    align: "center",
                    lineGap: 1
                }
            );

        x += coluna.largura;
    });

    return y + altura;
}

/* ============================================================
Altura necessária para uma linha
============================================================ */

function calcularAlturaLinha(dia) {
    const categorias = [
        dia.jejum,
        dia.depoisCafe,
        dia.antesAlmoco,
        dia.depoisAlmoco,
        dia.antesJanta,
        dia.depoisJanta,
        dia.ceia,
        dia.madrugada,
        dia.outros
    ];

    const maiorQuantidade = Math.max(
        1,
        ...categorias.map(function (registros) {
            return registros.length;
        })
    );

    const observacoesAvulsas = dia.outros.filter(function (registro) {
        return String(registro.notes || "").trim();
    }).length;

    return Math.max(
        38,
        maiorQuantidade * 15 + observacoesAvulsas * 10 + 10
    );
}

/* ============================================================
Desenhar uma linha da tabela
============================================================ */

function desenharLinhaTabela(
    doc,
    dia,
    y,
    indice
) {
    const altura = calcularAlturaLinha(dia);

    const fundo =
        indice % 2 === 0
            ? "#FFFFFF"
            : "#F5FAF8";

    let x = 40;

    colunas.forEach(function (coluna) {
        let conteudo = "";

        if (coluna.chave === "data") {
            conteudo = formatarDataBrasileira(
                dia.data
            );
        } else {
            conteudo = formatarMedicoesCelula(
                dia[coluna.chave],
                coluna.chave === "outros"
            );
        }

        doc
            .rect(
                x,
                y,
                coluna.largura,
                altura
            )
            .fillAndStroke(
                fundo,
                "#C8DDD8"
            );

        doc
            .font(
                coluna.chave === "data"
                    ? "Helvetica-Bold"
                    : "Helvetica"
            )
            .fontSize(
                coluna.chave === "data"
                    ? 7.7
                    : 6.7
            )
            .fillColor("#1E2D2A")
            .text(
                conteudo,
                x + 4,
                y + 7,
                {
                    width: coluna.largura - 8,
                    height: altura - 10,
                    align: "center",
                    lineGap: 1,
                    ellipsis: true
                }
            );

        x += coluna.largura;
    });

    return y + altura;
}

/* ============================================================
Legenda das cores
============================================================ */

function desenharLegenda(doc, y) {
    const itens = [
        {
            texto: "Baixa: abaixo de 70 mg/dL",
            cor: "#DCEEFF"
        },
        {
            texto: "No alvo: 70 a 180 mg/dL",
            cor: "#E5F5E8"
        },
        {
            texto: "Alta: acima de 180 mg/dL",
            cor: "#FFF2CC"
        },
        {
            texto: "Muito alta: acima de 250 mg/dL",
            cor: "#FADDDD"
        }
    ];

    let x = 40;

    doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#234D3D")
        .text(
            "Referência utilizada no resumo:",
            x,
            y
        );

    x += 147;

    itens.forEach(function (item) {
        doc
            .rect(
                x,
                y - 1,
                9,
                9
            )
            .fill(item.cor);

        doc
            .font("Helvetica")
            .fontSize(7)
            .fillColor("#555555")
            .text(
                item.texto,
                x + 13,
                y,
                {
                    width: 122
                }
            );

        x += 138;
    });
}

/* ============================================================
Rodapé
============================================================ */

function adicionarRodapesTodasPaginas(doc) {
    const intervalo = doc.bufferedPageRange();
    const totalPaginas = intervalo.count;

    for (let indice = 0; indice < totalPaginas; indice += 1) {
        doc.switchToPage(intervalo.start + indice);

        const yLinha = doc.page.height - 31;
        const yTexto = doc.page.height - 24;
        const margemInferiorOriginal = doc.page.margins.bottom;

        doc.page.margins.bottom = 0;

        doc
            .moveTo(40, yLinha)
            .lineTo(doc.page.width - 40, yLinha)
            .lineWidth(0.6)
            .strokeColor("#C8DDD8")
            .stroke();

        doc
            .font("Helvetica")
            .fontSize(7)
            .fillColor("#7A9490")
            .text(
                `Página ${indice + 1} de ${totalPaginas} • Relatório gerado pelo GlicLog`,
                40,
                yTexto,
                {
                    width: doc.page.width - 80,
                    align: "center",
                    lineBreak: false
                }
            );

        doc.page.margins.bottom = margemInferiorOriginal;
    }
}

/* ============================================================
Gerar PDF
============================================================ */

async function generateGlucosePdf(req, res) {
    try {
        const userId = req.userId;

        const {
            inicio,
            fim,
            titulo
        } = obterPeriodoRelatorio(req.query);

        const inicioBanco = formatarDataParaBanco(inicio);
        const fimBanco = formatarDataParaBanco(fim);

        const [registros] = await pool.query(
            `
            SELECT
                id,
                glucose_value AS glucoseValue,
                measurement_type AS measurementType,
                measurement_time AS measurementTime,
                meal,
                notes,
                created_at AS createdAt
            FROM glucose_records
            WHERE user_id = ?
            AND DATE(created_at) BETWEEN ? AND ?
            ORDER BY created_at ASC, measurement_time ASC
            `,
            [
                userId,
                inicioBanco,
                fimBanco
            ]
        );

        const estatisticas =
            calcularEstatisticas(registros);

        const dias =
            agruparRegistrosPorDia(registros);

        const documento = new PDFDocument({
            size: "A4",
            layout: "landscape",
            margin: 40,
            bufferPages: true,
            info: {
                Title: titulo,
                Author: "GlicLog",
                Subject: "Relatório de glicemia",
                Creator: "GlicLog"
            }
        });

        const nomeArquivo =
            req.query.period === "week"
                ? "gliclog-relatorio-semanal.pdf"
                : "gliclog-relatorio-mensal.pdf";

        res.setHeader(
            "Content-Type",
            "application/pdf"
        );

        res.setHeader(
            "Content-Disposition",
            `attachment; filename="${nomeArquivo}"`
        );

        documento.pipe(res);

        let y = desenharCabecalho(
            documento,
            titulo,
            inicio,
            fim,
            estatisticas
        );

        if (registros.length === 0) {
            documento
                .roundedRect(
                    40,
                    y + 15,
                    762,
                    100,
                    8
                )
                .fillAndStroke(
                    "#F5FAF8",
                    "#C8DDD8"
                );

            documento
                .font("Helvetica-Bold")
                .fontSize(14)
                .fillColor("#234D3D")
                .text(
                    "Nenhuma medição encontrada",
                    60,
                    y + 43,
                    {
                        width: 722,
                        align: "center"
                    }
                );

            documento
                .font("Helvetica")
                .fontSize(9)
                .fillColor("#666666")
                .text(
                    "Não existem registros de glicemia no período selecionado.",
                    60,
                    y + 68,
                    {
                        width: 722,
                        align: "center"
                    }
                );

            adicionarRodapesTodasPaginas(documento);
            documento.end();

            return;
        }

        y = desenharCabecalhoTabela(
            documento,
            y
        );

        dias.forEach(function (dia, indice) {
            const alturaLinha =
                calcularAlturaLinha(dia);

            /*
             * Se a próxima linha não couber,
             * cria uma nova página.
             */
            if (y + alturaLinha > 548) {
                documento.addPage();

                adicionarLogo(documento);

                documento
                    .font("Helvetica-Bold")
                    .fontSize(12)
                    .fillColor("#234D3D")
                    .text(
                        titulo,
                        175,
                        35,
                        {
                            width: 560,
                            align: "center"
                        }
                    );

                documento
                    .font("Helvetica")
                    .fontSize(8)
                    .fillColor("#666666")
                    .text(
                        `${formatarDataBrasileira(inicio)} até ${formatarDataBrasileira(fim)}`,
                        175,
                        53,
                        {
                            width: 560,
                            align: "center"
                        }
                    );

                y = desenharCabecalhoTabela(
                    documento,
                    83
                );
            }

            y = desenharLinhaTabela(
                documento,
                dia,
                y,
                indice
            );
        });

        if (y + 34 < 548) {
            desenharLegenda(
                documento,
                y + 17
            );
        }

        adicionarRodapesTodasPaginas(documento);

        documento.end();

    } catch (error) {
        console.error(
            "Erro ao gerar relatório de glicemia:",
            error
        );

        /*
         * Só podemos enviar JSON caso o PDF ainda
         * não tenha começado a ser enviado.
         */
        if (!res.headersSent) {
            return res.status(500).json({
                message:
                    "Não foi possível gerar o relatório de glicemia."
            });
        }

        res.end();
    }
}

module.exports = {
    generateGlucosePdf
};