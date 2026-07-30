/* ============================================================
   GlicoLog — accessibility.js
   Preferências globais de acessibilidade
   ============================================================ */

(function () {
    "use strict";

    const STORAGE_KEY_FONT_SIZE = "gliclog-font-size";
    const STORAGE_KEY_HIGH_CONTRAST = "gliclog-high-contrast";

    const TAMANHOS_VALIDOS = ["small", "normal", "large"];

    function obterTamanhoFonteSalvo() {
        const tamanho = localStorage.getItem(STORAGE_KEY_FONT_SIZE);

        return TAMANHOS_VALIDOS.includes(tamanho)
            ? tamanho
            : "normal";
    }

    function obterAltoContrasteSalvo() {
        return localStorage.getItem(STORAGE_KEY_HIGH_CONTRAST) === "true";
    }

    function atualizarControlesFonte(tamanho) {
        const controles = document.querySelectorAll(
            'input[name="fontSizePreference"]'
        );

        controles.forEach(function (controle) {
            controle.checked = controle.value === tamanho;
        });
    }

    function atualizarControleContraste(ativo) {
        const controle = document.getElementById("highContrastPreference");

        if (controle) {
            controle.checked = ativo;
        }

        const estado = document.getElementById("highContrastState");

        if (estado) {
            estado.textContent = ativo ? "Ativado" : "Desativado";
        }
    }

    function anunciarAlteracao(mensagem) {
        const regiaoStatus = document.getElementById("accessibilityStatus");

        if (!regiaoStatus) {
            return;
        }

        regiaoStatus.textContent = "";

        window.requestAnimationFrame(function () {
            regiaoStatus.textContent = mensagem;
        });
    }

    function aplicarTamanhoFonte(tamanho, salvar = false, anunciar = false) {
        const tamanhoValido = TAMANHOS_VALIDOS.includes(tamanho)
            ? tamanho
            : "normal";

        document.documentElement.dataset.fontSize = tamanhoValido;

        if (salvar) {
            localStorage.setItem(STORAGE_KEY_FONT_SIZE, tamanhoValido);
        }

        atualizarControlesFonte(tamanhoValido);

        if (anunciar) {
            const mensagens = {
                small: "Tamanho de fonte pequeno ativado.",
                normal: "Tamanho de fonte normal ativado.",
                large: "Tamanho de fonte grande ativado."
            };

            anunciarAlteracao(mensagens[tamanhoValido]);
        }

        window.dispatchEvent(
            new CustomEvent("gliclog:fontsizechange", {
                detail: {
                    fontSize: tamanhoValido
                }
            })
        );
    }

    function aplicarAltoContraste(ativo, salvar = false, anunciar = false) {
        const contrasteAtivo = Boolean(ativo);

        document.documentElement.dataset.contrast =
            contrasteAtivo ? "high" : "normal";

        if (salvar) {
            localStorage.setItem(
                STORAGE_KEY_HIGH_CONTRAST,
                String(contrasteAtivo)
            );
        }

        atualizarControleContraste(contrasteAtivo);

        if (anunciar) {
            anunciarAlteracao(
                contrasteAtivo
                    ? "Alto contraste ativado."
                    : "Alto contraste desativado."
            );
        }

        window.dispatchEvent(
            new CustomEvent("gliclog:contrastchange", {
                detail: {
                    highContrast: contrasteAtivo
                }
            })
        );
    }

    function iniciarControles() {
        const controlesFonte = document.querySelectorAll(
            'input[name="fontSizePreference"]'
        );

        controlesFonte.forEach(function (controle) {
            controle.addEventListener("change", function () {
                if (controle.checked) {
                    aplicarTamanhoFonte(controle.value, true, true);
                }
            });
        });

        const controleContraste =
            document.getElementById("highContrastPreference");

        if (controleContraste) {
            controleContraste.addEventListener("change", function () {
                aplicarAltoContraste(
                    controleContraste.checked,
                    true,
                    true
                );
            });
        }

        atualizarControlesFonte(obterTamanhoFonteSalvo());
        atualizarControleContraste(obterAltoContrasteSalvo());
    }

    aplicarTamanhoFonte(obterTamanhoFonteSalvo());
    aplicarAltoContraste(obterAltoContrasteSalvo());

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarControles);
    } else {
        iniciarControles();
    }

    window.GlicoLogAccessibility = {
        aplicarTamanhoFonte: function (tamanho) {
            aplicarTamanhoFonte(tamanho, true, true);
        },

        obterTamanhoFonte: obterTamanhoFonteSalvo,

        aplicarAltoContraste: function (ativo) {
            aplicarAltoContraste(ativo, true, true);
        },

        obterAltoContraste: obterAltoContrasteSalvo
    };
})();