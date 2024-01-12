
//profile.js

const express = require('express');
const router = express.Router();

const prisma = require('../prisma');
const upload = require('../config/multer');
const handleUpload = require('../middlewares/handleUpload');

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Retrieve user profile
 *     description: Retrieve a list of weekly posts made by the logged-in user.
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: The user's weekly posts.
 *       401:
 *         description: Unauthorized if the user is not logged in.
 */

router.get('/', async (req, res) => {
  const weeklies = await prisma.post.findMany({
    where: {
      userId: req.user.id,
    },
  });

  res.render('profile', { user: req.user, weeklies });
});

/**
 * @swagger
 * /profile/update:
 *   get:
 *     summary: Profile update form
 *     description: Renders a form for updating user profile details.
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: The profile update form.
 *       401:
 *         description: Unauthorized if the user is not logged in.
 */



router.get('/update', (req, res) => {
  res.render('profile-form', { user: req.user });
});

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the logged-in user's profile information with a new photo and details.
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: The new username
 *               email:
 *                 type: string
 *                 description: The new email address
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: The new profile photo
 *               country:
 *                 type: string
 *                 description: The new country of residence
 *               age:
 *                 type: integer
 *                 description: The new age
 *               profession:
 *                 type: string
 *                 description: The new profession
 *     responses:
 *       302:
 *         description: Redirect to the profile page on successful update.
 *       401:
 *         description: Unauthorized if the user is not logged in.
 *       500:
 *         description: Server error if the update fails.
 */

router.put('/', upload.single('photo'), async (req, res) => {
  try {
    const b64 = Buffer.from(req.file.buffer).toString("base64");
    let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
  
    const cldRes = await handleUpload(dataURI);
  
    const userUpdated = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: {
        username: req.body.username,
        email: req.body.email,
        photo: cldRes.secure_url,
        country: req.body.country,
        age: Number(req.body.age),
        profession: req.body.profession,
      },
    });
  
    res.redirect('/profile'); 
  } catch (error) {
    console.log(error);
    res.redirect('/profile');
  }
});



module.exports = router;
