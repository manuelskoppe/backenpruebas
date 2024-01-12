// users.js
const express = require('express');
const router = express.Router();
const prisma = require("../prisma");

// Ruta para obtener los usuarios registrados
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany(); // Cambia 'user' por el modelo correcto si es diferente
    res.render('usuarios', { users }); // Asegúrate de que 'usuarios' sea el nombre correcto de tu vista de Handlebars.
  } catch (error) {
    res.status(500).send(error.message);
  }
});

module.exports = router;
