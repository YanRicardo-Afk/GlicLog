const pool = require("../config/database");

async function createGlucose(req, res) {
    try {
        const userId = req.userId;

        const {
            glucoseValue,
            measurementType,
            measurementTime,
            meal,
            notes
        } = req.body;
        console.log("BODY RECEBIDO PELO BACKEND:", req.body);

console.log("HORÁRIO RECEBIDO:", measurementTime);

        // Validar valor obrigatório
        if (
            glucoseValue === undefined ||
            glucoseValue === null
        ) {
            return res.status(400).json({
                message: "O valor da glicemia é obrigatório."
            });
        }

        // Validar horário
        if (!measurementTime) {
            return res.status(400).json({
                message: "O horário da medição é obrigatório."
            });
        }

        // Converter glicemia para número
        const glucose = Number(glucoseValue);

        // Verificar se é um número válido
        if (
            Number.isNaN(glucose) ||
            glucose < 0
        ) {
            return res.status(400).json({
                message: "O valor da glicemia é inválido."
            });
        }

        const [result] = await pool.query(
            `
            INSERT INTO glucose_records
            (
                user_id,
                glucose_value,
                measurement_type,
                measurement_time,
                meal,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                userId,
                glucose,
                measurementType || null,
                measurementTime,
                meal || null,
                notes || null
            ]
        );

        return res.status(201).json({
            message: "Glicemia registrada com sucesso!",
            glucose: {
                id: result.insertId,
                userId,
                glucoseValue: glucose,
                measurementType: measurementType || null,
                measurementTime,
                meal: meal || null,
                notes: notes || null
            }
        });

    } catch (error) {
        console.error(
            "Erro ao registrar glicemia:",
            error
        );

        return res.status(500).json({
            message: "Erro interno do servidor."
        });
    }
}

async function getGlucoseRecords(req, res) {
    try {
        const userId = req.userId;

        const [records] = await pool.query(
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
            ORDER BY created_at DESC
            `,
            [userId]
        );

        return res.status(200).json({
            records
        });

    } catch (error) {
        console.error(
            "Erro ao buscar glicemias:",
            error
        );

        return res.status(500).json({
            message: "Erro interno do servidor."
        });
    }
}
async function getGlucoseById(req, res) {
    try {
        const userId = req.userId;

        const { id } = req.params;

        const [records] = await pool.query(
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
            WHERE id = ?
            AND user_id = ?
            `,
            [
                id,
                userId
            ]
        );

        if (records.length === 0) {
            return res.status(404).json({
                message: "Registro de glicemia não encontrado."
            });
        }

        return res.status(200).json({
            glucose: records[0]
        });

    } catch (error) {
        console.error(
            "Erro ao buscar glicemia:",
            error
        );

        return res.status(500).json({
            message: "Erro interno do servidor."
        });
    }
}

async function updateGlucose(req, res) {
    try {
        const userId = req.userId;

        const { id } = req.params;

        const {
            glucoseValue,
            measurementType,
            measurementTime,
            meal,
            notes
        } = req.body;

        // Verificar se o registro pertence ao usuário
        const [existingRecords] = await pool.query(
            `
            SELECT id
            FROM glucose_records
            WHERE id = ?
            AND user_id = ?
            `,
            [
                id,
                userId
            ]
        );

        if (existingRecords.length === 0) {
            return res.status(404).json({
                message: "Registro de glicemia não encontrado."
            });
        }

        // Validar glicemia
        if (
            glucoseValue === undefined ||
            glucoseValue === null
        ) {
            return res.status(400).json({
                message: "O valor da glicemia é obrigatório."
            });
        }

        const glucose = Number(glucoseValue);

        if (
            Number.isNaN(glucose) ||
            glucose < 0
        ) {
            return res.status(400).json({
                message: "O valor da glicemia é inválido."
            });
        }

        // Validar horário
        if (!measurementTime) {
            return res.status(400).json({
                message: "O horário da medição é obrigatório."
            });
        }

        await pool.query(
            `
            UPDATE glucose_records
            SET
                glucose_value = ?,
                measurement_type = ?,
                measurement_time = ?,
                meal = ?,
                notes = ?
            WHERE id = ?
            AND user_id = ?
            `,
            [
                glucose,
                measurementType || null,
                measurementTime,
                meal || null,
                notes || null,
                id,
                userId
            ]
        );

        return res.status(200).json({
            message: "Registro atualizado com sucesso!"
        });

    } catch (error) {
        console.error(
            "Erro ao atualizar glicemia:",
            error
        );

        return res.status(500).json({
            message: "Erro interno do servidor."
        });
    }
}

async function deleteGlucose(req, res) {
    try {
        const userId = req.userId;

        const { id } = req.params;

        const [result] = await pool.query(
            `
            DELETE FROM glucose_records
            WHERE id = ?
            AND user_id = ?
            `,
            [
                id,
                userId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Registro de glicemia não encontrado."
            });
        }

        return res.status(200).json({
            message: "Registro excluído com sucesso!"
        });

    } catch (error) {
        console.error(
            "Erro ao excluir glicemia:",
            error
        );

        return res.status(500).json({
            message: "Erro interno do servidor."
        });
    }
}

module.exports = {
    createGlucose,
    getGlucoseRecords,
    getGlucoseById,
    updateGlucose,
    deleteGlucose
};