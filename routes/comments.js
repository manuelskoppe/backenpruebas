// comments.js
const express = require("express");
const router = express.Router();
const prisma = require("../prisma");
const isAuthenticated = require("../middlewares/isAuthenticated");
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Configuración temporal de almacenamiento
const cloudinary = require('../config/cloudinary'); // Importa la configuración de Cloudinary

/**
 * @swagger
 * /post/{id}/comment:
 *   post:
 *     summary: Post a comment on an individual post
 *     description: Allows an authenticated user to post a comment on a specific post, with an optional image.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Unique identifier of the post to comment on
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               comment:
 *                 type: string
 *                 description: The text of the comment
 *                 required: true
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: An optional image file to upload with the comment
 *     responses:
 *       302:
 *         description: Redirects to the individual post page after successful comment posting
 *       400:
 *         description: Bad request if the comment text is missing
 *       401:
 *         description: Unauthorized if the user is not logged in
 *       500:
 *         description: Internal Server Error if there was a problem posting the comment
 */

// Ruta para publicar un comentario en un post individual con una imagen opcional
router.post('/post/:id/comment', isAuthenticated, upload.single('image'), async (req, res) => {
  const postId = req.params.id;
  const { comment } = req.body; // El texto del comentario
  const userId = req.user.id; // El ID del usuario que publica el comentario
  const imageFile = req.file; // El archivo de imagen

  console.log("Archivo recibido:", imageFile); // Muestra información sobre el archivo recibido

  try {
    let imageUrl = null;
    if (imageFile) {
      console.log("Subiendo imagen a Cloudinary...");
      const result = await cloudinary.uploader.upload(imageFile.path);
      imageUrl = result.secure_url;
      console.log("Imagen subida a Cloudinary, URL:", imageUrl);
    } else {
      console.log("No se ha proporcionado ninguna imagen.");
    }

    // Crea el comentario en la base de datos con o sin URL de imagen
    console.log("Creando comentario en la base de datos...");
    await prisma.comment.create({
      data: {
        body: comment,
        postId: postId,
        userId: userId,
        imageUrl: imageUrl // URL de la imagen (puede ser null si no se proporcionó imagen)
      },
    });
    console.log("Comentario creado con éxito.");
    res.redirect(`/forum/post/${postId}`);
  } catch (error) {
    console.error("Error posting comment:", error);
    res.status(500).send("Error al publicar el comentario.");
  }
});

/**
 * @swagger
 * /comment/{commentId}/delete:
 *   post:
 *     summary: Delete a specific comment
 *     description: Allows an authenticated user to delete a specific comment.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         description: Unique identifier of the comment to be deleted
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comment successfully deleted
 *       401:
 *         description: Unauthorized if the user is not logged in
 *       500:
 *         description: Internal Server Error if there was a problem deleting the comment
 */
// Ruta para eliminar un comentario
router.post('/comment/:commentId/delete', isAuthenticated, async (req, res) => {
  const commentId = req.params.commentId;

  try {
    await prisma.comment.delete({
      where: {
        id: commentId,
      },
    });
    res.sendStatus(200); // Comentario eliminado con éxito
  } catch (error) {
    console.error('Error deleting comment', error);
    res.sendStatus(500);
  }
});
/**
 * @swagger
 * /comment/{commentId}/reply:
 *   post:
 *     summary: Reply to a specific comment
 *     description: Allows an authenticated user to reply to a specific comment.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         description: Unique identifier of the parent comment to reply to
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reply:
 *                 type: string
 *                 description: The text of the reply
 *                 required: true
 *     responses:
 *       302:
 *         description: Redirects back to the original post after successful reply posting
 *       401:
 *         description: Unauthorized if the user is not logged in
 *       500:
 *         description: Internal Server Error if there was a problem posting the reply
 */

// Ruta para responder a un comentario
// Asegúrate de tener 'upload' y 'cloudinary' configurados como en tu otra ruta
router.post('/comment/:commentId/reply', isAuthenticated, upload.single('replyImage'), async (req, res) => {
  const parentCommentId = req.params.commentId;
  const { reply } = req.body; // El texto de la respuesta
  const userId = req.user.id; // El ID del usuario que responde
  const replyImageFile = req.file; // El archivo de imagen para la respuesta

  console.log("Archivo recibido para respuesta:", replyImageFile);

  try {
    let replyImageUrl = null;
    if (replyImageFile) {
      console.log("Subiendo imagen de respuesta a Cloudinary...");
      const result = await cloudinary.uploader.upload(replyImageFile.path);
      replyImageUrl = result.secure_url;
      console.log("Imagen de respuesta subida a Cloudinary, URL:", replyImageUrl);
    } else {
      console.log("No se ha proporcionado ninguna imagen para la respuesta.");
    }

    // Encuentra el comentario padre
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentCommentId },
    });
    const postId = parentComment.postId;

    // Crea la respuesta en la base de datos con o sin URL de imagen
    console.log("Creando respuesta en la base de datos...");
    await prisma.comment.create({
      data: {
        body: reply,
        parentId: parentCommentId,
        userId: userId,
        postId: postId,
        imageUrl: replyImageUrl // URL de la imagen de la respuesta (puede ser null si no se proporcionó imagen)
      },
    });
    console.log("Respuesta creada con éxito.");
    res.redirect('back'); // O redirige a la ubicación que prefieras
  } catch (error) {
    console.error("Error posting reply:", error);
    res.status(500).send("Error al publicar la respuesta.");
  }
});


/**
 * @swagger
 * /comment/{commentId}/edit:
 *   post:
 *     summary: Edit a specific comment
 *     description: Allows the author of a comment to edit it.
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         description: Unique identifier of the comment to be edited
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               editedComment:
 *                 type: string
 *                 description: The edited text of the comment
 *     responses:
 *       302:
 *         description: Redirects back to the original post after successful comment editing
 *       403:
 *         description: Forbidden if the user is not the author of the comment
 *       500:
 *         description: Internal Server Error if there was a problem editing the comment
 */

// Ruta para editar un comentario
router.post('/comment/:commentId/edit', isAuthenticated, async (req, res) => {
  const commentId = req.params.commentId;
  const { editedComment } = req.body; // El texto del comentario editado
  const userId = req.user.id; // El ID del usuario que edita el comentario

  try {
    // Encuentra el comentario original
    const originalComment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    // Verifica si el usuario actual es el autor del comentario
    if (originalComment.userId !== userId) {
      return res.status(403).send("No autorizado para editar este comentario.");
    }

    // Actualiza el comentario en la base de datos
    await prisma.comment.update({
      where: {
        id: commentId,
      },
      data: {
        body: editedComment, // Actualiza el cuerpo del comentario
      },
    });
    res.redirect('back'); // Redirige de vuelta al post original
  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).send("Error al editar el comentario.");
  }
});




module.exports = router;
