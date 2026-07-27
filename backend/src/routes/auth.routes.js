const express = require("express");

const {
    register,
    login,
    me
} = require("../controllers/auth.controller");

const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

// Cadastro
router.post(
    "/register",
    register
);

// Login
router.post(
    "/login",
    login
);

// Usuário autenticado
router.get(
    "/me",
    authMiddleware,
    me
);

module.exports = router;