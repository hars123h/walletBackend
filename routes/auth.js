const express = require('express');

const {
    register,
    login

} = require('../controllers/auth');


const router = express.Router();


router.get("/register", register)

router.get("/login", login)



module.exports = router;