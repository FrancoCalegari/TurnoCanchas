const rateLimit = require('express-rate-limit');

// Limitador estricto para intentos de inicio de sesión
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Limitar cada IP a 5 solicitudes de login por ventana
    message: { error: 'Demasiados intentos de inicio de sesión fallidos, por favor intenta de nuevo en 15 minutos.' },
    standardHeaders: true, // Retorna rate limit info en los headers `RateLimit-*`
    legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
});

module.exports = {
    loginLimiter
};
