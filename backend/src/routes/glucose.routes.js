const express = require("express");

const {
    createGlucose,
    getGlucoseRecords,
    getGlucoseById,
    updateGlucose,
    deleteGlucose
} = require("../controllers/glucose.controller");

const {
    generateGlucosePdf
} = require("../controllers/glucoseReport.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

/*
 * Todas as rotas de glicemia precisam
 * que o usuário esteja autenticado.
 */
router.use(authMiddleware);

/* ============================================================
Relatório em PDF

IMPORTANTE:
Esta rota precisa ficar antes da rota "/:id".

Caso ela fique depois, o Express pode interpretar
a palavra "report" como se fosse o ID de um registro.
============================================================ */

router.get(
    "/report/pdf",
    generateGlucosePdf
);

/* ============================================================
Criar registro
============================================================ */

router.post(
    "/",
    createGlucose
);

/* ============================================================
Listar registros
============================================================ */

router.get(
    "/",
    getGlucoseRecords
);

/* ============================================================
Buscar registro específico
============================================================ */

router.get(
    "/:id",
    getGlucoseById
);

/* ============================================================
Atualizar registro
============================================================ */

router.put(
    "/:id",
    updateGlucose
);

/* ============================================================
Excluir registro
============================================================ */

router.delete(
    "/:id",
    deleteGlucose
);

module.exports = router;