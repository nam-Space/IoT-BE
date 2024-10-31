const express = require('express')
const { loginUser, logoutUser, createUser, getAllUsers, updateUser, deleteUser } = require('../controllers/userController')
const { verifyToken } = require('../middlewares/verifyToken')

const router = express.Router()

router.post('/create', verifyToken, createUser)
router.post('/login', loginUser)
router.post('/logout', logoutUser)
router.post('/update', verifyToken, updateUser)
router.delete('/delete/:id', verifyToken, deleteUser)
router.get('/', verifyToken, getAllUsers)

module.exports = router;