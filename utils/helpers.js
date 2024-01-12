// utils/helpers.js

// Define a custom Handlebars helper called 'isAuthor'
module.exports = {
    isAuthor: function (postUserId, currentUserId) {
      return postUserId === currentUserId;
    },
    // You can define other helpers here if needed
  };
  