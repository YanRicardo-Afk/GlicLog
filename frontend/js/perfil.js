const nome = localStorage.getItem("userName") || "Usuário";
const email = localStorage.getItem("userEmail") || "usuario@email.com";

document.getElementById("profileName").textContent = nome;
document.getElementById("profileEmail").textContent = email;
document.getElementById("profileAvatar").textContent = nome.substring(0, 2).toUpperCase();

const registros = JSON.parse(localStorage.getItem("registros")) || [];

document.getElementById("countRegister").textContent = registros.length;

if (registros.length) {
    const media = Math.round(
        registros.reduce((a, b) => a + Number(b.glicemia), 0) / registros.length
    );
    document.getElementById("avgRegister").textContent = media;
}

document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("logado");
    window.location = "login.html";
});