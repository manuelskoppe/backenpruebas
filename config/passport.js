// config/passport.js
const LocalStrategy = require("passport-local").Strategy;
const passport = require("passport");
const prisma = require("../prisma");
const bcrypt = require("bcrypt");

// Configuración de la estrategia local en este caso del signin/login con usuario y contraseña
passport.use(
  new LocalStrategy(
    async (username, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email: username },
        });
        if (!user) {
          return done(null, false, { message: "Usuario no encontrado" });
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return done(null, false, { message: "Contraseña incorrecta" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Con esta linea podemos decir a passport con que propriedad puede reconocer al usuario
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Con esta configuración podemos decir a passport que datos del usuario quiero en req.user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
