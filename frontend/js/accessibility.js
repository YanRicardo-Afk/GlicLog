/* ============================================================
   GlicoLog — accessibility.js
   Preferências globais de acessibilidade
   ============================================================ */

(function () {
    "use strict";

    const STORAGE_KEY_FONT_SIZE = "gliclog-font-size";
    const TAMANHOS_VALIDOS = ["small", "normal", "large"];

    function obterTamanhoFonteSalvo() {
        const tamanho = localStorage.getItem(STORAGE_KEY_FONT_SIZE);

        return TAMANHOS_VALIDOS.includes(tamanho)
            ? tamanho
            : "normal";
    }

    function atualizarControles(tamanho) {
        const controles = document.querySelectorAll(
            'input[name="fontSizePreference"]'
        );

        controles.forEach(function (controle) {
            controle.checked = controle.value === tamanho;
        });
    }

    function anunciarAlteracao(tamanho) {
        const mensagens = {
            small: "Tamanho de fonte pequeno ativado.",
            normal: "Tamanho de fonte normal ativado.",
            large: "Tamanho de fonte grande ativado."
        };

        const regiaoStatus = document.getElementById("accessibilityStatus");

        if (regiaoStatus) {
            regiaoStatus.textContent = mensagens[tamanho];
        }
    }

    function aplicarTamanhoFonte(tamanho, salvar = false, anunciar = false) {
        const tamanhoValido = TAMANHOS_VALIDOS.includes(tamanho)
            ? tamanho
            : "normal";

        document.documentElement.dataset.fontSize = tamanhoValido;

        if (salvar) {
            localStorage.setItem(STORAGE_KEY_FONT_SIZE, tamanhoValido);
        }

        atualizarControles(tamanhoValido);

        if (anunciar) {
            anunciarAlteracao(tamanhoValido);
        }

        window.dispatchEvent(
            new CustomEvent("gliclog:fontsizechange", {
                detail: {
                    fontSize: tamanhoValido
                }
            })
        );
    }

    function iniciarControles() {
        const controles = document.querySelectorAll(
            'input[name="fontSizePreference"]'
        );

        controles.forEach(function (controle) {
            controle.addEventListener("change", function () {
                if (controle.checked) {
                    aplicarTamanhoFonte(controle.value, true, true);
                }
            });
        });

        atualizarControles(obterTamanhoFonteSalvo());
    }

    aplicarTamanhoFonte(obterTamanhoFonteSalvo());

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarControles);
    } else {
        iniciarControles();
    }

    window.GlicoLogAccessibility = {
        aplicarTamanhoFonte: function (tamanho) {
            aplicarTamanhoFonte(tamanho, true, true);
        },
        obterTamanhoFonte: obterTamanhoFonteSalvo
    };
})();