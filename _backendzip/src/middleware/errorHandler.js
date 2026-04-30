const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Erreur serveur interne';

  // Erreur de duplicate MongoDB (ex: email déjà utilisé)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field === 'email' ? 'Cet email' : 'Cette valeur'} est déjà utilisé(e).`;
    statusCode = 400;
  }

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(e => e.message).join('. ');
    statusCode = 400;
  }

  // Erreur de cast (ID invalide)
  if (err.name === 'CastError') {
    message = `Ressource introuvable (ID invalide : ${err.value})`;
    statusCode = 404;
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    message = 'Token JWT invalide.';
    statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    message = 'Token JWT expiré.';
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
