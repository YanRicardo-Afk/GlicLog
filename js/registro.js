const form = document.getElementById("registroForm");
const toast = document.getElementById("toast");

form.addEventListener("submit", (e) => {
    e.preventDefault();

    const valor = Number(glicemia.value);

    if (!valor || valor < 20 || valor > 600) {
        mostrarToast("Valor inválido", true);
        return;
    }

    const registro = {
        glicemia: valor,
        tipo: tipo.value,
        hora: hora.value,
        refeicao: refeicao.value,
        obs: obs.value,
        data: new Date()
    };

    const registros = JSON.parse(localStorage.getItem("registros")) || [];
    registros.unshift(registro);
    localStorage.setItem("registros", JSON.stringify(registros));

    mostrarToast("Registro salvo!");
    form.reset();

    setTimeout(() => {
        window.location = "dashboard.html";
    }, 1000);
});

function mostrarToast(texto, erro = false) {
    toast.className = `toast ${erro ? "error" : "success"}`;
    toast.textContent = texto;
}