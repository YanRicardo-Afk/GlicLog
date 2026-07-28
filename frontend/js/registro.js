/* ============================================================
   GlicoLog — registro.js
   Criação de registros de glicemia
   ============================================================ */

const form = document.getElementById("registroForm");

const toast = document.getElementById("toast");

const glicemiaInput = document.getElementById("glicemia");

const tipoInput = document.getElementById("tipo");

const horaInput = document.getElementById("hora");

const refeicaoInput = document.getElementById("refeicao");

const obsInput = document.getElementById("obs");


/* ============================================================
   Verificar autenticação
   ============================================================ */

const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}


/* ============================================================
   Obter horário atual
   ============================================================ */

function obterHorarioAtual() {

    const agora = new Date();

    const horas = String(
        agora.getHours()
    ).padStart(2, "0");

    const minutos = String(
        agora.getMinutes()
    ).padStart(2, "0");

    return `${horas}:${minutos}`;
}


/* ============================================================
   Definir horário atual automaticamente
   ============================================================ */

function definirHorarioAtual() {

    if (!horaInput) {
        return;
    }

    /*
     * Só preenche automaticamente
     * se o campo estiver vazio.
     */
    if (!horaInput.value) {

        horaInput.value =
            obterHorarioAtual();

    }

}


/* ============================================================
   Mostrar Toast
   ============================================================ */

function mostrarToast(
    texto,
    erro = false
) {

    toast.className =
        `toast ${erro ? "error" : "success"}`;

    toast.textContent =
        texto;

}


/* ============================================================
   Inicialização
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        definirHorarioAtual();

    }
);


/* ============================================================
   Enviar registro
   ============================================================ */

form.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        /* ----------------------------------------------------
           Pegar valores
           ---------------------------------------------------- */

        const valor =
            Number(
                glicemiaInput.value
            );


        const tipo =
            tipoInput.value;


        /*
         * Se o horário estiver vazio,
         * usar o horário atual.
         */
        const hora =
            horaInput.value ||
            obterHorarioAtual();


        const refeicao =
            refeicaoInput.value.trim();


        const obs =
            obsInput.value.trim();


        /* ----------------------------------------------------
           Validar glicemia
           ---------------------------------------------------- */

        if (
            !valor ||
            valor < 20 ||
            valor > 600
        ) {

            mostrarToast(
                "Informe um valor de glicemia válido.",
                true
            );

            glicemiaInput.focus();

            return;

        }


        /* ----------------------------------------------------
           Validar horário
           ---------------------------------------------------- */

        if (!hora) {

            mostrarToast(
                "Não foi possível obter o horário da medição.",
                true
            );

            return;

        }


        /*
         * Garantir que o campo visual
         * também tenha o horário.
         */
        horaInput.value =
            hora;


        /* ----------------------------------------------------
           Botão
           ---------------------------------------------------- */

        const submitButton =
            form.querySelector(
                'button[type="submit"]'
            );


        if (submitButton) {

            submitButton.disabled =
                true;

            submitButton.textContent =
                "Salvando...";

        }


        try {

            /* ------------------------------------------------
               Enviar para o backend
               ------------------------------------------------ */
                console.log("DADOS ENVIADOS PARA API:", {
                    glucoseValue: valor,
                    measurementType: tipo,
                    measurementTime: hora,
                    meal: refeicao,
                    notes: obs
                });
                
            await apiRequest(
                "/glucose",
                {
                    method: "POST",

                    body:
                        JSON.stringify({

                            /*
                             * Valor da glicemia
                             */
                            glucoseValue:
                                valor,

                            /*
                             * Tipo da medição
                             */
                            measurementType:
                                tipo || null,

                            /*
                             * IMPORTANTE:
                             *
                             * O backend espera
                             * measurementTime.
                             */
                            measurementTime:
                                hora,

                            /*
                             * Refeição
                             */
                            meal:
                                refeicao || null,

                            /*
                             * Observações
                             */
                            notes:
                                obs || null

                        })
                }
            );


            /* ------------------------------------------------
               Sucesso
               ------------------------------------------------ */

            mostrarToast(
                "✓ Registro salvo com sucesso!"
            );


            /*
             * Limpar formulário
             */
            form.reset();


            /*
             * Definir novamente
             * o horário atual.
             */
            definirHorarioAtual();


            /*
             * Voltar para Dashboard
             */
            setTimeout(
                function() {

                    window.location.href =
                        "dashboard.html";

                },
                1000
            );


        } catch (error) {

            console.error(
                "Erro ao salvar registro:",
                error
            );


            mostrarToast(
                error.message ||
                "Não foi possível salvar o registro.",
                true
            );


        } finally {

            if (submitButton) {

                submitButton.disabled =
                    false;

                submitButton.textContent =
                    "Salvar Registro";

            }

        }

    }
);