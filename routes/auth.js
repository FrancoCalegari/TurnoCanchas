const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

router.post('/login', authController.login);
router.post('/masterlogin', authController.masterLogin);
router.post('/cliente/register', authController.registerClient);
router.post('/cliente/login', authController.loginClient);

module.exports = router;
