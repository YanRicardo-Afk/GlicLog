const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {

    try {
        // Pegar o header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Token de autenticação não informado."
            });
        }

        // Esperamos:
        // Bearer TOKEN
        const parts = authHeader.split(" ");

        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer"
        ) {
            return res.status(401).json({
                message: "Formato do token inválido."
            });
        }

        const token = parts[1];

        // Verificar token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Salvar ID do usuário na requisição
        req.userId = decoded.userId;

        // Continuar para a próxima função
        next();

    } catch (error) {

        console.error(
            "Erro na autenticação:",
            error.message
        );

        return res.status(401).json({
            message: "Token inválido ou expirado."
        });
    }
}

module.exports = authMiddleware;