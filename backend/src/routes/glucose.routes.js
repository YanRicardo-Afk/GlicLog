const express = require("express");

const {
    createGlucose,
    getGlucoseRecords,
    getGlucoseById,
    updateGlucose,
    deleteGlucose
} = require("../controllers/glucose.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// Todas as rotas de glicemia precisam de login
router.use(authMiddleware);

// Criar registro
router.post(
    "/",
    createGlucose
);

// Listar registros
router.get(
    "/",
    getGlucoseRecords
);

// Buscar registro específico
router.get(
    "/:id",
    getGlucoseById
);

// Atualizar registro
router.put(
    "/:id",
    updateGlucose
);

// Excluir registro
router.delete(
    "/:id",
    deleteGlucose
);

module.exports = router;