const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

router.post('/login', authController.login);
router.post('/masterlogin', authController.masterLogin);
router.post('/cliente/register', authController.registerClient);
router.post('/cliente/login', authController.loginClient);

router.post('/cliente/forgot-password', authController.forgotPasswordClient);
router.post('/cliente/reset-password', authController.resetPasswordClient);

module.exports = router;
