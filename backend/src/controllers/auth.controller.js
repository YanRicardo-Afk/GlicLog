const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../config/database");

async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        // 1. Validar dados obrigatórios
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Nome, e-mail e senha são obrigatórios."
            });
        }

        // 2. Validar tamanho mínimo da senha
        if (password.length < 6) {
            return res.status(400).json({
                message: "A senha deve ter pelo menos 6 caracteres."
            });
        }

        // 3. Verificar se o e-mail já existe
        const [existingUsers] = await pool.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                message: "Este e-mail já está cadastrado."
            });
        }

        // 4. Criptografar a senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Criar usuário
        const [result] = await pool.query(
            `
            INSERT INTO users
                (name, email, password)
            VALUES
                (?, ?, ?)
            `,
            [
                name,
                email,
                hashedPassword
            ]
        );

        return res.status(201).json({
            message: "Usuário cadastrado com sucesso!",
            user: {
                id: result.insertId,
                name,
                email
            }
        });

    } catch (error) {
        console.error("Erro no cadastro:", error);

        return res.status(500).json({
            message: "Erro interno do servidor."
        });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        // 1. Validar dados
        if (!email || !password) {
            return res.status(400).json({
                message: "E-mail e senha são obrigatórios."
            });
        }

        // 2. Buscar usuário
        const [users] = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                password
            FROM users
            WHERE email = ?
            `,
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "E-mail ou senha inválidos."
            });
        }

        const user = users[0];

        // 3. Comparar senha
        const passwordIsValid = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordIsValid) {
            return res.status(401).json({
                message: "E-mail ou senha inválidos."
            });
        }

        // 4. Criar token JWT
        const token = jwt.sign(
            {
                userId: user.id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            }
        );

        // 5. Retornar dados
        return res.status(200).json({
            message: "Login realizado com sucesso!",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Erro no login:", error);

        return res.status(500).json({
            message: "Erro interno do servidor."
        });
    }
}

async function me(req, res) {
    try {
        const userId = req.userId;

        const [users] = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                created_at
            FROM users
            WHERE id = ?
            `,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "Usuário não encontrado."
            });
        }

        return res.status(200).json({
            user: users[0]
        });

    } catch (error) {
        console.error(
            "Erro ao buscar usuário:",
            error
        );

        return res.status(500).json({
            message: "Erro interno do servidor."
        });
    }
}

module.exports = {
    register,
    login,
    me
};