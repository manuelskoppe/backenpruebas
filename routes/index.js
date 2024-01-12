//index.js

const express = require("express");
const isAuthenticated = require("../middlewares/isAuthenticated");
const router = express.Router();
const userRoutes = require("./usuarios"); // Importar el nuevo archivo de ruta de usuarios

// Importar rutas
const forumRoutes = require("./forum");
const feedbackRoutes = require("./feedback");
const commentsRoutes = require("./comments"); // Asegúrate de que esto coincida con la variable que usas abajo

// Rutas adicionales
router.use("/auth", require("./auth"));
router.use("/", isAuthenticated, require("./home"));
router.use("/profile", isAuthenticated, require("./profile"));
router.use("/usuarios", isAuthenticated, userRoutes);

// Montar rutas de forum, feedback y comentarios
router.use("/forum", isAuthenticated, forumRoutes);
router.use("/feedback", isAuthenticated, feedbackRoutes);
router.use("/comments", isAuthenticated, commentsRoutes); // Usa la misma variable que definiste arriba

// Montar otras rutas como antes

module.exports = router;
