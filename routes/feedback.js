const express = require("express");
const prisma = require("../prisma");
const isAdmin = require("../middlewares/isAdmin");
const transporter = require("../config/nodemailer");
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const newFeedback = await prisma.post.create({
      data: {
        userId: req.user.id,
        frustrationLevel: parseInt(req.body["frustration-level"]),
        body: req.body.feedback,
      },
    });

    transporter.sendMail({
      from: "manuelskoppe@gmail.com",
      to: "lemonadahard@gmail.com",
      subject: "Feedback",
      html: `<h1>Feedback</h1>
      <p>El pesado de ${req.user.username} ha escrito esto:</p>
      <img src="${req.user.photo}" alt="${req.user.username}" />
      <p>${req.body.feedback}</p>
      <p>Y su nivel de frustración es de ${req.body["frustration-level"]}</p>`,
    });

    res.render("homepage", { message: "Formulario enviado correctamente" });
  } catch (error) {
    console.log(error);
    res.render("homepage", { error: "Error al enviar el feedback" });
  }
});

router.get("/students", isAdmin, async (req, res) => {
  try {
    const feedbacks = await prisma.post.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true,
            photo: true,
          },
        },
      },
    });
    res.render("feedbacks", { user: req.user, feedbacks });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
});

module.exports = router;
