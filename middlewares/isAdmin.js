function isAdmin(req, res, next) {
  console.log('User:', req.user); // Debugging line to check the user object
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.redirect('/');
  }
}


module.exports = isAdmin;
