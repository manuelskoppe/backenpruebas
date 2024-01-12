// routes/.js
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();
const passport = require("passport");
const prisma = require("../prisma");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Configuración temporal de almacenamiento
const cloudinary = require('../config/cloudinary'); // Importa la configuración de Cloudinary

// Uncomment the isAuthenticated middleware definition or ensure it is imported if defined in another file.
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) { // This assumes you are using Passport.js
    return next();
  }
  res.redirect("/auth/login-page");
};

router.get('/', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        user: true, // This includes the information of the associated user for each post
      },
    });
    res.render('forum', { posts: posts });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al obtener los posts del foro.");
  }
});


/**
 * @swagger
 * /create-post:
 *   post:
 *     summary: Create a new post
 *     description: Allows a user to create a new post with a body and a frustration level.
 *     tags: [Posts]
 *     security:
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *               - frustrationLevel
 *             properties:
 *               body:
 *                 type: string
 *                 description: Content of the post
 *               frustrationLevel:
 *                 type: integer
 *                 description: Level of frustration from 1 to 10
 *     responses:
 *       302:
 *         description: Redirects to the forum page after successful creation of the post
 *       400:
 *         description: Bad request if the frustration level is not a number
 *       401:
 *         description: Unauthorized if the user is not logged in
 *       500:
 *         description: Internal server error if the post cannot be created
 */
//create-post
router.post('/create-post', isAuthenticated, upload.single('image'), async (req, res) => {
  const { body, frustrationLevel } = req.body;
  const userId = req.user.id;

  // Convertir frustrationLevel a un número y asegurarse de que no sea NaN
  const frustrationLevelNumber = parseInt(frustrationLevel, 10);
  if (isNaN(frustrationLevelNumber)) {
    // Manejar el error de manera apropiada
    return res.status(400).send("Nivel de frustración debe ser un número.");
  }

  try {
    // Subir la imagen a Cloudinary, si hay una imagen en la solicitud
    let imageUrl = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      imageUrl = result.secure_url;
    }

    // Crear el post con la URL de la imagen, si existe
    const newPost = await prisma.post.create({
      data: {
        body: body,
        frustrationLevel: frustrationLevelNumber,
        userId: userId,
        ...(imageUrl && { imageUrl: imageUrl }), // Agregar imageUrl al objeto data si existe
      },
    });

    res.redirect('/forum');
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).send("No se pudo crear el post.");
  }
});

/**
 * @swagger
 * /post/{id}:
 *   get:
 *     summary: Retrieve a specific post
 *     description: Get a single post by its ID along with the author and comments.
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique identifier of the post
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A single post with author and comments.
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *               description: HTML page with the post details
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal Server Error
 */
//Recuperar y mostrar un post individual basado en su ID.
router.get('/post/:id', async (req, res) => {
  const postId = req.params.id;
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: true, // Include the post's author
        comments: {
          include: {
            user: true // Include the author of each comment
          }
        },
      },
    });

    if (!post) {
      return res.status(404).send("Post not found");
    }

    res.render('post', { post }); // Ensure you have a 'post' view set up
  } catch (error) {
    console.error("Error retrieving individual post:", error);
    res.status(500).send("Internal Server Error");
  }
});

/**
 * @swagger
 * /post/{id}/delete:
 *   post:
 *     summary: Delete a specific post
 *     description: Deletes a post by its ID, if the authenticated user is the owner of the post.
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique identifier of the post to be deleted
 *         schema:
 *           type: string
 *     security:
 *     responses:
 *       302:
 *         description: Redirects to the forum page after successful deletion of the post
 *       403:
 *         description: Forbidden if the user is not the owner of the post
 *       404:
 *         description: Post not found
 *       500:
 *         description: Internal Server Error if there was a problem deleting the post
 */
// Delete a post
router.post('/post/:id/delete', isAuthenticated, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.id; // The ID of the user requesting the delete

  try {
    // Retrieve the post to check if the current user is the owner
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Optional: Check if the user is the owner of the post or an admin
    if (post.userId !== userId /* && !req.user.isAdmin */) {
      return res.status(403).send("You do not have permission to delete this post");
    }

    // Delete comments associated with the post first
    await prisma.comment.deleteMany({
      where: { postId: postId },
    });

    // Then delete the post
    await prisma.post.delete({
      where: { id: postId },
    });

    res.redirect('/forum');
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).send("Error al eliminar el post.");
  }
});

/**
 * @swagger
 * /post/{id}/edit:
 *   post:
 *     summary: Edit a specific post
 *     description: Allows the owner of the post to edit its content.
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique identifier of the post to be edited
 *         schema:
 *           type: string
 *     security:
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               editedPost:
 *                 type: string
 *                 description: The new content of the post
 *     responses:
 *       302:
 *         description: Redirects to the updated post page after successful edit
 *       403:
 *         description: Forbidden if the user is not the owner of the post
 *       404:
 *         description: Post not found if the post with the given ID does not exist
 *       500:
 *         description: Internal Server Error if there was a problem editing the post
 */

// Edit a post
router.post('/post/:id/edit', isAuthenticated, async (req, res) => {
  const postId = req.params.id;
  const { editedPost } = req.body;
  const userId = req.user.id; // The ID of the user requesting the edit

  try {
    // Retrieve the post to check if the current user is the owner
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Optional: Check if the user is the owner of the post
    if (post.userId !== userId /* && !req.user.isAdmin */) {
      return res.status(403).send("You do not have permission to edit this post");
    }

    // Update the post with the new content
    await prisma.post.update({
      where: { id: postId },
      data: { body: editedPost },
    });

    res.redirect(`/forum/post/${postId}`);
  } catch (error) {
    console.error("Error editing post:", error);
    res.status(500).send("Error al editar el post.");
  }
});




module.exports = router;
