const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios');

router.post('/registro', usuariosController.register);
router.post('/login', usuariosController.login);
router.get('/perfil', usuariosController.getProfile); // Requiere auth middleware
router.put('/perfil', usuariosController.updateProfile);

module.exports = router;
