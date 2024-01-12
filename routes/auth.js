// routes/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const passport = require("passport");
const prisma = require("../prisma");
//http://localhost:3000/api-docs/#/Users/post_register


/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: This route registers a new user with an email and password.
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 required: true
 *                 description: Email for the new user
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 required: true
 *                 description: Password for the new user
 *                 example: pa$$word
 *     responses:
 *       302:
 *         description: Redirect to the login page on successful registration
 *       404:
 *         description: Not found - the requested resource does not exist
 *       500:
 *         description: Internal server error
 */




// Ruta de registro
router.post("/register", async (req, res) => {
  try {
    // Linea para encriptar la contraseña
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const newUser = await prisma.user.create({
      data: {
        email: req.body.email,
        password: hashedPassword,
      },
    });
    res.redirect("/auth/login-page");
  } catch (error) {
    console.log(error);
    res.redirect("/auth/register-page");
  }
});
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticates a user with email and password using Passport's local strategy.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 required: true
 *                 description: Registered email of the user
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 required: true
 *                 description: Password for the account
 *                 example: pa$$word
 *     responses:
 *       302:
 *         description: Redirects to the home page upon successful login
 *       401:
 *         description: Redirects back to the login page if authentication fails
 */

// Ruta de inicio de sesión, ejecuta la estrategia local de passport
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/auth/login-page",
    failureFlash: true,
  })
);

router.get("/login-page", (req, res) => {
  res.render("login", { error: req.flash("error") });
});

router.get("/register-page", (req, res) => {
  res.render("register", { error: req.flash("error") });
});

// Ruta de logout - Cambia 'auth/logout' a '/auth/logout'
router.post('/logout', (req, res) => {
  req.logout(function(err) {
    if (err) { 
      return next(err); 
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
});

module.exports = router;
