const express = require("express")
const router = express.Router()

const userController = require("../controller/user.controller")

router.post("/user/login", userController.login)
router.post("/user/register", userController.register)
router.post("/protected/user/convert", userController.genAndBirthday)



module.exports = router