const express = require('express');

const { place_recharge, register, login, forgotPassword, 
        purchase, reset_login_password, bank_details, feedback,
        update_recharge, place_withdrawal, update_withdrawal, get_all_recharges, get_user_count, get_all_withdrawals,
        get_all_users, update_earning
    } = require('../controllers/auth');

const router = express.Router();

router.post("/register", register)
router.post("/login", login);
router.post("/forgot_password", forgotPassword);
router.post("/purchase", purchase);
router.post('/reset_login_password', reset_login_password);
router.post('/bank_details', bank_details);
router.post('/place_recharge', place_recharge);
router.post('/feedback', feedback)
router.post('/update_recharge_status', update_recharge);
router.post('/place_withdrawal', place_withdrawal);
router.post('/update_withdrawal_status', update_withdrawal);
router.post('/update_earning', update_earning);

router.get('/get_all_recharges', get_all_recharges);
router.get('/get_all_withdrawals', get_all_withdrawals);
router.get('/get_user_count', get_user_count);
router.get('/get_all_users', get_all_users);

module.exports = router;