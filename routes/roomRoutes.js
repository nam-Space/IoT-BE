const express = require('express')
const { getAllRoom, findOneRoom, createRoom, editRoom, deleteRoom } = require('../controllers/roomController')
const { verifyToken } = require('../middlewares/verifyToken')

const router = express.Router()

router.get('/', verifyToken, getAllRoom)
router.get('/:id', verifyToken, findOneRoom)
router.post('/create', verifyToken, createRoom)
router.post('/update', verifyToken, editRoom)
router.delete('/delete/:id', verifyToken, deleteRoom)

module.exports = router;