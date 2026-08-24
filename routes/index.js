const express = require('express');
const router = express.Router();

const canchasRoutes = require('./canchas');
const reservasRoutes = require('./reservas');
const usuariosRoutes = require('./usuarios');
const plataformaRoutes = require('./plataforma');
const authRoutes = require('./auth');
const ajustesRoutes = require('./ajustes');
const tenantsRoutes = require('./tenants');
const rubrosRoutes = require('./rubros');

router.use('/canchas', canchasRoutes);
router.use('/reservas', reservasRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/plataforma', plataformaRoutes);
router.use('/auth', authRoutes);
router.use('/ajustes', ajustesRoutes);
router.use('/tenants', tenantsRoutes);
router.use('/rubros', rubrosRoutes);
router.use('/planes', require('./planes'));

module.exports = router;

