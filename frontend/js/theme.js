/* ============================================================
   GlicoLog — theme.js
   Controle global dos temas claro, escuro e sistema
   ============================================================ */

(function () {
    "use strict";

    const STORAGE_KEY = "gliclog-theme";
    const TEMAS_VALIDOS = ["light", "dark", "system"];
    const mediaTemaEscuro = window.matchMedia("(prefers-color-scheme: dark)");

    function obterPreferenciaSalva() {
        const preferencia = localStorage.getItem(STORAGE_KEY);

        return TEMAS_VALIDOS.includes(preferencia)
            ? preferencia
            : "system";
    }

    function resolverTema(preferencia) {
        if (preferencia === "system") {
            return mediaTemaEscuro.matches ? "dark" : "light";
        }

        return preferencia;
    }

    function aplicarTema(preferencia, salvar = false) {
        const preferenciaValida = TEMAS_VALIDOS.includes(preferencia)
            ? preferencia
            : "system";

        const temaResolvido = resolverTema(preferenciaValida);
        const raiz = document.documentElement;

        raiz.dataset.theme = temaResolvido;
        raiz.dataset.themePreference = preferenciaValida;

        if (salvar) {
            localStorage.setItem(STORAGE_KEY, preferenciaValida);
        }

        atualizarControles(preferenciaValida);

        window.dispatchEvent(
            new CustomEvent("gliclog:themechange", {
                detail: {
                    preference: preferenciaValida,
                    theme: temaResolvido
                }
            })
        );
    }

    function atualizarControles(preferencia) {
        const controles = document.querySelectorAll(
            'input[name="themePreference"]'
        );

        controles.forEach(function (controle) {
            controle.checked = controle.value === preferencia;
        });
    }

    function iniciarControles() {
        const controles = document.querySelectorAll(
            'input[name="themePreference"]'
        );

        controles.forEach(function (controle) {
            controle.addEventListener("change", function () {
                if (controle.checked) {
                    aplicarTema(controle.value, true);
                }
            });
        });

        atualizarControles(obterPreferenciaSalva());
    }

    function tratarMudancaDoSistema() {
        if (obterPreferenciaSalva() === "system") {
            aplicarTema("system");
        }
    }

    aplicarTema(obterPreferenciaSalva());

    if (typeof mediaTemaEscuro.addEventListener === "function") {
        mediaTemaEscuro.addEventListener("change", tratarMudancaDoSistema);
    } else {
        mediaTemaEscuro.addListener(tratarMudancaDoSistema);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", iniciarControles);
    } else {
        iniciarControles();
    }

    window.GlicoLogTheme = {
        aplicar: function (preferencia) {
            aplicarTema(preferencia, true);
        },
        obterPreferencia: obterPreferenciaSalva,
        obterTemaAtual: function () {
            return document.documentElement.dataset.theme;
        }
    };
})();