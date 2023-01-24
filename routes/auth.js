const express = require('express');

const { register, login, forgotPassword, purchase, reset_login_password, bank_details} = require('../controllers/auth');

const router = express.Router();

router.post("/register", register)
router.post("/login", login);
router.post("/forgot_password", forgotPassword);
router.post("/purchase", purchase);
router.post('/reset_login_password', reset_login_password);
router.post('/bank_details', bank_details);


module.exports = router;