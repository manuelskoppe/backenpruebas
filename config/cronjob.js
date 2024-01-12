const cron = require("node-cron");

const transporter = require("./nodemailer");
const prisma = require("../prisma");

cron.schedule("*/5 * * * * *", async () => {
  const users = await prisma.user.findMany();

  users.forEach((user) => {
    if (!user.isAdmin) {
      transporter.sendMail({
        from: "TheBridge",
        to: user.email,
        subject: "Feedback",
        html: `<h1>Feedback</h1>
        <p>Recuerda que tienes que completar el feedback</p>
        <a href="http://localhost:3000">Feedback homepage</a>
        `,
      });

      console.log("Email sent to user", user.username);
    }
  });
});