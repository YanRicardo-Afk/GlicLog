const mysql = require("mysql2/promise");
require("dotenv").config();

async function createDatabase() {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        console.log("Conectado ao servidor MySQL.");

        const databaseName = process.env.DB_NAME;

        await connection.query(
            `CREATE DATABASE IF NOT EXISTS \`${databaseName}\`
             CHARACTER SET utf8mb4
             COLLATE utf8mb4_unicode_ci`
        );

        console.log(`Banco de dados "${databaseName}" criado/verificado.`);

        await connection.query(
            `USE \`${databaseName}\``
        );

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB
            DEFAULT CHARSET=utf8mb4
            COLLATE=utf8mb4_unicode_ci
        `);

        console.log("Tabela users criada/verificada.");

await connection.query(`
    CREATE TABLE IF NOT EXISTS glucose_records (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

        user_id INT UNSIGNED NOT NULL,

        glucose_value DECIMAL(6,2) NOT NULL,

        measurement_type VARCHAR(50),

        measurement_time TIME NOT NULL,

        meal VARCHAR(100),

        notes TEXT,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_glucose_user
            FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
            ON UPDATE CASCADE,

        INDEX idx_glucose_user (user_id),

        INDEX idx_glucose_measurement_time
            (measurement_time)

    ) ENGINE=InnoDB
    DEFAULT CHARSET=utf8mb4
    COLLATE=utf8mb4_unicode_ci
`);

        console.log(
            "Tabela glucose_records criada/verificada."
        );

        console.log("");
        console.log("Banco de dados configurado com sucesso!");
        console.log("GlicLog está pronto para usar.");

    } catch (error) {

        console.error(
            "Erro ao criar o banco de dados:"
        );

        console.error(error.message);

        process.exitCode = 1;

    } finally {

        if (connection) {
            await connection.end();
        }
    }
}

createDatabase();