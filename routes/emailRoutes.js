const express = require('express');
const { send, sendOtp, resetOtp } = require('../controllers/emailController.js');

const router = express.Router();

router.post('/send-email', send);
// router.post('/send-otp', sendOtp);
// router.post('/send-reset-otp', resetOtp);

module.exports = router;
